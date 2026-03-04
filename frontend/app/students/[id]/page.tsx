"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, GraduationCap, Mail, Phone, Building2, BookOpen, Briefcase, Loader2, User as UserIcon, FileText, Github, Linkedin, Globe, Download, ExternalLink, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentDetail {
    _id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    batchYear: number;
    cgpa: number;
    placementStatus: string;
    resumeLink?: string;
    socialLinks?: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
    };
    userId?: { _id: string; fullName: string; email: string };
}

export default function StudentDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const { data } = await api.get(`/students/${id}`);
                setStudent(data.data.student);
            } catch (err: any) {
                console.error(err);
                toast.error(err.response?.data?.message || "Failed to load student details");
            } finally {
                setLoading(false);
            }
        };
        if (user && id) fetchStudent();
    }, [user, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!student) {
        return <div className="p-8 text-center text-muted-foreground">Student not found.</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest px-0 hover:bg-transparent transition-colors">
                <ArrowLeft className="h-4 w-4 stroke-[3]" />
                Back to Students
            </Button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tight text-foreground">{student.name}</h2>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Student Profile Identity</p>
                </div>
                <div className={cn(
                    "inline-flex items-center rounded-xl border px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm h-fit w-fit",
                    student.placementStatus === 'PLACED'
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                )}>
                    {student.placementStatus === 'PLACED' ? '✓ Placed in Industry' : '○ Pending Placement'}
                </div>
            </div>

            {/* Academic Info */}
            <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary stroke-[2.5]" />
                        Academic Records
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {student.department}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch Year</label>
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                {student.batchYear}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CGPA</label>
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                {student.cgpa}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Resume & Professional Links */}
            {(student.resumeLink || (student.socialLinks && Object.values(student.socialLinks).some(v => v))) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resume Card */}
                    <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary stroke-[2.5]" />
                                Professional Resume
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1 flex flex-col justify-center">
                            {student.resumeLink ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="bg-primary/10 p-3 rounded-xl">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate tracking-tight">Student_Resume.pdf</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Verified Document</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={student.resumeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2 font-bold uppercase tracking-widest text-[10px] h-10")}
                                        >
                                            <Eye className="h-3.5 w-3.5" /> View
                                        </a>
                                        <a
                                            href={student.resumeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(buttonVariants({ variant: "default" }), "w-full gap-2 font-bold uppercase tracking-widest text-[10px] h-10")}
                                        >
                                            <Download className="h-3.5 w-3.5" /> Download
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground italic tracking-tight font-medium">No external resume document uploaded.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Social Links Card */}
                    <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary stroke-[2.5]" />
                                Digital Footprint
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1">
                            <div className="space-y-3">
                                {student.socialLinks?.linkedin && (
                                    <a href={student.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                                        <div className="bg-blue-500/10 p-2 rounded-lg group-hover:bg-blue-500/20"><Linkedin className="h-4 w-4 text-blue-600" /></div>
                                        <span className="text-sm font-bold flex-1">LinkedIn Profile</span>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                )}
                                {student.socialLinks?.github && (
                                    <a href={student.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                                        <div className="bg-slate-950/10 p-2 rounded-lg group-hover:bg-slate-950/20"><Github className="h-4 w-4 text-slate-900 dark:text-slate-100" /></div>
                                        <span className="text-sm font-bold flex-1">GitHub Portfolio</span>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                )}
                                {student.socialLinks?.portfolio && (
                                    <a href={student.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                                        <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20"><Globe className="h-4 w-4 text-emerald-600" /></div>
                                        <span className="text-sm font-bold flex-1">Personal Website</span>
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                    </a>
                                )}
                                {!student.socialLinks?.linkedin && !student.socialLinks?.github && !student.socialLinks?.portfolio && (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">No professional links provided.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Placement Status */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Placement Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <span className={cn(
                        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
                        student.placementStatus === 'PLACED'
                            ? "border-green-200 bg-green-100 text-green-700"
                            : "border-amber-200 bg-amber-100 text-amber-700"
                    )}>
                        {student.placementStatus === 'PLACED' ? '✅ Placed' : '🔍 Not Yet Placed'}
                    </span>
                </CardContent>
            </Card>
        </div>
    );
}
