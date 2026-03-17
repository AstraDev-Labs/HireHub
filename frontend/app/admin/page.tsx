"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Building2, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (!user || user.role !== 'ADMIN') return null;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
                <p className="text-muted-foreground mt-2">Manage users, departments, and system registrations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Pending Approvals
                        </CardTitle>
                        <CardDescription>Review and approve student applications for companies.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/approvals">
                            <Button className="w-full">View Pending Users</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-500" />
                            All Registrations
                        </CardTitle>
                        <CardDescription>View all registered students and companies</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/registrations">
                            <Button className="w-full" variant="outline">Manage Users</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-orange-500" />
                            Departments
                        </CardTitle>
                        <CardDescription>Configure academic departments and branches</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/departments">
                            <Button className="w-full" variant="secondary">Manage Departments</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
