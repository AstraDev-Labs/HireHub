"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Building2, GraduationCap, Users, ArrowLeft, Clock, UsersRound } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface PlacementDrive {
    _id: string;
    companyId: string;
    companyName: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    venue?: string;
    driveType: string;
    eligibleDepartments: string[];
    minCgpa: number;
    status: string;
}

const safeFormatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBA';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Date TBA';
    try {
        return format(d, 'MMMM dd, yyyy');
    } catch {
        return 'Date TBA';
    }
};

export default function DriveDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [drive, setDrive] = useState<PlacementDrive | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        fetchDriveDetails();
    }, [params.id]);

    useEffect(() => {
        if (user && user.role === 'STUDENT' && drive) {
            checkApplicationStatus();
        } else {
            setCheckingStatus(false);
        }
    }, [user, drive]);

    const fetchDriveDetails = async () => {
        try {
            const { data } = await api.get(`/drives/${params.id}`);
            setDrive(data.data.drive);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load drive details');
            router.push('/drives');
        } finally {
            setLoading(false);
        }
    };

    const checkApplicationStatus = async () => {
        try {
            const { data } = await api.get('/applications/my-applications');
            const applications = data.data.applications || [];
            const applied = applications.some((app: any) => app.driveId === params.id && app.status !== 'WITHDRAWN');
            setHasApplied(applied);
        } catch (error) {
            console.error('Failed to check application status', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleApply = async () => {
        if (!user) {
            toast.error('Please login to apply');
            router.push('/login');
            return;
        }

        try {
            setApplying(true);
            await api.post('/applications', { driveId: params.id });
            toast.success('Successfully applied to drive!');
            setHasApplied(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading drive details...</div>;
    }

    if (!drive) {
        return <div className="p-8 text-center text-muted-foreground">Drive not found.</div>;
    }

    const canManage = user?.role === 'ADMIN' || user?.role === 'STAFF' || (user?.role === 'COMPANY' && user.companyId === drive.companyId);

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Drives
            </Button>

            <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="h-4 bg-primary/20 w-full" />
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight">{drive.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2 text-primary font-medium text-lg">
                                <Building2 className="w-5 h-5" /> {drive.companyName || 'Unknown Company'}
                            </CardDescription>
                        </div>

                        <div className="flex flex-col gap-2">
                            {user?.role === 'STUDENT' && (
                                <>
                                    <Button
                                        size="lg"
                                        onClick={handleApply}
                                        disabled={applying || hasApplied || checkingStatus}
                                        className={hasApplied ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                                    >
                                        {checkingStatus ? 'Checking...' : applying ? 'Applying...' : hasApplied ? 'Applied' : 'Apply Now'}
                                    </Button>
                                    
                                    {hasApplied && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                            onClick={async () => {
                                                if (!confirm('Are you sure you want to withdraw your application?')) return;
                                                try {
                                                    const { data } = await api.get('/applications/my-applications');
                                                    const app = data.data.applications.find((a: any) => a.driveId === params.id && a.status !== 'WITHDRAWN');
                                                    if (app) {
                                                        await api.patch(`/applications/${app._id}/withdraw`);
                                                        toast.success('Application withdrawn');
                                                        setHasApplied(false);
                                                    }
                                                } catch (err) {
                                                    toast.error('Failed to withdraw application');
                                                }
                                            }}
                                        >
                                            Withdraw Application
                                        </Button>
                                    )}
                                </>
                            )}
                            {canManage && (
                                <Link href={`/drives/${drive._id}/applicants`}>
                                    <Button variant="outline" className="w-full">
                                        <UsersRound className="w-4 h-4 mr-2" />
                                        View Applicants
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Date</span>
                            <div className="flex items-center text-sm font-medium">
                                <CalendarDays className="w-4 h-4 mr-2 text-primary/70" />
                                {safeFormatDate(drive.date)}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Time</span>
                            <div className="flex items-center text-sm font-medium">
                                <Clock className="w-4 h-4 mr-2 text-primary/70" />
                                {drive.time || 'TBA'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Venue</span>
                            <div className="flex items-center text-sm font-medium">
                                <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                                {drive.venue || 'TBA'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mode of Work</span>
                            <div className="flex items-center text-sm font-medium capitalize">
                                <Building2 className="w-4 h-4 mr-2 text-primary/70" />
                                {drive.driveType?.replace('_', ' ').toLowerCase() || 'On Campus'}
                            </div>
                        </div>
                    </div>

                    {/* Eligibility */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Eligibility Criteria</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                <GraduationCap className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-700 dark:text-blue-400">Minimum CGPA</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {drive.minCgpa > 0 ? `${drive.minCgpa} and above` : 'No minimum CGPA required'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-600/5 border border-blue-600/10">
                                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-700 dark:text-blue-400">Eligible Branches</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {drive.eligibleDepartments?.length > 0
                                            ? drive.eligibleDepartments.join(', ')
                                            : 'All branches eligible'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Description & Details</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                            {drive.description || 'No additional details provided.'}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
