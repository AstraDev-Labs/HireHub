"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Clock, Plus, Trash2, Building2, GraduationCap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Application {
    _id: string;
    driveId: string;
    status: string;
}

interface Drive {
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

const statusColors: Record<string, string> = {
    UPCOMING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ONGOING: 'bg-green-500/10 text-green-500 border-green-500/20',
    COMPLETED: 'bg-muted text-muted-foreground border-border',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const driveTypeLabels: Record<string, string> = {
    ON_CAMPUS: '🏢 On Campus',
    OFF_CAMPUS: '🏙️ Off Campus',
    VIRTUAL: '💻 Virtual',
};

export default function CalendarPage() {
    const { user } = useAuth();
    const [drives, setDrives] = useState<Drive[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [applyingTo, setApplyingTo] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ companyId: '', title: '', description: '', date: '', time: '', venue: '', driveType: 'ON_CAMPUS', minCgpa: 0 });

    const isAdmin = user && ['ADMIN', 'STAFF'].includes(user.role);
    const isCompany = user?.role === 'COMPANY';
    const isStudent = user?.role === 'STUDENT';

    useEffect(() => {
        fetchDrives();
        if (user && ['ADMIN', 'STAFF', 'COMPANY'].includes(user.role)) fetchCompanies();
        if (user && user.role === 'STUDENT') fetchApplications();
    }, [user]);

    const fetchApplications = async () => {
        try {
            const { data } = await api.get('/applications/my-applications');
            setApplications(data.data.applications);
        } catch { }
    };

    const fetchDrives = async () => {
        try {
            const { data } = await api.get('/drives');
            setDrives(data.data.drives);
        } catch { toast.error("Failed to load drives"); }
        finally { setLoading(false); }
    };

    const fetchCompanies = async () => {
        try {
            const { data } = await api.get('/companies');
            setCompanies(data.data.companies);
        } catch { }
    };

    const handleOpenCreate = () => {
        setForm({
            companyId: user?.role === 'COMPANY' ? (user.companyId || '') : '',
            title: '', description: '', date: '', time: '', venue: '', driveType: 'ON_CAMPUS', minCgpa: 0
        });
        setShowCreate(true);
    };

    const handleCreate = async () => {
        if (!form.companyId || !form.title || !form.date) { toast.error("Company, title, and date are required"); return; }
        try {
            await api.post('/drives', form);
            toast.success("Drive scheduled!");
            setShowCreate(false);
            setForm({ companyId: '', title: '', description: '', date: '', time: '', venue: '', driveType: 'ON_CAMPUS', minCgpa: 0 });
            fetchDrives();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create drive");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this drive?")) return;
        try {
            await api.delete(`/drives/${id}`);
            toast.success("Drive deleted");
            fetchDrives();
        } catch { toast.error("Failed to delete"); }
    };

    const handleApply = async (driveId: string) => {
        setApplyingTo(driveId);
        try {
            await api.post('/applications', { driveId });
            toast.success("Successfully applied!");
            fetchApplications();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to apply");
        } finally {
            setApplyingTo(null);
        }
    };

