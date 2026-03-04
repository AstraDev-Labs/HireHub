"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface NotificationItem {
    _id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

const typeColors: Record<string, string> = {
    REGISTRATION_APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
    REGISTRATION_REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
    APPLICATION_STATUS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ROUND_ANNOUNCEMENT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    NEW_APPLICATION: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    GENERAL: 'bg-muted text-muted-foreground border-border',
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetch = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data.data.notifications);
            } catch { toast.error("Failed to load notifications"); }
            finally { setLoading(false); }
        };
        fetch();
    }, [user]);

    const markAsRead = async (id: string) => {
        await api.patch(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    };

    const markAllRead = async () => {
        await api.patch('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("All marked as read");
    };

    const deleteNotif = async (id: string) => {
        await api.delete(`/notifications/${id}`);
        setNotifications(prev => prev.filter(n => n._id !== id));
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h2>
                    <p className="text-muted-foreground mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
                        <CheckCheck className="h-4 w-4" /> Mark all read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Bell className="h-16 w-16 mb-4 opacity-50" />
                        <p className="font-medium text-lg">No notifications yet</p>
                        <p className="text-sm mt-1">You'll see alerts here when something happens</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map(n => (
                        <Card key={n._id}
                            className={cn("border border-border shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99] bg-card text-card-foreground",
                                !n.read && "ring-1 ring-primary/20 bg-primary/5")}
                            onClick={() => { if (!n.read) markAsRead(n._id); if (n.link) router.push(n.link); }}>
                            <CardContent className="flex items-start gap-4 py-4">
                                <div className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", !n.read ? "bg-primary" : "bg-transparent")} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", typeColors[n.type] || typeColors.GENERAL)}>
                                            {n.type.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{formatDate(n.createdAt)}</span>
                                    </div>
                                    <p className={cn("text-sm", !n.read ? "font-bold text-foreground" : "text-muted-foreground")}>{n.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {!n.read && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

// aria-label placeholder
