"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function PendingApprovalPage() {
    const { user, logout, loading, refreshUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If the user's status changes to APPROVED, redirect them to dashboard
        if (user && user.approvalStatus === 'APPROVED') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-xl border-0 overflow-hidden">
                <div className="h-2 w-full bg-amber-500"></div>
                <CardHeader className="space-y-4 text-center pt-8">
                    <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        <Clock className="w-10 h-10 text-amber-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">Account Pending Approval</CardTitle>
                    <CardDescription className="text-base">
                        Hi {user.fullName}, your registration as a <strong>{user.role}</strong> was successful, but your account requires administrator approval before you can access the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-center pb-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                        <p>We are currently reviewing your details. This process usually takes 1-2 business days. You will be notified once your account is active.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <Button 
                            variant="outline" 
                            className="font-medium" 
                            onClick={() => refreshUser()}
                        >
                            Check Status Again
                        </Button>
                        <Button 
                            variant="default" 
                            className="font-medium"
                            onClick={() => logout()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
