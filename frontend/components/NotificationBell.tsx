"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface NotificationItem {
    _id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const fetchUnreadCount = async () => {
        try {
            const { data } = await api.get('/notifications/unread-count');
            setUnreadCount(data.data.unreadCount);
        } catch { }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data.notifications);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open]);

    // Calculate position when opening
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
    }, []);

    useEffect(() => {
        if (open) updatePosition();
    }, [open, updatePosition]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Close on scroll/resize
    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener('resize', close);
        return () => window.removeEventListener('resize', close);
    }, [open]);

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            const removed = notifications.find(n => n._id === id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            if (removed && !removed.read) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    const handleClick = (n: NotificationItem) => {
        if (!n.read) markAsRead(n._id);
        if (n.link) { setOpen(false); router.push(n.link); }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    if (!user) return null;

    const dropdown = open ? createPortal(
        <div
            ref={dropdownRef}
            className="fixed w-80 bg-white dark:bg-[#0f172a] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-2 border-border z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 ring-1 ring-black/5"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md">
                <h3 className="font-black uppercase tracking-tight text-xs">Intelligence Feed</h3>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                        <CheckCheck className="h-3 w-3" /> All Clear
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                {loading ? (
                    <div className="p-12 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        Synchronizing...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-primary/10">
                            <Bell className="h-6 w-6 text-primary/30" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-tight text-foreground">Awaiting Signals</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-2 px-6">We&apos;ll alert you when system activity is detected.</p>
                    </div>
                ) : (
                    notifications.slice(0, 20).map(n => (
                        <div key={n._id}
                            className={cn("flex items-start gap-4 px-5 py-5 border-b border-border last:border-0 cursor-pointer hover:bg-primary/5 transition-all group relative",
                                !n.read ? "bg-primary/[0.03]" : "bg-transparent")}
                            onClick={() => handleClick(n)}>

                            {!n.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className={cn("text-sm leading-none", !n.read ? "font-black text-foreground" : "font-bold text-muted-foreground")}>
                                        {n.title}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 whitespace-nowrap">
                                        {timeAgo(n.createdAt)}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed font-medium">{n.message}</p>

                                {n.link && (
                                    <div className="mt-2.5 flex items-center text-[10px] font-black uppercase tracking-widest text-primary gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Execute Link <ExternalLink className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                                className="p-2 hover:bg-destructive hover:text-white rounded-xl text-muted-foreground/30 flex-shrink-0 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="border-t border-border px-4 py-4 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md">
                    <button onClick={() => { setOpen(false); router.push('/notifications'); }}
                        className="text-[10px] text-primary hover:text-primary/80 w-full text-center font-black uppercase tracking-[0.2em] py-2 transition-all">
                        View Intelligence Feed
                    </button>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button ref={buttonRef} onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell className="h-5 w-5 text-zinc-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {dropdown}
        </>
    );
}
