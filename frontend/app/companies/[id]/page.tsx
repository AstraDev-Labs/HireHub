"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function CompanyDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    // Data State
    const [company, setCompany] = useState<any>(null);
    const [rounds, setRounds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);

    // Edit State (Company Only)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        description: '',
        website: '',
        location: [] as string[],
        packageLpa: 0,
        minCgpa: 0,
        jobRoles: [] as string[],
        hiringStatus: 'OPEN',
        newLocation: '',
        newJobRole: ''
    });

    // State for eligibility check
    const [studentProfile, setStudentProfile] = useState<any>(null);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                // 1. Fetch Company Details
                const companyRes = await api.get(`/companies/${id}`);
                const companyData = companyRes.data.data.company;
                setCompany(companyData);

                // Initialize Edit Form
                setEditForm({
                    description: companyData.description || '',
                    website: companyData.website || '',
                    location: Array.isArray(companyData.location) ? companyData.location : (companyData.location ? [companyData.location] : []),
                    packageLpa: companyData.packageLpa || 0,
                    minCgpa: companyData.minCgpa || 0,
                    jobRoles: companyData.jobRoles || [],
                    hiringStatus: companyData.hiringStatus || 'OPEN',
                    newLocation: '',
                    newJobRole: ''
                });

                // 2. Fetch Rounds (Now accessible to both Company & Student)
                try {
                    const roundsRes = await api.get(`/companies/${id}/rounds`);
                    setRounds(roundsRes.data.data.rounds);
                } catch (e) {
                    console.error("Failed to fetch rounds", e);
                }

                // 3. Student Specific Checks
                if (user?.role === 'STUDENT') {
                    // Check Application Status
                    try {
                        const statusRes = await api.get('/students/my-status');
                        const myStatus = statusRes.data.data.statuses.find((s: any) => s.companyId._id === id);
                        if (myStatus) setHasApplied(true);
                    } catch (e) {
                        console.error("Failed to check status", e);
                    }

                    // Fetch Latest Student Profile (for CGPA)
                    try {
                        const profileRes = await api.get('/students/my-profile');
                        setStudentProfile(profileRes.data.data.student);
                    } catch (e) {
                        console.error("Failed to fetch my profile", e);
                    }
                }

            } catch (err) {
                console.error("Failed to load company details", err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    // --- Student Actions ---
    const handleApply = async () => {
        if (!user) {
            toast.error("Please login to apply");
            router.push('/login');
            return;
        }

        // Use fetched profile CGPA or fallback to user context (handle 0 case)
        const currentCgpa = studentProfile?.cgpa ?? user.cgpa ?? 0;

        // Eligibility Checks
        if (company.hiringStatus !== 'OPEN') {
            toast.error("This company is not currently hiring.");
            return;
        }

        if (currentCgpa < company.minCgpa) {
            toast.error(`Your CGPA (${currentCgpa}) does not meet the minimum requirement (${company.minCgpa}).`);
            return;
        }

        if (!confirm(`Apply to ${company.name}?`)) return;

        try {
            await api.post(`/companies/${id}/apply`);
            toast.success("Applied successfully!");
            setHasApplied(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to apply");
        }
    };

    // --- Company Actions (Edit Profile) ---
    const handleUpdateProfile = async () => {
        try {
            const { newLocation, newJobRole, ...updateData } = editForm;
            const res = await api.patch('/companies/my/profile', updateData);
            setCompany(res.data.data.company);
            setIsEditModalOpen(false);
            toast.success("Profile updated successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        }
    };

    const addLocation = () => {
        if (editForm.newLocation.trim()) {
            setEditForm(prev => ({ ...prev, location: [...prev.location, prev.newLocation.trim()], newLocation: '' }));
        }
    };

    const removeLocation = (idx: number) => {
        setEditForm(prev => ({ ...prev, location: prev.location.filter((_, i) => i !== idx) }));
    };

    const addJobRole = () => {
        if (editForm.newJobRole.trim()) {
            setEditForm(prev => ({ ...prev, jobRoles: [...prev.jobRoles, prev.newJobRole.trim()], newJobRole: '' }));
        }
    };

    const removeJobRole = (idx: number) => {
        setEditForm(prev => ({ ...prev, jobRoles: prev.jobRoles.filter((_, i) => i !== idx) }));
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!company) return <div className="p-8 text-center">Company not found.</div>;

    // Eligibility Check for UI
    const currentCgpa = studentProfile?.cgpa ?? user?.cgpa ?? 0;
    const isEligible = user?.role === 'STUDENT' && currentCgpa >= company.minCgpa && company.hiringStatus === 'OPEN';
    const eligibilityReason = !user ? "Login to apply" :
        user.role !== 'STUDENT' ? "" :
            company.hiringStatus !== 'OPEN' ? "Hiring Closed" :
                currentCgpa < company.minCgpa ? `Min CGPA: ${company.minCgpa}` : "Eligible";


    return (
        <div className="container mx-auto py-8 space-y-6 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest px-0 hover:bg-transparent transition-colors" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2 stroke-[3]" /> Back
            </Button>

            <Card className="border-border bg-card text-card-foreground shadow-lg overflow-hidden border-2">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-4">
                            <CardTitle className="text-4xl font-black tracking-tight text-foreground">{company.name}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={company.hiringStatus === 'OPEN' ? 'default' : 'secondary'} className={cn(
                                    "font-black tracking-[0.1em] px-4 py-1.5 uppercase text-[10px]",
                                    company.hiringStatus === 'OPEN' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground"
                                )}>
                                    {company.hiringStatus === 'OPEN' ? '🟢 Recruitment Open' : '⚪ Recruitment Paused'}
                                </Badge>
                                {company.location.map((loc: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="border-border/50 bg-background/50 text-muted-foreground font-bold text-[10px] uppercase px-3 py-1">
                                        {loc}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        {(user?.role === 'COMPANY' && user.companyId === id) && (
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => setIsEditModalOpen(true)} variant="outline" className="border-border hover:bg-muted font-bold text-[10px] uppercase tracking-widest h-10 px-6">Edit Profile</Button>
                                <Button onClick={() => router.push(`/companies/${id}/rounds`)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest h-10 px-6 shadow-xl shadow-primary/20">Manage Pipeline</Button>
                            </div>
                        )}
                        {user?.role === 'STUDENT' && (
                            <div className="flex flex-col items-end gap-2">
                                <Button
                                    onClick={handleApply}
                                    disabled={hasApplied || !isEligible}
                                    className={cn(
                                        "h-12 px-8 font-black uppercase text-xs tracking-widest transition-all active:scale-95",
                                        hasApplied ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20"
                                    )}
                                >
                                    {hasApplied ? "✓ Application Sent" : "Deploy Application"}
                                </Button>
                                {!hasApplied && !isEligible && (
                                    <span className="text-[10px] text-destructive font-black uppercase tracking-widest bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">{eligibilityReason}</span>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8 px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground border-l-4 border-primary pl-3">Corporate Mission</h3>
                                <p className="text-foreground/80 leading-relaxed font-medium whitespace-pre-wrap text-lg">{company.description || 'No description provided.'}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Card className="bg-muted/30 border-border/50 shadow-inner rounded-2xl overflow-hidden">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex flex-col gap-1 border-b border-border/50 pb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Digital Gateway</span>
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 font-bold transition-colors truncate">
                                            {company.website?.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-border/50 pb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compensation</span>
                                        <span className="font-black text-foreground">{company.packageLpa} LPA</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-border/50 pb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Threshold</span>
                                        <span className={cn("font-black", user?.role === 'STUDENT' && currentCgpa < company.minCgpa ? 'text-destructive underline decoration-2 underline-offset-4' : 'text-foreground')}>
                                            {company.minCgpa} CGPA
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</span>
                                        <span className="font-bold text-foreground text-sm">{company.email}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Target Roles</h3>
                                <div className="flex flex-wrap gap-2">
                                    {company.jobRoles.map((role: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary font-bold px-3 py-1 rounded-lg transition-all">{role}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selection Engine */}
            <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b border-border/50 py-6 px-8">
                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        Selection Architecture
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {rounds.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground font-medium italic">Architectural stages for this recruitment drive are currently being classified.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {rounds.map((round) => (
                                <div key={round._id} className="flex items-start p-8 hover:bg-muted/20 transition-all group">
                                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-sm mr-6 border border-primary/20 shadow-sm group-hover:scale-110 transition-transform">
                                        {round.roundOrder}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-black text-lg text-foreground uppercase tracking-tight">{round.roundType || round.roundName}</h4>
                                        <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl">{round.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Company Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Website</label>
                                <Input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Package (LPA)</label>
                                <Input type="number" value={editForm.packageLpa} onChange={(e) => setEditForm({ ...editForm, packageLpa: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Min CGPA</label>
                                <Input type="number" step="0.1" value={editForm.minCgpa} onChange={(e) => setEditForm({ ...editForm, minCgpa: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Hiring Status</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={editForm.hiringStatus}
                                    onChange={(e) => setEditForm({ ...editForm, hiringStatus: e.target.value })}
                                >
                                    <option value="OPEN">OPEN</option>
                                    <option value="CLOSED">CLOSED</option>
                                </select>
                            </div>
                        </div>

                        {/* Job Roles Management */}
                        <div>
                            <label className="text-sm font-medium">Job Roles</label>
                            <div className="flex gap-2 mb-2">
                                <Input placeholder="Add Job Role" value={editForm.newJobRole} onChange={(e) => setEditForm({ ...editForm, newJobRole: e.target.value })} />
                                <Button type="button" onClick={addJobRole} variant="secondary"><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editForm.jobRoles.map((role, idx) => (
                                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                                        {role} <Trash className="h-3 w-3 cursor-pointer" onClick={() => removeJobRole(idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Location Management */}
                        <div>
                            <label className="text-sm font-medium">Locations</label>
                            <div className="flex gap-2 mb-2">
                                <Input placeholder="Add Location (e.g. Bangalore, Remote)" value={editForm.newLocation} onChange={(e) => setEditForm({ ...editForm, newLocation: e.target.value })} />
                                <Button type="button" onClick={addLocation} variant="secondary"><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editForm.location.map((loc, idx) => (
                                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                                        {loc} <Trash className="h-3 w-3 cursor-pointer" onClick={() => removeLocation(idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateProfile}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
