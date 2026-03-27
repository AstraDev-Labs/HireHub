"use client";

import { useEffect, useState } from 'react';
import { UserCircle, Camera, Mail, Phone, GraduationCap, Building2, Briefcase, Shield, Save, Loader2, BookOpen, Users, Lock, Eye, EyeOff, CheckCircle2, XCircle, Github, Linkedin, ExternalLink, Globe, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { EncryptionManager } from '@/lib/encryption';
import toast from 'react-hot-toast';
import Link from 'next/link';
interface ProfileData {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    profileImage?: string;
    department?: string;
    cgpa?: number;
    batchYear?: number;
    placementStatus?: string;
    studentId?: string;
    companyName?: string;
    companyEmail?: string;
    companyWebsite?: string;
    companyId?: string;
    resumeLink?: string;
    socialLinks?: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
    };
    linkedStudent?: {
        name: string;
        department: string;
        batchYear: number;
        cgpa: number;
        placementStatus: string;
    };
    studentName?: string;
}

export default function ProfilePage() {
    const { user, privateKey } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cgpa, setCgpa] = useState('');
    const [socialLinks, setSocialLinks] = useState({ github: '', linkedin: '', portfolio: '' });

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/users/me');
                const p = data.data.user;
                setProfile(p);
                setFullName(p.fullName || '');
                setPhoneNumber(p.phoneNumber || '');
                if (p.role === 'STUDENT') {
                    setCgpa(p.cgpa?.toString() || '0');
                    if (p.socialLinks) {
                        setSocialLinks({
                            github: p.socialLinks.github || '',
                            linkedin: p.socialLinks.linkedin || '',
                            portfolio: p.socialLinks.portfolio || ''
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchProfile();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const body: any = { fullName, phoneNumber };
            if (!/^\d{10}$/.test(phoneNumber)) { toast.error("Phone number must be exactly 10 digits"); setSaving(false); return; }
            if (profile?.role === 'STUDENT') {
                body.cgpa = parseFloat(cgpa);
                if (isNaN(body.cgpa) || body.cgpa < 0 || body.cgpa > 10) { toast.error("CGPA must be between 0 and 10"); setSaving(false); return; }
                body.socialLinks = socialLinks;
            }
            const { data } = await api.patch('/users/me', body);
            const p = data.data.user;
            setProfile(p);
            if (p.role === 'STUDENT') setCgpa(p.cgpa?.toString() || '0');

            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                parsed.fullName = fullName;
                if (p.cgpa !== undefined) parsed.cgpa = p.cgpa;
                localStorage.setItem('user', JSON.stringify(parsed));
            }
            toast.success("Profile updated successfully!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) { toast.error("Please fill in all password fields"); return; }
        if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        if (!/[A-Z]/.test(newPassword)) { toast.error("Password must contain an uppercase letter"); return; }
        if (!/[a-z]/.test(newPassword)) { toast.error("Password must contain a lowercase letter"); return; }
        if (!/[0-9]/.test(newPassword)) { toast.error("Password must contain a number"); return; }
        if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }

        setChangingPassword(true);
        try {
            let payload: any = { currentPassword, newPassword };

            // If we have an active private key in memory, re-encrypt it with the NEW password
            if (privateKey && user) {
                try {
                    const exportedPrivJWK = await EncryptionManager.exportKey(privateKey);
                    const newEncryptedPrivKey = await EncryptionManager.encryptWithPassword(
                        exportedPrivJWK,
                        newPassword,
                        user.email.toLowerCase()
                    );
                    payload.encryptedPrivateKey = newEncryptedPrivKey;
                } catch (e) {
                    console.error("Failed to re-encrypt private key with new password", e);
                    toast.error("Failed to secure encryption keys with new password.");
                    setChangingPassword(false);
                    return;
                }
            }

            await api.patch('/users/change-password', payload);
            toast.success("Password changed successfully!");
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!profile) return <div className="p-8 text-center text-muted-foreground">Could not load profile.</div>;

    const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
        STUDENT: { label: 'Student', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: GraduationCap },
        COMPANY: { label: 'Company Staff', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Briefcase },
        STAFF: { label: 'Staff / HoD', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Building2 },
        ADMIN: { label: 'Administrator', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: Shield },
        PARENT: { label: 'Parent', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Users },
    };
    const rc = roleConfig[profile.role] || roleConfig.STUDENT;
    const RoleIcon = rc.icon;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h2>
                    <p className="text-muted-foreground mt-1">Manage your account details</p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", rc.color)}>
                    <RoleIcon className="h-3.5 w-3.5" />
                    {rc.label}
                </span>
            </div>

            {/* Profile Photo Section */}
            <Card className="border-0 shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                                {profile.profileImage ? (
                                    <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle className="h-16 w-16 text-muted-foreground" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/90 transition-colors">
                                <Camera className="h-4 w-4 text-primary-foreground" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            toast.loading("Uploading image...", { id: 'upload' });
                                            const { data: uploadData } = await api.post('/upload', formData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            const imageUrl = uploadData.data.url;

                                            await api.patch('/users/me', { profileImage: imageUrl });

                                            setProfile({ ...profile, profileImage: imageUrl });

                                            const storedUser = localStorage.getItem('user');
                                            if (storedUser) {
                                                const parsed = JSON.parse(storedUser);
                                                parsed.profileImage = imageUrl;
                                                localStorage.setItem('user', JSON.stringify(parsed));
                                            }

                                            toast.success("Profile photo updated!", { id: 'upload' });
                                        } catch (err: any) {
                                            toast.error(err.response?.data?.message || "Upload failed", { id: 'upload' });
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold">{profile.fullName}</h3>
                            <p className="text-sm text-muted-foreground">Update your profile picture to be seen across the platform.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Info (Read-Only) */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" />Account Information</CardTitle>
                    <CardDescription>These details cannot be changed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium"><UserCircle className="h-4 w-4 text-muted-foreground" />{profile.username}</div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium"><Mail className="h-4 w-4 text-muted-foreground" />{profile.email}</div>
                        </div>
                        {profile.department && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium"><Building2 className="h-4 w-4 text-muted-foreground" />{profile.department}</div>
                            </div>
                        )}
                        {profile.role === 'STUDENT' && profile.batchYear && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch Year</label>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium"><BookOpen className="h-4 w-4 text-muted-foreground" />{profile.batchYear}</div>
                            </div>
                        )}
                        {profile.role === 'COMPANY' && profile.companyName && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</label>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium"><Building2 className="h-4 w-4 text-muted-foreground" />{profile.companyName}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Editable Details */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Save className="h-5 w-5 text-primary" />Editable Details</CardTitle>
                    <CardDescription>Update your personal information below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} placeholder="10-digit phone number" maxLength={10} inputMode="numeric" pattern="[0-9]*" />
                        </div>
                        {profile.role === 'STUDENT' && (
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" />Current CGPA</label>
                                <Input type="number" step="0.01" min="0" max="10" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="e.g. 8.50" className="max-w-xs" />
                                <p className="text-xs text-muted-foreground">Enter a value between 0.00 and 10.00</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
                            {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : (<><Save className="mr-2 h-4 w-4" />Save Changes</>)}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student Additional Info & Professional Links */}
            {profile.role === 'STUDENT' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resume Card */}
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Resume</CardTitle>
                            <CardDescription>Your current professional resume.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {profile.resumeLink ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                        <div className="bg-primary/10 p-2 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate leading-none mb-1">Uploaded Resume</p>
                                            <p className="text-xs text-muted-foreground">PDF Document</p>
                                        </div>
                                        <a
                                            href={profile.resumeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 w-8 p-0")}
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </div>
                                    <a
                                        href={profile.resumeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}
                                    >
                                        <Eye className="h-4 w-4" /> View Full Resume
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-muted/30 rounded-xl border border-dashed border-border">
                                    <p className="text-sm text-muted-foreground mb-3">No resume uploaded yet.</p>
                                    <Link
                                        href="/resume-builder"
                                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                                    >
                                        Go to Resume Builder
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Social Links Card */}
                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Professional Links</CardTitle>
                            <CardDescription>LinkedIn, GitHub, and Portfolio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Linkedin className="h-3 w-3" /> LinkedIn</label>
                                <Input value={socialLinks.linkedin} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." className="h-9 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Github className="h-3 w-3" /> GitHub</label>
                                <Input value={socialLinks.github} onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })} placeholder="https://github.com/..." className="h-9 text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Globe className="h-3 w-3" /> Portfolio</label>
                                <Input value={socialLinks.portfolio} onChange={(e) => setSocialLinks({ ...socialLinks, portfolio: e.target.value })} placeholder="https://..." className="h-9 text-sm" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placement Status Card */}
                    {profile.placementStatus && (
                        <Card className="border-0 shadow-md md:col-span-2">
                            <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Placement Status</CardTitle></CardHeader>
                            <CardContent>
                                <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
                                    profile.placementStatus === 'PLACED' ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-amber-500/20 bg-amber-500/10 text-amber-500")}>
                                    {profile.placementStatus === 'PLACED' ? '✅ Placed' : '🔍 Not Yet Placed'}
                                </span>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Parent - Linked Student Info */}
            {profile.role === 'PARENT' && profile.linkedStudent && (
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />Linked Student Details</CardTitle>
                        <CardDescription>Information about your child&apos;s academic progress.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Student Name</label>
                                <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">{profile.linkedStudent.name}</div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                                <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">{profile.linkedStudent.department}</div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Batch Year</label>
                                <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">{profile.linkedStudent.batchYear}</div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CGPA</label>
                                <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm font-medium">{profile.linkedStudent.cgpa}</div>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Placement Status</label>
                                <div>
                                    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
                                        profile.linkedStudent.placementStatus === 'PLACED' ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-amber-500/20 bg-amber-500/10 text-amber-500")}>
                                        {profile.linkedStudent.placementStatus === 'PLACED' ? '✅ Placed' : '🔍 Not Yet Placed'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Password Change */}
            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Change Password</CardTitle>
                    <CardDescription>Update your account password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Password</label>
                            <div className="relative">
                                <Input type={showCurrentPw ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <div className="relative">
                                <Input type={showNewPw ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {/* Password Requirements */}
                            {newPassword && (
                                <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1.5 mt-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Requirements</p>
                                    {[
                                        { label: 'At least 6 characters', met: newPassword.length >= 6 },
                                        { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
                                        { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
                                        { label: 'Contains a number', met: /[0-9]/.test(newPassword) },
                                        { label: 'Passwords match', met: confirmPassword.length > 0 && newPassword === confirmPassword },
                                    ].map((req, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            {req.met ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                            <span className={cn("text-xs transition-colors", req.met ? "text-green-500 font-medium" : "text-muted-foreground")}>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
                            {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-500">Passwords do not match</p>}
                        </div>
                        <Button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword} variant="outline" className="mt-2">
                            {changingPassword ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Changing...</>) : (<><Lock className="mr-2 h-4 w-4" />Change Password</>)}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// aria-label placeholder
