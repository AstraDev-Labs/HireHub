"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

interface User {
    _id: string;
    username: string;
    email: string;
    role?: string;
    fullName: string;
    approvalStatus?: string;
    profileImage?: string;
    companyId?: string;
    cgpa?: number;
    linkedStudentId?: string;
    studentName?: string;
    studentContact?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => { },
    isAuthenticated: false,
    refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { user: auth0User, isLoading: auth0Loading, error: auth0Error } = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchCurrentUser = async () => {
        if (!auth0User) return;
        try {
            // Call the Next.js API sync endpoint which securely proxies to backend
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (response.ok && data.data && data.data.user) {
                setUser(data.data.user);
            } else {
                setUser(null);
            }
        } catch (err: any) {
            console.error('Failed to sync user with backend:', err);
            setUser(null);
        }
    };

    useEffect(() => {
        if (auth0Loading) {
            setLoading(true);
            return;
        }

        if (auth0User) {
            fetchCurrentUser().finally(() => setLoading(false));
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [auth0User, auth0Loading]);

    const refreshUser = async () => {
        if (auth0User) {
            await fetchCurrentUser();
        }
    }

    const logout = async () => {
        setUser(null);
        window.location.href = '/api/auth/logout';
    };

    // Route Protection and Onboarding Enforcement
    useEffect(() => {
        if (loading || auth0Loading) return;

        const isPublicPage = pathname === '/' || (pathname && pathname.startsWith('/api/auth'));

        if (!auth0User && !isPublicPage) {
            // User is not logged in
            window.location.href = '/api/auth/login';
            return;
        }

        if (user) {
            if (!user.role && pathname && pathname !== '/onboarding') {
                router.push('/onboarding');
            } else if (user.role && user.approvalStatus === 'PENDING' && pathname && pathname !== '/pending-approval') {
                router.push('/pending-approval');
            }
        }
    }, [user, loading, auth0User, auth0Loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading: loading || auth0Loading, logout, isAuthenticated: !!user, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
