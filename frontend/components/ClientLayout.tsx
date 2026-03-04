"use client";

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Menu, X, GraduationCap } from 'lucide-react';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu when pathname changes
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="h-full relative min-h-screen bg-background text-foreground">
            {!isAuthPage && (
                <>
                    {/* Desktop Sidebar */}
                    <div
                        className={cn(
                            "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] transition-all duration-300 ease-in-out",
                            sidebarHovered ? "md:w-72" : "md:w-16"
                        )}
                        onMouseEnter={() => setSidebarHovered(true)}
                        onMouseLeave={() => setSidebarHovered(false)}
                    >
                        <Sidebar collapsed={!sidebarHovered} />
                    </div>

                    {/* Mobile Top Header */}
                    <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-border text-white z-40 fixed top-0 w-full h-16">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 text-transparent bg-clip-text">
                                HireHub
                            </h1>
                        </div>
                        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 -mr-2 bg-slate-800 rounded-md">
                            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    {isMobileOpen && (
                        <div
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[80] md:hidden"
                            onClick={() => setIsMobileOpen(false)}
                        />
                    )}

                    {/* Mobile Sidebar Drawer */}
                    <div className={cn(
                        "fixed inset-y-0 left-0 z-[90] w-72 bg-slate-900 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
                        isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    )}>
                        <Sidebar collapsed={false} />
                    </div>
                </>
            )}
            <main className={cn("h-full transition-all duration-300", !isAuthPage && (sidebarHovered ? "md:pl-72" : "md:pl-16"), !isAuthPage && "pt-16 md:pt-0")}>
                <div className={cn("h-full", !isAuthPage && "p-4 md:p-8")}>
                    {children}
                </div>
            </main>
            <Toaster />
        </div>
    );
}

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
    );
}
