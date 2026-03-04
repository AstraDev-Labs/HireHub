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
    loading: boolean;
    login: (token: string, refreshToken: string, user: User, isProfileComplete?: boolean) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                // This GET request will also capture the CSRF token in the interceptor
                const { data } = await api.get('/users/me');
                const userData = data.data.user;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } catch (err) {
                console.error('Initial session check failed:', err);
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('token');
                if (storedUser && token) {
                    setUser(JSON.parse(storedUser));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

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

    // Handle Encryption Keys
    useEffect(() => {
        const handleKeys = async () => {
            if (user && !localStorage.getItem(`priv-${user._id}`)) {
                console.log("Generating encryption keys...");
                const keyPair = await EncryptionManager.generateKeyPair();
                const pubJWK = await EncryptionManager.exportKey(keyPair.publicKey);
                const privJWK = await EncryptionManager.exportKey(keyPair.privateKey);

                localStorage.setItem(`pub-${user._id}`, pubJWK);
                localStorage.setItem(`priv-${user._id}`, privJWK);

                // Update server with public key
                try {
                    await api.patch('/users/update-public-key', { publicKey: pubJWK });
                } catch (err) {
                    console.error("Failed to sync public key:", err);
                }
            }
        };
        if (user) handleKeys();
    }, [user]);


    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
