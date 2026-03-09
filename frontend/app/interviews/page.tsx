"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CalendarDays, Clock, Video, User, Building2, CheckCircle, XCircle, FileSpreadsheet, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
function isSafeHttpUrl(rawUrl?: string | null): string | null {
    if (!rawUrl) return null;
    try {
        const url = new URL(rawUrl);
        return url.protocol === 'http:' || url.protocol === 'https:' ? rawUrl : null;
    } catch {
        return null;
    }
}

export default function InterviewsPage() {
    const { user } = useAuth();
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);

    // For manual scheduling
    const [scheduleForm, setScheduleForm] = useState({
        driveId: '',
        roundId: '',
        studentEmail: '',
        date: '',
        time: '',
        durationMinutes: 30,
        meetLink: ''
    });

    // Student Search State
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    // Drives and Rounds state
    const [drives, setDrives] = useState<any[]>([]);
    const [rounds, setRounds] = useState<any[]>([]);

    useEffect(() => {
        if (showScheduleDialog && drives.length === 0) {
            fetchDrives();
        }
    }, [showScheduleDialog]);

    const fetchDrives = async () => {
        try {
            const res = await api.get('/drives');
            const allDrives = res.data.data.drives || [];
            if (user?.role === 'COMPANY') {
                setDrives(allDrives.filter((d: any) => d.companyId === user.companyId));
            } else {
                setDrives(allDrives);
            }
        } catch (err) {
            console.error('Failed to fetch drives', err);
        }
    };

    useEffect(() => {
        if (scheduleForm.driveId) {
            const selectedDrive = drives.find(d => d._id === scheduleForm.driveId);
            if (selectedDrive && selectedDrive.companyId) {
                fetchRounds(selectedDrive.companyId);
            }
        } else {
            setRounds([]);
        }
    }, [scheduleForm.driveId, drives]);

    const fetchRounds = async (companyId: string) => {
        try {
            const res = await api.get(`/companies/${companyId}/rounds`);
            // Reset round selection if it previously belonged to another company
            setScheduleForm(prev => ({ ...prev, roundId: '' }));
            setRounds(res.data.data.rounds || []);
        } catch (err) {
            console.error('Failed to fetch rounds', err);
        }
    };

    useEffect(() => {
        if (!studentSearchQuery || studentSearchQuery.length < 2) {
            setStudentSearchResults([]);
            setShowStudentDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data } = await api.get(`/students/search?query=${studentSearchQuery}`);
                setStudentSearchResults(data.data.students || []);
                setShowStudentDropdown(true);
            } catch (err) {
                console.error("Failed to search students", err);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [studentSearchQuery]);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this interview schedule?')) return;

        try {
            await api.delete(`/interviews/${id}`);
            toast.success('Interview schedule deleted');
            fetchInterviews();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete interview schedule');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const ExcelJS = await import('exceljs');
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) {
                toast.error('The Excel file is empty.');
                setLoading(false);
                return;
            }

            const json: any[] = [];
            const headerRow = worksheet.getRow(1);
            const headers: string[] = [];
            headerRow.eachCell((cell: any, colNumber: number) => {
                headers[colNumber] = cell.value?.toString() || '';
            });

            worksheet.eachRow((row: any, rowNumber: number) => {
                if (rowNumber === 1) return; // Skip headers
                const rowData: any = {};
                row.eachCell((cell: any, colNumber: number) => {
                    const header = headers[colNumber];
                    if (header) rowData[header] = cell.value;
                });
                json.push(rowData);
            });

            if (json.length === 0) {
                toast.error('The Excel file is empty.');
                setLoading(false);
                return;
            }

            // Group by driveId and roundId
            const groups: Record<string, any> = {};

            json.forEach(row => {
                const driveId = row.driveId || row.DriveId;
                const roundId = row.roundId || row.RoundId;
                const studentEmail = row.studentEmail || row.StudentEmail || row.email || row.Email;

                if (!driveId || !roundId || !studentEmail) return;

                const key = `${driveId}_${roundId}`;
                if (!groups[key]) {
                    groups[key] = { driveId, roundId, slots: [] };
                }

                groups[key].slots.push({
                    studentEmail,
                    scheduledAt: row.scheduledAt || row.Date || new Date().toISOString(),
                    durationMinutes: parseInt(row.durationMinutes || row.Duration || '30'),
                    meetLink: row.meetLink || row.Link || ''
                });
            });

            let successCount = 0;
            const groupKeys = Object.keys(groups);

            if (groupKeys.length === 0) {
                toast.error('No valid rows found. Ensure driveId, roundId, and studentEmail columns exist.');
                setLoading(false);
                return;
            }

            for (const key of groupKeys) {
                await api.post('/interviews/schedule', groups[key]);
                successCount += groups[key].slots.length;
            }

            toast.success(`Successfully imported ${successCount} interview slots.`);
            fetchInterviews();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to parse Excel file.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleScheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scheduleForm.driveId || !scheduleForm.roundId || !scheduleForm.studentEmail || !scheduleForm.date || !scheduleForm.time) {
            toast.error("Please fill in all required fields");
            return;
        }

        const scheduledAt = `${scheduleForm.date}T${scheduleForm.time}`;

        try {
            setSubmitting(true);
            const payload = {
                driveId: scheduleForm.driveId,
                roundId: scheduleForm.roundId,
                slots: [{
                    studentEmail: scheduleForm.studentEmail,
                    scheduledAt: scheduledAt,
                    durationMinutes: scheduleForm.durationMinutes,
                    meetLink: scheduleForm.meetLink
                }]
            };

            await api.post('/interviews/schedule', payload);
            toast.success("Interview scheduled successfully!");
            setShowScheduleDialog(false);
            setScheduleForm({ driveId: '', roundId: '', studentEmail: '', date: '', time: '', durationMinutes: 30, meetLink: '' });
            setStudentSearchQuery('');
            fetchInterviews();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to schedule interview");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredInterviews = useMemo(() => {
        return interviews.filter((interview: any) =>
            interview.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            interview.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            interview.roundName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [interviews, searchQuery]);

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
                {(user?.role === 'ADMIN' || user?.role === 'STAFF' || user?.role === 'COMPANY') && (
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => setShowScheduleDialog(true)} disabled={loading}>
                            <CalendarDays className="w-4 h-4 mr-2" />
                            Schedule Interview
                        </Button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Import Schedule
                        </Button>
                    </div>
                )}
            </div>

            <div className="mb-6 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by student, company, or round..."
                    className="pl-10 h-10 bg-card/50 border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredInterviews.length === 0 && interviews.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <CalendarDays className="h-10 w-10 mb-4 opacity-50" />
                        <p>No interviews scheduled yet.</p>
                        {user?.role === 'COMPANY' && (
                            <p className="text-sm mt-2">Go to the Drive Applicants page to schedule interviews with shortlisted students.</p>
                        )}
                    </CardContent>
                </Card>
            ) : filteredInterviews.length === 0 && interviews.length > 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <Search className="h-10 w-10 mb-4 opacity-50" />
                        <p>No results found for your search.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {filteredInterviews.map((slot) => {
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
                                        {(() => {
                                            const safeMeetLink = isSafeHttpUrl(slot.meetLink);
                                            if (!safeMeetLink) return null;
                                            return (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Video className="h-4 w-4 text-indigo-500" />
                                                    <a href={safeMeetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                        Join Meeting
                                                    </a>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {(user?.role === 'ADMIN' || user?.role === 'STAFF' || (isCompany && slot.companyId === user?.companyId)) && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-border mt-4">
                                            {isCompany && slot.status === 'SCHEDULED' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="w-full text-green-500 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
                                                        onClick={() => handleUpdateStatus(slot.id || slot._id, 'COMPLETED')}>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Complete
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                                                        onClick={() => handleUpdateStatus(slot.id || slot._id, 'NO_SHOW')}>
                                                        <XCircle className="h-4 w-4 mr-2" /> No Show
                                                    </Button>
                                                </>
                                            )}
                                            <Button size="sm" variant="ghost" className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(slot.id || slot._id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Interview</DialogTitle>
                        <DialogDescription>
                            Manually schedule an interview for a specific student.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleScheduleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="driveId">Select Drive *</Label>
                                <select
                                    id="driveId"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={scheduleForm.driveId}
                                    onChange={e => setScheduleForm({ ...scheduleForm, driveId: e.target.value })}
                                >
                                    <option value="" disabled>Select a drive</option>
                                    {drives.map(drive => (
                                        <option key={drive._id} value={drive._id}>
                                            {drive.companyName} - {drive.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="roundId">Select Round *</Label>
                                <select
                                    id="roundId"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={scheduleForm.roundId}
                                    onChange={e => setScheduleForm({ ...scheduleForm, roundId: e.target.value })}
                                    disabled={!scheduleForm.driveId || rounds.length === 0}
                                >
                                    <option value="" disabled>{rounds.length === 0 ? 'Select a drive first' : 'Select a round'}</option>
                                    {rounds.map(round => (
                                        <option key={round._id} value={round._id}>
                                            {round.roundType || round.roundName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="studentEmail">Search Student *</Label>
                                <Input
                                    id="studentEmail"
                                    placeholder="Type student name..."
                                    value={scheduleForm.studentEmail || studentSearchQuery}
                                    onChange={e => {
                                        setScheduleForm({ ...scheduleForm, studentEmail: '' });
                                        setStudentSearchQuery(e.target.value);
                                    }}
                                    onFocus={() => { if (studentSearchResults.length > 0) setShowStudentDropdown(true); }}
                                    onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                                    autoComplete="off"
                                />
                                {showStudentDropdown && studentSearchResults.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-background border border-border rounded-md shadow-md max-h-48 overflow-auto top-full mt-1">
                                        {studentSearchResults.map(student => (
                                            <li
                                                key={student._id}
                                                className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                                                onClick={() => {
                                                    setScheduleForm({ ...scheduleForm, studentEmail: student.email });
                                                    setStudentSearchQuery(student.name);
                                                    setShowStudentDropdown(false);
                                                }}
                                            >
                                                <div className="font-medium">{student.name}</div>
                                                <div className="text-xs text-muted-foreground">{student.email}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date *</Label>
                                    <Input id="date" type="date" required value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="time">Time *</Label>
                                    <Input id="time" type="time" required value={scheduleForm.time} onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="durationMinutes">Duration (mins)</Label>
                                    <Input
                                        id="durationMinutes"
                                        type="number"
                                        min="5"
                                        aria-label="Interview duration in minutes"
                                        value={scheduleForm.durationMinutes}
                                        onChange={e => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value) || 30 })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="meetLink">Meeting Link (Optional)</Label>
                                <Input
                                    id="meetLink"
                                    placeholder="https://meet.google.com/..."
                                    aria-label="Online meeting link"
                                    value={scheduleForm.meetLink}
                                    onChange={e => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Scheduling..." : "Schedule Interview"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// aria-label placeholder







