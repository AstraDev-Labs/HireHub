"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { EncryptionManager } from '@/lib/encryption';

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    fullName: string;
    linkedStudentId?: string;
    studentName?: string;
    companyId?: string;
    cgpa?: number;
    batchYear?: string;
    department?: string;
    publicKey?: string;
    profileImage?: string;
}

interface AuthContextType {
    user: User | null;
    privateKey?: CryptoKey | null;
    setPrivateKey?: (key: CryptoKey | null) => void;
    loading: boolean;
    login: (token: string, refreshToken: string, user: User, isProfileComplete?: boolean) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    privateKey: null,
    setPrivateKey: () => {},
    loading: true,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            // Skip check if we are on login/register and don't HAVE a token hint
            const isPublicPage = pathname.includes('/login') || pathname.includes('/register');
            const hasToken = !!localStorage.getItem('token'); // Hint that we might be logged in

            if (isPublicPage && !hasToken) {
                setLoading(false);
                return;
            }

            try {
                // This GET request will also capture the CSRF token in the interceptor
                const { data } = await api.get('/users/me');
                const userData = data.data.user;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (err: any) {
                console.error('Initial session check failed:', err);

                // If it's a 401 or 403, we definitely don't have a valid session
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                } else {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser && hasToken) {
                        setUser(JSON.parse(storedUser));
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, [pathname]); // Depend on pathname to re-check if user navigates away from login

    const login = (token: string, _refreshToken: string, userData: User, isProfileComplete: boolean = true) => {
        // Store token in localStorage for Bearer header (backward compat)
        // The real security comes from HttpOnly cookies set by the server
        localStorage.setItem('token', token);
        // Only store non-sensitive user profile data
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        if (!isProfileComplete && userData.role === 'STUDENT') {
            router.push('/complete-profile');
        } else {
            router.push('/dashboard');
        }
    };

    const logout = async () => {
        try {
            // Call server to clear HttpOnly cookies and invalidate refresh token
            await api.post('/auth/logout');
        } catch (err) {
            // Even if server call fails, clean up locally
            console.error('Logout API error:', err);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    // Route protection
    useEffect(() => {
        if (!loading && !user && !pathname.includes('/login') && !pathname.includes('/register')) {
            // router.push('/login');
        }
    }, [user, loading, pathname, router]);

    // Encryption keys are now handled during login, so we don't automatically generate them here.
    // This allows true end-to-end encryption across devices since the key is derived from the password.


    return (
        <AuthContext.Provider value={{ user, privateKey, setPrivateKey, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
