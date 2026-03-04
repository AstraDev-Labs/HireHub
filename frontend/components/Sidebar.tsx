"use client";

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, UserCircle, Briefcase, GraduationCap, FileLineChart, LogOut, Building2, MessageSquare, CalendarDays, Bell, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
    collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const { data } = await api.get('/messages/unread-count');
                setUnreadCount(data.data.unreadCount);
            } catch { }
        };
        if (user) {
            fetchUnread();
            const interval = setInterval(fetchUnread, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (!user) return null;

    const routes = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            roles: ['ADMIN', 'STAFF', 'COMPANY', 'STUDENT', 'PARENT'],
        },
        {
            label: 'Companies',
            icon: Building2,
            href: '/companies',
            roles: ['ADMIN', 'STAFF', 'STUDENT', 'COMPANY'],
        },
        {
            label: 'My Profile',
            icon: UserCircle,
            href: '/profile',
            roles: ['STUDENT', 'COMPANY'],
        },
        {
            label: 'Resources',
            icon: Briefcase,
            href: '/resources',
            roles: ['ADMIN', 'STAFF', 'COMPANY', 'STUDENT'],
        },
        {
            label: 'Messages',
            icon: MessageSquare,
            href: '/messages',
            roles: ['ADMIN', 'STAFF', 'COMPANY', 'STUDENT'],
        },
        {
            label: 'Calendar',
            icon: CalendarDays,
            href: '/calendar',
            roles: ['ADMIN', 'STAFF', 'COMPANY', 'STUDENT'],
        },
        {
            label: 'Notifications',
            icon: Bell,
            href: '/notifications',
            roles: ['ADMIN', 'STAFF', 'COMPANY', 'STUDENT', 'PARENT'],
        },
        {
            label: 'Offer Letters',
            icon: FileText,
            href: '/offers',
            roles: ['ADMIN', 'STAFF', 'STUDENT'],
        },
        {
            label: 'Resume Builder',
            icon: FileLineChart,
            href: '/resume-builder',
            roles: ['STUDENT'],
        },
        {
            label: 'Interviews',
            icon: CalendarDays,
            href: '/interviews',
            roles: ['ADMIN', 'STAFF', 'COMPANY', 'STUDENT'],
        }
    ];

    const filteredRoutes = routes.filter(route => user && route.roles.includes(user.role));

    return (
        <div className="flex flex-col h-full bg-slate-900 dark:bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className={cn("px-3 py-4 flex items-center", collapsed ? "justify-center" : "justify-between pl-3 pr-2")}>
                <Link href="/dashboard" className="flex items-center overflow-hidden">
                    <div className="w-8 h-8 shrink-0">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    {!collapsed && (
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text ml-4 whitespace-nowrap">
                            HireHub
                        </h1>
                    )}
                </Link>
                {!collapsed && <NotificationBell />}
            </div>

            {/* Nav Links */}
            <div className="flex-1 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
                {filteredRoutes.map((route) => (
                    <Link
                        key={route.href}
                        href={route.href}
                        title={collapsed ? route.label : undefined}
                        className={cn(
                            "text-sm group flex items-center w-full font-medium cursor-pointer rounded-lg transition-colors",
                            collapsed ? "p-3 justify-center" : "p-3 justify-start",
                            pathname === route.href
                                ? "text-white bg-white/10"
                                : "text-zinc-400 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <route.icon className={cn("h-5 w-5 shrink-0", pathname === route.href ? "text-primary" : "text-zinc-400")} />
                        {!collapsed && (
                            <div className="flex items-center flex-1 justify-between ml-3 overflow-hidden">
                                <span className="whitespace-nowrap">{route.label}</span>
                                {route.label === 'Messages' && unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            {/* Footer */}
            <div className="px-2 py-2 space-y-1 border-t border-white/10">
                {!collapsed ? (
                    <ThemeToggle />
                ) : (
                    <div className="flex justify-center">
                        <ThemeToggle iconOnly />
                    </div>
                )}
                <button
                    onClick={logout}
                    title={collapsed ? "Logout" : undefined}
                    className={cn(
                        "text-sm group flex items-center w-full font-medium cursor-pointer rounded-lg transition text-zinc-400 hover:text-white hover:bg-red-500/10",
                        collapsed ? "p-3 justify-center" : "p-3 justify-start"
                    )}
                >
                    <LogOut className="h-5 w-5 shrink-0 text-red-500" />
                    {!collapsed && <span className="ml-3 whitespace-nowrap">Logout</span>}
                </button>
            </div>
        </div>
    );
}
