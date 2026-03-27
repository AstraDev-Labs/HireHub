"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Search, Send, User as UserIcon, Bell, Info, MessageSquare, Paperclip, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EncryptionManager } from '@/lib/encryption';
import { cn } from '@/lib/utils';

interface Message {
    _id: string;
    senderId: any;
    receiverId?: any;
    senderName: string;
    senderRole: string;
    receiverRole?: string;
    subject?: string;
    content: string;
    type: string;
    createdAt: string;
    readBy: string[];
    isEncrypted?: boolean;
    attachments?: {
        url: string;
        filename: string;
        fileType: string;
    }[];
}

const DecryptedContent = ({ content, isEncrypted, privateKey }: { content: string, isEncrypted?: boolean, privateKey: CryptoKey | null }) => {
    const [decrypted, setDecrypted] = useState<string>(isEncrypted ? 'Decrypting...' : content);

    useEffect(() => {
        const doDecrypt = async () => {
            if (isEncrypted && privateKey) {
                try {
                    const data = JSON.parse(content);
                    const result = await EncryptionManager.decrypt(data, privateKey);
                    setDecrypted(result);
                } catch (err) {
                    console.error("Decryption error:", err);
                    setDecrypted("[Decryption Failed]");
                }
            } else if (isEncrypted && !privateKey) {
                setDecrypted("[Security Key Missing]");
            } else {
                setDecrypted(content);
            }
        };
        doDecrypt();
    }, [content, isEncrypted, privateKey]);

    return <span>{decrypted}</span>;
};


