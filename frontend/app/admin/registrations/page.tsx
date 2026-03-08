"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Check, X, UserPlus, Users, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

export default function RegistrationApprovals() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users/pending');
            setUsers(res.data.data.users || res.data.data); // Handle potential response structure diffs
        } catch (err) {
            console.error(err);
            toast.error("Failed to load pending registrations");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            await api.patch(`/users/${id}/${action}`);
            toast.success(action === 'approve' ? "User Approved" : "User Rejected");
            setUsers(prev => prev.filter(user => user._id !== id));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Registration Approvals</h1>
                <p className="text-muted-foreground font-medium">Approve new students, parents, and company representatives.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, username or email..." 
                        className="pl-10 h-11 bg-card border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select 
                        className="h-11 bg-card border border-border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="ALL">All Roles</option>
                        <option value="STUDENT">Student</option>
                        <option value="COMPANY">Company</option>
                        <option value="STAFF">Staff</option>
                        <option value="PARENT">Parent</option>
                        <option value="COORDINATOR">Coordinator</option>
                    </select>
                </div>
            </div>

            <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <UserPlus className="h-5 w-5 stroke-[2.5] text-primary" /> Pending Registrations
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Loading requests...</TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No results match your search.</TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map(user => (
                                    <TableRow key={user._id} className="hover:bg-muted/30 transition-colors group">
                                        <TableCell className="font-bold text-foreground py-4">{user.fullName || user.username}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant={
                                                user.role === 'COMPANY' ? 'default' :
                                                    user.role === 'STAFF' ? 'secondary' : 'outline'
                                            } className="font-bold tracking-wider px-3">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-muted-foreground font-medium">{user.email}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground font-medium py-4">
                                            {user.role === 'COMPANY' && user.companyId?.name}
                                            {user.role === 'STUDENT' && (user.department || 'N/A')}
                                            {user.role === 'PARENT' && `Child: ${user.studentName || 'N/A'} (${user.linkedStudentId?.department || 'N/A'})`}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2 py-4">
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest h-9 px-4 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                onClick={() => handleAction(user._id, 'approve')}
                                                disabled={processingId === user._id}
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1.5 stroke-[3]" /> Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="font-bold text-[10px] uppercase tracking-widest h-9 px-4 shadow-lg shadow-destructive/20 active:scale-95 transition-all"
                                                onClick={() => handleAction(user._id, 'reject')}
                                                disabled={processingId === user._id}
                                            >
                                                <X className="h-3.5 w-3.5 mr-1.5 stroke-[3]" /> Reject
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// aria-label placeholder
