"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, User, ExternalLink, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Applicant {
    _id: string;
    studentId: string;
    status: string;
    appliedAt: string;
    student?: {
        name: string;
        email: string;
        department: string;
        cgpa: number;
    };
}

export default function ApplicantsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewTime, setInterviewTime] = useState('');
    const [meetLink, setMeetLink] = useState('');
    const [duration, setDuration] = useState('30');
    const [isScheduling, setIsScheduling] = useState(false);

    useEffect(() => {
        if (!user || user.role === 'STUDENT') {
            router.push('/dashboard');
            return;
        }
        fetchApplicants();
    }, [user, params.id]);

    const fetchApplicants = async () => {
        try {
            const { data } = await api.get(`/applications/drive/${params.id}`);
            // Filter out withdrawn applications for the company view by default
            setApplicants(data.data.applications.filter((a: any) => a.status !== 'WITHDRAWN'));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load applicants");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (appId: string, status: 'SHORTLISTED' | 'REJECTED' | 'CLEARED') => {
        setActioningId(appId);
        try {
            await api.patch(`/applications/${appId}/status`, { status });
            toast.success(`Applicant marked as ${status}`);
            fetchApplicants();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update round');
            console.error(error);
        } finally {
            setActioningId(null);
        }
    };

    const handleScheduleSubmit = async () => {
        if (!selectedApplicant || !interviewDate || !interviewTime) {
            toast.error("Please fill in the date and time");
            return;
        }

        try {
            setIsScheduling(true);
            const scheduledAt = new Date(`${interviewDate}T${interviewTime}`).toISOString();

            await api.post('/interviews/schedule', {
                driveId: params.id,
                roundId: 'initial', // In a real scenario, roundId should be tracked
                slots: [
                    {
                        studentId: selectedApplicant.studentId,
                        scheduledAt,
                        durationMinutes: parseInt(duration),
                        meetLink
                    }
                ]
            });
            toast.success("Interview scheduled successfully!");
            setSelectedApplicant(null);
            fetchApplicants(); // Refresh applicants to reflect any status changes
            // Optionally, we could change applicant status to 'SCHEDULED' but keeping it simple
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to schedule interview');
        } finally {
            setIsScheduling(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading applicants...</div>;

    const statusColors: Record<string, string> = {
        APPLIED: 'bg-blue-100 text-blue-700',
        SHORTLISTED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
        PENDING: 'bg-yellow-100 text-yellow-700',
        CLEARED: 'bg-green-100 text-green-700',
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Drive Applicants</h2>
                    <p className="text-muted-foreground mt-1">Review and shortlist candidates</p>
                </div>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        Total Applicants ({applicants.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {applicants.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                            <User className="h-12 w-12 text-gray-300 mb-3" />
                            <p>No applicants found for this drive yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Student Name</th>
                                        <th className="px-4 py-3 font-medium">Department</th>
                                        <th className="px-4 py-3 font-medium">CGPA</th>
                                        <th className="px-4 py-3 font-medium">Applied Date</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicants.map((app) => (
                                        <tr key={app._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                <div>{app.student?.name}</div>
                                                <div className="text-xs text-muted-foreground font-normal">{app.student?.email}</div>
                                            </td>
                                            <td className="px-4 py-3">{app.student?.department}</td>
                                            <td className="px-4 py-3 font-semibold">{app.student?.cgpa}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{new Date(app.appliedAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={statusColors[app.status]}>
                                                    {app.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                {app.status === 'APPLIED' ? (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            disabled={actioningId === app._id}
                                                            onClick={() => updateStatus(app._id, 'SHORTLISTED')}
                                                        >
                                                            <Check className="h-4 w-4 mr-1" /> Shortlist
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            disabled={actioningId === app._id}
                                                            onClick={() => updateStatus(app._id, 'REJECTED')}
                                                        >
                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </>
                                                ) : app.status === 'PENDING' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200" onClick={() => updateStatus(app._id, 'CLEARED')}>
                                                            <Check className="h-4 w-4 mr-1" /> Shortlist
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" onClick={() => setSelectedApplicant(app)}>
                                                            <CalendarPlus className="h-4 w-4 mr-1" /> Schedule
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200" onClick={() => updateStatus(app._id, 'REJECTED')}>
                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                ) : app.status === 'SHORTLISTED' ? (
                                                    <Button variant="secondary" size="sm" onClick={() => router.push('/offers')}>
                                                        Issue Offer
                                                    </Button>
                                                ) : (
                                                    <span className="text-gray-400 italic font-medium">Actioned</span>
                                                )}

                                                <Link
                                                    href={`/students/${app.studentId}/resume`}
                                                    target="_blank"
                                                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-blue-600 hover:text-blue-800 hover:bg-blue-50")}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" /> Resume
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Schedule Interview Dialog */}
            <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Interview</DialogTitle>
                        <DialogDescription>
                            Schedule a time slot for {selectedApplicant?.student?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date</Label>
                            <Input id="date" type="date" className="col-span-3" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="time" className="text-right">Time</Label>
                            <Input id="time" type="time" className="col-span-3" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">Duration</Label>
                            <Input id="duration" type="number" placeholder="Mins (e.g. 30)" className="col-span-3" value={duration} onChange={e => setDuration(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="link" className="text-right">Meet Link</Label>
                            <Input id="link" type="url" placeholder="https://meet.google.com/..." className="col-span-3" value={meetLink} onChange={e => setMeetLink(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedApplicant(null)}>Cancel</Button>
                        <Button onClick={handleScheduleSubmit} disabled={isScheduling}>
                            {isScheduling ? 'Scheduling...' : 'Schedule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UsersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
