"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Plus, Trash, Edit, X } from 'lucide-react';

// UI Helpers
const labelClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
const textareaClass = "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function CompanyDashboard() {
    const { user } = useAuth();
    const [company, setCompany] = useState<any>(null);
    const [rounds, setRounds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({ description: '', location: '', website: '', jobRoles: [] as string[] });

    // Round Form State
    const [isRoundDialogOpen, setIsRoundDialogOpen] = useState(false);
    const [currentRound, setCurrentRound] = useState<any>(null); // For editing
    const [roundForm, setRoundForm] = useState({ roundName: '', description: '', roundOrder: 1 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [companyRes, roundsRes] = await Promise.all([
                api.get('/companies/my/profile'),
                api.get('/companies/my/rounds')
            ]);
            const comp = companyRes.data.data.company;
            setCompany(comp);
            setProfileForm({
                description: comp.description || '',
                location: comp.location || '',
                website: comp.website || '',
                jobRoles: comp.jobRoles || (comp.jobRole ? [comp.jobRole] : [])
            });
            setRounds(roundsRes.data.data.rounds);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch('/companies/my/profile', profileForm);
            toast.success("Profile updated successfully");
            setIsEditing(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    // Role helpers
    const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !profileForm.jobRoles.includes(val)) {
                setProfileForm({ ...profileForm, jobRoles: [...profileForm.jobRoles, val] });
                e.currentTarget.value = '';
            }
        }
    };

    const removeRole = (roleToRemove: string) => {
        setProfileForm({ ...profileForm, jobRoles: profileForm.jobRoles.filter(r => r !== roleToRemove) });
    };

    const handleRoundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentRound) {
                await api.patch(`/companies/rounds/${currentRound._id}`, roundForm);
                toast.success("Round updated");
            } else {
                await api.post('/companies/rounds', roundForm);
                toast.success("Round created");
            }
            setIsRoundDialogOpen(false);
            setCurrentRound(null);
            setRoundForm({ roundName: '', description: '', roundOrder: rounds.length + 1 });
            fetchData();
        } catch (error) {
            toast.error("Failed to save round");
        }
    };

    const handleDeleteRound = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/companies/rounds/${id}`);
            toast.success("Round deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete round");
        }
    };

    const openRoundDialog = (round?: any) => {
        if (round) {
            setCurrentRound(round);
            setRoundForm({ roundName: round.roundName, description: round.description, roundOrder: round.roundOrder });
        } else {
            setCurrentRound(null);
            setRoundForm({ roundName: '', description: '', roundOrder: rounds.length + 1 });
        }
        setIsRoundDialogOpen(true);
    };

    if (loading) return <div>Loading Dashboard...</div>;
    if (!company) return <div>No Company Linked. Please contact Admin.</div>;

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Company Dashboard</h1>
                <p className="text-muted-foreground font-medium">Manage your corporate profile and hiring pipeline.</p>
            </div>

            {/* Profile Section */}
            <Card className="border-border bg-card text-card-foreground shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                    <div>
                        <CardTitle className="text-2xl font-bold text-foreground">{company.name}</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">{company.jobRole} | {company.packageLpa} LPA</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="border-border hover:bg-muted font-bold text-xs uppercase tracking-widest px-6 h-10 transition-all">
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    {isEditing ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="grid gap-2">
                                <label className={labelClass}>Job Roles (Press Enter to add)</label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background">
                                    {profileForm.jobRoles.map((role, index) => (
                                        <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center">
                                            {role}
                                            <button type="button" onClick={() => removeRole(role)} className="ml-1 text-primary hover:text-red-500">
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                                        placeholder={profileForm.jobRoles.length === 0 ? "e.g. SDE" : ""}
                                        onKeyDown={handleRoleKeyDown}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className={labelClass}>Description</label>
                                <textarea
                                    className={textareaClass}
                                    value={profileForm.description}
                                    onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className={labelClass}>Location</label>
                                    <Input
                                        value={profileForm.location}
                                        onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className={labelClass}>Website</label>
                                    <Input
                                        value={profileForm.website}
                                        onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button type="submit">Save Changes</Button>
                        </form>
                    ) : (
                        <div className="space-y-2">
                            <div>
                                <strong>Job Roles:</strong>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {company.jobRoles && company.jobRoles.length > 0 ? (
                                        company.jobRoles.map((role: string, idx: number) => (
                                            <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{role}</span>
                                        ))
                                    ) : (
                                        <span>{company.jobRole || 'N/A'}</span>
                                    )}
                                </div>
                            </div>
                            <p><strong>Location:</strong> {company.location || 'N/A'}</p>
                            <p><strong>Website:</strong> {company.website || 'N/A'}</p>
                            <p className="whitespace-pre-wrap">{company.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rounds Section */}
            <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/50 pb-6">
                    <div>
                        <CardTitle className="text-xl font-bold">Hiring Rounds</CardTitle>
                        <CardDescription>Define the sequence of selection stages.</CardDescription>
                    </div>
                    <Button onClick={() => openRoundDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-widest px-6 h-10 shadow-lg shadow-primary/20 transition-all">
                        <Plus className="w-4 h-4 mr-2 stroke-[3]" /> Add Round
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                        {rounds.map((round) => (
                            <div key={round._id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-black">{round.roundOrder}</span>
                                        <h3 className="font-bold text-lg text-foreground">{round.roundName}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium pl-10">{round.description}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => openRoundDialog(round)} className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20" onClick={() => handleDeleteRound(round._id)}>
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {rounds.length === 0 && <p className="text-muted-foreground font-medium text-center py-12">No hiring rounds configured yet.</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Round Modal */}
            {isRoundDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4 shadow-xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{currentRound ? 'Edit Round' : 'Add New Round'}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsRoundDialogOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleRoundSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <label className={labelClass}>Round Name</label>
                                <Input
                                    placeholder="e.g. Technical Interview"
                                    value={roundForm.roundName}
                                    onChange={e => setRoundForm({ ...roundForm, roundName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className={labelClass}>Order</label>
                                <Input
                                    type="number"
                                    value={roundForm.roundOrder}
                                    onChange={e => setRoundForm({ ...roundForm, roundOrder: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className={labelClass}>Description</label>
                                <textarea
                                    className={textareaClass}
                                    value={roundForm.description}
                                    onChange={e => setRoundForm({ ...roundForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" type="button" onClick={() => setIsRoundDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">Save</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// aria-label placeholder