    const handleWithdraw = async (applicationId: string) => {
        if (!confirm("Are you sure you want to withdraw your application?")) return;
        try {
            await api.patch(`/applications/${applicationId}/withdraw`);
            toast.success("Application withdrawn");
            fetchApplications();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to withdraw");
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    // Group by month
    const grouped = drives.reduce((acc: Record<string, Drive[]>, drive) => {
        const month = new Date(drive.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(drive);
        return acc;
    }, {});

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading calendar...</div>;

    const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Placement Calendar</h2>
                    <p className="text-muted-foreground mt-1">Upcoming placement drives and schedules</p>
                </div>
                {(isAdmin || isCompany) && (
                    <Button onClick={handleOpenCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Schedule Drive
                    </Button>
                )}
            </div>

            {drives.length === 0 ? (
                <Card className="border-border bg-card shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground font-medium">No drives scheduled yet</p>
                    </CardContent>
                </Card>
            ) : (
                Object.entries(grouped).map(([month, monthDrives]) => (
                    <div key={month} className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" /> {month}
                        </h3>
                        <div className="space-y-3">
                            {monthDrives.map(drive => (
                                <Card key={drive._id} className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card text-card-foreground overflow-hidden">
                                    <CardContent className="flex items-start gap-4 py-4">
                                        {/* Date badge */}
                                        <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                                            <span className="text-lg font-bold text-primary">{new Date(drive.date).getDate()}</span>
                                            <span className="text-[10px] uppercase text-primary/70 font-bold">{new Date(drive.date).toLocaleDateString('en', { month: 'short' })}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="font-bold text-foreground">{drive.title}</h4>
                                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", statusColors[drive.status])}>{drive.status}</Badge>
                                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">{driveTypeLabels[drive.driveType] || drive.driveType}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                                                <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{drive.companyName}</span>
                                                {drive.venue && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{drive.venue}</span>}
                                                {drive.time && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{drive.time}</span>}
                                                {drive.minCgpa > 0 && <span className="flex items-center gap-1.5 text-foreground font-medium"><GraduationCap className="h-3.5 w-3.5" />Min {drive.minCgpa} CGPA</span>}
                                            </div>
                                            {drive.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{drive.description}</p>}
                                            {drive.eligibleDepartments?.length > 0 && (
                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                    {drive.eligibleDepartments.map((d, i) => <Badge key={i} variant="outline" className="text-xs">{d}</Badge>)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {isStudent && (() => {
                                                const myApp = applications.find(a => a.driveId === drive._id);
                                                if (myApp) {
                                                    return (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge variant={myApp.status === 'WITHDRAWN' ? 'secondary' : 'default'} className="px-2 py-0.5">
                                                                {myApp.status}
                                                            </Badge>
                                                            {myApp.status !== 'REJECTED' && myApp.status !== 'WITHDRAWN' && (
                                                                <Button variant="ghost" size="sm" className="text-xs text-red-500 h-6 px-2 mt-1" onClick={() => handleWithdraw(myApp._id)}>Withdraw</Button>
                                                            )}
                                                            {myApp.status === 'WITHDRAWN' && (
                                                                <Button size="sm" className="h-8 mt-1" disabled={applyingTo === drive._id} onClick={() => handleApply(drive._id)}>
                                                                    {applyingTo === drive._id ? '...' : 'Re-apply'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                } else {
                                                    return (
                                                        <Button size="sm" className="h-8" disabled={applyingTo === drive._id} onClick={() => handleApply(drive._id)}>
                                                            {applyingTo === drive._id ? 'Applying...' : 'Apply Now'}
                                                        </Button>
                                                    );
                                                }
                                            })()}

                                            {(isAdmin || (isCompany && drive.companyId === user?.companyId)) && (
                                                <Link href={`/drives/${drive._id}/applicants`}>
                                                    <Button variant="outline" size="sm" className="gap-2 h-8 w-full justify-start">
                                                        <Users className="h-3.5 w-3.5" /> Applicants
                                                    </Button>
                                                </Link>
                                            )}

                                            {(isAdmin || (isCompany && drive.companyId === user?.companyId)) && (
                                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-8 w-full justify-start gap-2" onClick={() => handleDelete(drive._id)}>
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}

            {/* Create Drive Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Schedule Placement Drive</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Company *</label>
                            <select
                                className={selectClass}
                                value={form.companyId}
                                disabled={isCompany}
                                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                            >
                                <option value="">Select Company</option>
                                {companies
                                    .filter(c => isCompany ? c._id === user?.companyId : true)
                                    .map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Title *</label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Campus Recruitment Drive" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Date *</label>
                                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Time</label>
                                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Venue</label>
                                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Seminar Hall A" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <select className={selectClass} value={form.driveType} onChange={(e) => setForm({ ...form, driveType: e.target.value })}>
                                    <option value="ON_CAMPUS">On Campus</option>
                                    <option value="OFF_CAMPUS">Off Campus</option>
                                    <option value="VIRTUAL">Virtual</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Min CGPA</label>
                            <Input type="number" step="0.1" value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// aria-label placeholder
