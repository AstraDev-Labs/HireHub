"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CalendarDays, Clock, Video, User, Building2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function InterviewsPage() {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            let endpoint = '';
            if (user?.role === 'STUDENT') endpoint = '/interviews/student';
            else if (user?.role === 'COMPANY') endpoint = '/interviews/company';
            else if (user?.role === 'ADMIN' || user?.role === 'STAFF') endpoint = '/interviews/all';

            if (!endpoint) return;

            const res = await api.get(endpoint);
            setInterviews(res.data.data.interviews || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchInterviews();
    }, [user]);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/interviews/${id}`, { status });
            toast.success('Interview status updated');
            fetchInterviews();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading interviews...</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Scheduled Interviews</h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage and track your upcoming interview slots.</p>
                </div>
            </div>

            {interviews.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mb-4 opacity-50" />
                        <p>No interviews scheduled yet.</p>
                        {user?.role === 'COMPANY' && (
                            <p className="text-sm mt-2">Go to the Drive Applicants page to schedule interviews with shortlisted students.</p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {interviews.map((slot) => {
                        const isUpcoming = new Date(slot.scheduledAt) >= new Date();
                        const isCompany = user?.role === 'COMPANY';

                        return (
                            <Card key={slot._id || slot.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className={`h-2 w-full ${slot.status === 'SCHEDULED' ? 'bg-blue-500' : slot.status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {isCompany ? <User className="h-4 w-4 text-muted-foreground" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                                                {isCompany ? slot.studentName : slot.companyName}
                                                {user?.role === 'ADMIN' || user?.role === 'STAFF' ? ` (Student: ${slot.studentName})` : ''}
                                            </CardTitle>
                                            <CardDescription className="mt-1 font-medium text-primary">
                                                Round: {slot.roundName}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={slot.status === 'SCHEDULED' ? 'default' : slot.status === 'COMPLETED' ? 'outline' : 'destructive'}
                                            className={slot.status === 'COMPLETED' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                                            {slot.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col gap-2 text-sm text-foreground bg-accent/50 p-3 rounded-md border border-border">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">{format(new Date(slot.scheduledAt), 'PPPP')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            <span>{format(new Date(slot.scheduledAt), 'h:mm a')} ({slot.durationMinutes} mins)</span>
                                        </div>
                                        {slot.meetLink && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Video className="h-4 w-4 text-indigo-500" />
                                                <a href={slot.meetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                    Join Meeting
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {isCompany && slot.status === 'SCHEDULED' && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-border mt-4">
                                            <Button size="sm" variant="outline" className="w-full text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
                                                onClick={() => handleUpdateStatus(slot.id, 'COMPLETED')}>
                                                <CheckCircle className="h-4 w-4 mr-2" /> Complete
                                            </Button>
                                            <Button size="sm" variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                                                onClick={() => handleUpdateStatus(slot.id, 'NO_SHOW')}>
                                                <XCircle className="h-4 w-4 mr-2" /> No Show
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// aria-label placeholder