export default function MessagesPage() {
    const { user, privateKey: contextPrivateKey } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    // Reply and Attachment State
    const [replyContent, setReplyContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Use the private key from context
    const myPrivateKey = contextPrivateKey || null;

    // Compose State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeType, setComposeType] = useState('DIRECT'); // DIRECT or ANNOUNCEMENT
    const [receiverId, setReceiverId] = useState('');
    const [receiverRole, setReceiverRole] = useState('ALL');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    // Contacts search
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: "auto" | "smooth" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const fetchMessages = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const res = await api.get(`/messages?t=${Date.now()}`);
            setMessages(res.data.data.messages);
        } catch (error) {
            console.error(error);
            if (isInitial) toast.error("Failed to load messages");
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages(true);
        const interval = setInterval(() => fetchMessages(false), 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Auto-scroll when messages update or selected thread changes
    useEffect(() => {
        if (selectedMessage) {
            scrollToBottom(messages.length > 0 ? "smooth" : "auto");
        }
    }, [messages.length, selectedMessage?._id]);

    const handleSearchContacts = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setContacts([]);
            return;
        }
        try {
            const res = await api.get(`/messages/contacts?query=${q}`);
            setContacts(res.data.data.users);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.data;
        } catch (error) {
            console.error(error);
            throw new Error('File upload failed');
        }
    };

    const handleQuickReply = async () => {
        if ((!replyContent.trim() && !selectedFile) || !selectedMessage || isUploading) return;

        setIsUploading(true);
        let uploadedAttachments: any[] = [];
        if (selectedFile) {
            try {
                const uploaded = await handleUpload(selectedFile);
                uploadedAttachments.push(uploaded);
            } catch (error: any) {
                toast.error(error.message || "Failed to upload file");
                setIsUploading(false);
                return;
            }
        }

        // Reply to the other person in the conversation
        const replyToId = selectedMessage.senderId?._id === user?._id
            ? selectedMessage.receiverId?._id
            : selectedMessage.senderId?._id;

        if (!replyToId) {
            setIsUploading(false);
            return toast.error("Could not determine recipient");
        }

        try {
            let finalContent = replyContent;
            let isEncrypted = false;

            // Encrypt if receiver has a public key
            try {
                const res = await api.get(`/users/${replyToId}/public-key`);
                if (res.data.data.publicKey) {
                    const pubKey = await EncryptionManager.importPublicKey(res.data.data.publicKey);

                    const keysToEncryptFor = [pubKey];

                    // Add my own public key so I can read my sent message later
                    if (user?.publicKey) {
                        const myPubKey = await EncryptionManager.importPublicKey(user.publicKey);
                        keysToEncryptFor.push(myPubKey);
                    }

                    const encrypted = await EncryptionManager.encrypt(replyContent, keysToEncryptFor);
                    finalContent = JSON.stringify(encrypted);
                    isEncrypted = true;
                }
            } catch (err) {
                console.warn("Could not encrypt message, sending in plain text:", err);
            }

            await api.post('/messages', {
                type: 'DIRECT',
                receiverId: replyToId,
                subject: selectedMessage.subject ? (selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`) : '',
                content: finalContent,
                attachments: uploadedAttachments,
                isEncrypted
            });
            toast.success("Reply sent successfully!");
            setReplyContent('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (imageInputRef.current) imageInputRef.current.value = '';
            fetchMessages();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send reply");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!content.trim()) return toast.error("Message content is required");
        if (composeType === 'DIRECT' && !receiverId) return toast.error("Please select a recipient");

        try {
            let finalContent = content;
            let isEncrypted = false;

            if (composeType === 'DIRECT') {
                try {
                    const res = await api.get(`/users/${receiverId}/public-key`);
                    if (res.data.data.publicKey) {
                        const pubKey = await EncryptionManager.importPublicKey(res.data.data.publicKey);

                        const keysToEncryptFor = [pubKey];

                        // Add my own public key so I can read my sent message later
                        if (user?.publicKey) {
                            const myPubKey = await EncryptionManager.importPublicKey(user.publicKey);
                            keysToEncryptFor.push(myPubKey);
                        }

                        const encrypted = await EncryptionManager.encrypt(content, keysToEncryptFor);
                        finalContent = JSON.stringify(encrypted);
                        isEncrypted = true;
                    }
                } catch (err) {
                    console.warn("Could not encrypt message:", err);
                }
            }

            await api.post('/messages', {
                type: composeType,
                receiverId: composeType === 'DIRECT' ? receiverId : undefined,
                receiverRole: composeType === 'ANNOUNCEMENT' ? receiverRole : undefined,
                subject,
                content: finalContent,
                isEncrypted
            });
            toast.success("Message sent successfully!");
            setIsComposeOpen(false);
            setReceiverId('');
            setSubject('');
            setContent('');
            fetchMessages();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    };

    const markThreadAsRead = async (m: Message) => {
        try {
            await api.patch('/messages/read-thread', {
                otherUserId: m.senderId?._id === user?._id ? m.receiverId?._id : m.senderId?._id,
                subject: m.subject || '',
                type: m.type
            });

            // Update local state for all messages in this thread
            const baseSubject = (m.subject || '').replace(/^Re:\s*/i, '');
            const otherUserId = m.senderId?._id === user?._id ? m.receiverId?._id : m.senderId?._id;

            setMessages(prev => prev.map(msg => {
                const msgBaseSubject = (msg.subject || '').replace(/^Re:\s*/i, '');
                const msgOtherUserId = msg.senderId?._id === user?._id ? msg.receiverId?._id : msg.senderId?._id;

                const isSameThread = msg.type === m.type &&
                    msgBaseSubject === baseSubject &&
                    (m.type !== 'DIRECT' || msgOtherUserId === otherUserId);

                if (isSameThread && user && !msg.readBy.includes(user._id)) {
                    return { ...msg, readBy: [...msg.readBy, user._id] };
                }
                return msg;
            }));

            // Notify Sidebar to refresh count
            window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
        } catch (error) {
            console.error("Failed to mark thread as read:", error);
        }
    };

    const handleSelectMessage = (m: Message) => {
        setSelectedMessage(m);
        if (user) {
            // Check if there are any unread messages in this thread
            const baseSubject = (m.subject || '').replace(/^Re:\s*/i, '');
            const otherUserId = m.senderId?._id === user?._id ? m.receiverId?._id : m.senderId?._id;

            const hasUnread = messages.some(msg => {
                const msgBaseSubject = (msg.subject || '').replace(/^Re:\s*/i, '');
                const msgOtherUserId = msg.senderId?._id === user?._id ? msg.receiverId?._id : msg.senderId?._id;

                return msg.type === m.type &&
                    msgBaseSubject === baseSubject &&
                    (m.type !== 'DIRECT' || msgOtherUserId === otherUserId) &&
                    !msg.readBy.includes(user._id) &&
                    msg.senderId?._id !== user._id;
            });

            if (hasUnread) {
                markThreadAsRead(m);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading messages...</div>;

    const groupedMessages: Message[] = [];
    const seenThreads = new Set<string>();

    for (const m of messages) {
        let threadId = '';
        const baseSubject = (m.subject || '').replace(/^Re:\s*/i, '');
        if (m.type === 'ANNOUNCEMENT' || m.type === 'SYSTEM') {
            threadId = `${m.type}-${baseSubject}`;
        } else {
            const otherUserId = m.senderId?._id === user?._id ? m.receiverId?._id : m.senderId?._id;
            threadId = `${otherUserId}-${baseSubject}`;
        }

        if (!seenThreads.has(threadId)) {
            seenThreads.add(threadId);
            groupedMessages.push(m);
        }
    }
    const displayMessages = groupedMessages;

    const canSendAnnouncement = ['STAFF', 'ADMIN', 'COMPANY'].includes(user?.role || '');

    const getFileUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        return baseUrl.replace(/\/api$/, '') + url;
    };

    return (
        <div className="container mx-auto py-8 max-w-6xl h-[calc(100vh-100px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Messages</h1>
                <Button className="flex gap-2" onClick={() => setIsComposeOpen(true)}>
                    <Send className="w-4 h-4" /> Compose
                </Button>
                <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>New Message</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {canSendAnnouncement && (
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" checked={composeType === 'DIRECT'} onChange={() => setComposeType('DIRECT')} /> Direct Message
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" checked={composeType === 'ANNOUNCEMENT'} onChange={() => setComposeType('ANNOUNCEMENT')} /> Announcement
                                    </label>
                                </div>
                            )}

                            {composeType === 'DIRECT' ? (
                                <div className="space-y-2 relative">
                                    <Input
                                        placeholder="Search user by name..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchContacts(e.target.value)}
                                    />
                                    {contacts.length > 0 && !receiverId && (
                                        <div className="absolute z-10 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {contacts.map(contact => (
                                                <div
                                                    key={contact._id}
                                                    className="p-2 hover:bg-muted cursor-pointer text-sm"
                                                    onClick={() => {
                                                        setReceiverId(contact._id);
                                                        setSearchQuery(contact.fullName);
                                                        setContacts([]);
                                                    }}
                                                >
                                                    <div className="font-semibold">{contact.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{contact.role}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {receiverId && (
                                        <div className="text-xs text-green-600 flex justify-between">
                                            <span>Recipient Selected</span>
                                            <button className="text-red-500 hover:underline" onClick={() => { setReceiverId(''); setSearchQuery(''); }}>Clear</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        className="w-full border border-border bg-background rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={receiverRole}
                                        onChange={(e) => setReceiverRole(e.target.value)}
                                    >
                                        <option value="ALL">All Users</option>
                                        <option value="STUDENT">All Students</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <Input placeholder="Subject (Optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
                            </div>
                            <div>
                                <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[150px]"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                            <Button onClick={handleSendMessage}>Send Message</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid md:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Message List Sidebar */}
                <Card className={cn("flex flex-col h-full border-r border-border md:rounded-r-none md:border-r-0 overflow-hidden shadow-sm bg-card", selectedMessage ? "hidden md:flex" : "flex")}>
                    <div className="p-4 border-b border-border bg-muted/50 font-semibold text-foreground">
                        Recent Conversations
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {displayMessages.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No messages found.</div>
                        ) : (
                            displayMessages.map((msg) => {
                                const isUnread = user && !msg.readBy.includes(user._id) && msg.senderId?._id !== user._id;
                                const otherName = msg.senderId?._id === user?._id ? (msg.receiverId?.fullName || `All ${msg.receiverRole}`) : msg.senderName;
                                return (
                                    <div
                                        key={msg._id}
                                        onClick={() => handleSelectMessage(msg)}
                                        className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-muted/50 ${selectedMessage && (msg.senderId?._id === selectedMessage.senderId?._id || msg.senderId?._id === selectedMessage.receiverId?._id) ? 'bg-muted' : ''} ${isUnread ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-semibold text-sm truncate flex items-center gap-2">
                                                {msg.type === 'ANNOUNCEMENT' ? <Bell className="w-3 h-3 text-amber-500" /> : null}
                                                {msg.type === 'SYSTEM' ? <Info className="w-3 h-3 text-primary" /> : null}
                                                <span className={isUnread ? 'text-foreground' : 'text-muted-foreground'}>
                                                    {otherName}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        {msg.subject && <div className="text-xs font-medium text-foreground truncate mb-1">{msg.subject}</div>}
                                        <div className={`text-xs truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                            <DecryptedContent content={msg.content} isEncrypted={msg.isEncrypted} privateKey={myPrivateKey} />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>

                {/* Message Content Area */}
                <Card className={cn("md:col-span-2 flex flex-col h-full md:rounded-l-none shadow-sm overflow-hidden bg-muted/10 border-border", !selectedMessage ? "hidden md:flex" : "flex")}>
                    {selectedMessage ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 md:p-6 border-b border-border bg-card">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start">
                                        <Button variant="ghost" size="icon" className="md:hidden mr-2 -ml-2 h-8 w-8 shrink-0" onClick={() => setSelectedMessage(null)}>
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                        <div>
                                            {selectedMessage.subject && <h2 className="text-lg md:text-xl font-bold mb-2 text-foreground line-clamp-2">{selectedMessage.subject}</h2>}
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                <div className="font-medium text-foreground">{selectedMessage.senderName}</div>
                                                <Badge variant="outline" className="text-[10px] md:text-xs border-border py-0">{selectedMessage.senderRole}</Badge>
                                                <span>to</span>
                                                <span className="font-medium text-foreground">
                                                    {selectedMessage.type === 'ANNOUNCEMENT'
                                                        ? `All ${selectedMessage.receiverRole}s`
                                                        : (selectedMessage.receiverId?.fullName || 'You')}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(selectedMessage.createdAt), 'MMMM d, yyyy h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={selectedMessage.type === 'SYSTEM' ? 'secondary' : selectedMessage.type === 'ANNOUNCEMENT' ? 'default' : 'outline'}>
                                        {selectedMessage.type}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4 bg-muted/5">
                                {messages
                                    .filter(m =>
                                        // Group by same sender/receiver pair AND same subject
                                        ((m.senderId?._id === selectedMessage.senderId?._id && m.receiverId?._id === selectedMessage.receiverId?._id) ||
                                            (m.senderId?._id === selectedMessage.receiverId?._id && m.receiverId?._id === selectedMessage.senderId?._id)) &&
                                        (m.subject || '').replace(/^Re:\s*/i, '') === (selectedMessage.subject || '').replace(/^Re:\s*/i, '')
                                    )
                                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                                    .map((msg, idx) => {
                                        const isMe = msg.senderId?._id === user?._id;
                                        return (
                                            <div key={msg._id || idx} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-xs font-medium text-muted-foreground">{isMe ? 'You' : msg.senderName}</span>
                                                    <span className="text-[10px] text-muted-foreground/60">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' : 'bg-card border border-border text-foreground rounded-tl-sm shadow-sm'}`}>
                                                    <DecryptedContent content={msg.content} isEncrypted={msg.isEncrypted} privateKey={myPrivateKey} />
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            {msg.attachments.map((att, i) => (
                                                                <div key={i} className="flex flex-col gap-1">
                                                                    {att.fileType.startsWith('image/') ? (
                                                                        <a href={getFileUrl(att.url)} target="_blank" rel="noopener noreferrer">
                                                                            <img src={getFileUrl(att.url)} alt={att.filename} className="max-w-[200px] rounded-md border border-border" />
                                                                        </a>
                                                                    ) : (
                                                                        <a href={getFileUrl(att.url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded-md hover:bg-black/20 transition-colors">
                                                                            <Paperclip className="w-4 h-4 shrink-0" />
                                                                            <span className="truncate max-w-[150px] text-xs underline">{att.filename}</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                <div ref={messagesEndRef} />
                            </div>
                            {selectedMessage.type === 'DIRECT' && (
                                <div className="p-4 border-t border-border bg-card flex flex-col gap-2">
                                    {selectedFile && (
                                        <div className="flex items-center gap-2 bg-primary/10 text-primary text-xs py-1 px-3 rounded-md w-fit border border-primary/20">
                                            <Paperclip className="w-3 h-3 shrink-0" />
                                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                            <button onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                if (imageInputRef.current) imageInputRef.current.value = '';
                                            }} className="text-primary hover:text-primary/80 ml-2">x</button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            ref={imageInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files && e.target.files[0] && setSelectedFile(e.target.files[0])}
                                        />
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={(e) => e.target.files && e.target.files[0] && setSelectedFile(e.target.files[0])}
                                        />
                                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" title="Attach Image" onClick={() => imageInputRef.current?.click()}>
                                            <ImageIcon className="w-5 h-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" title="Attach File" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip className="w-5 h-5" />
                                        </Button>
                                        <Input
                                            placeholder="Type a reply..."
                                            className="flex-1 rounded-full px-4 min-w-0"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleQuickReply();
                                            }}
                                            disabled={isUploading}
                                        />
                                        <Button
                                            className="rounded-full shrink-0"
                                            size="icon"
                                            onClick={handleQuickReply}
                                            disabled={(!replyContent.trim() && !selectedFile) || isUploading}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a message to read</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

// aria-label placeholder
