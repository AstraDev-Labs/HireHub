"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Check, X, UserCheck, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

export default function ApprovalsPage() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const filteredApplications = useMemo(() => {
        return applications.filter(app => 
            app.studentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.companyId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.roundId?.roundType?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [applications, searchQuery]);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            // Fetch only applications that are pending approval
            const res = await api.get('/placement/applications?status=PENDING_APPROVAL');
            setApplications(res.data.data.applications);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'PENDING' | 'REJECTED') => {
        setProcessingId(id);
        try {
            await api.patch(`/placement/applications/${id}/approve`, { status: action });
            toast.success(action === 'PENDING' ? "Application Approved" : "Application Rejected");
            // Remove from list immediately
            setApplications(prev => prev.filter(app => app._id !== id));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Action failed");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Application Approvals</h1>
                <p className="text-muted-foreground">Review and approve student applications for companies.</p>
            </div>

            <div className="relative max-w-sm mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by student, company, or round..." 
                    className="pl-10 h-10 bg-card border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Card className="border-border bg-card shadow-sm text-card-foreground">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-bold">
                        <UserCheck className="h-5 w-5 text-primary" /> Pending Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Round</TableHead>
                                <TableHead>CGPA</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Loading requests...</TableCell>
                                </TableRow>
                            ) : filteredApplications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No matches found for your search.</TableCell>
                                </TableRow>
                            ) : (
                                filteredApplications.map(app => (
                                    <TableRow key={app._id}>
                                        <TableCell>
                                            <div className="font-semibold text-foreground">{app.studentId?.name}</div>
                                            <div className="text-xs text-muted-foreground">{app.studentId?.email}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{app.studentId?.department}</TableCell>
                                        <TableCell className="font-bold text-primary">{app.companyId?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-muted text-muted-foreground border-border">{app.roundId?.roundType}</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{app.studentId?.cgpa}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                onClick={() => handleAction(app._id, 'PENDING')}
                                                disabled={processingId === app._id}
                                            >
                                                <Check className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="shadow-sm"
                                                onClick={() => handleAction(app._id, 'REJECTED')}
                                                disabled={processingId === app._id}
                                            >
                                                <X className="h-4 w-4 mr-1" /> Reject
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
