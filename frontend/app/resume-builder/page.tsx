"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Save, DownloadIcon, FileText, Briefcase, GraduationCap, Code, Upload, CheckCircle, ExternalLink, X, Eye, Loader2 } from 'lucide-react';
// Native crypto.randomUUID() is used for ID generation

// Types for Resume Data
interface Education {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    grade?: string;
    startDate?: string;
    endDate?: string;
}

interface Experience {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
    description?: string;
}

interface Project {
    id: string;
    title: string;
    description?: string;
    link?: string;
    technologies?: string | string[];
}

interface Profile {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    education?: Education[];
    experience?: Experience[];
    projects?: Project[];
    skills?: string[];
    resumeLink?: string;
    socialLinks?: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
    };
}

export default function ResumeBuilder() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('education');

    // Profile Data (Loaded from Student record)
    const [profile, setProfile] = useState<Profile | null>(null);

    // Form States
    const [education, setEducation] = useState<Education[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [skills, setSkills] = useState<string>('');
    const [resumeLink, setResumeLink] = useState<string>('');
    const [socials, setSocials] = useState({ github: '', linkedin: '', portfolio: '' });

    useEffect(() => {
        if (user && user.role === 'STUDENT') {
            fetchMyProfile();
        }
    }, [user]);

    const fetchMyProfile = async () => {
        try {
            const { data } = await api.get('/students/my-profile');
            const student = data.data.student; // Backend returns { data: { student: ... } }
            setProfile(student);

            // Populate form states
            if (student.education) setEducation(student.education);
            if (student.experience) setExperience(student.experience);
            if (student.projects) setProjects(student.projects);
            if (student.skills) setSkills(student.skills.join(', '));
            if (student.resumeLink) setResumeLink(student.resumeLink);
            if (student.socialLinks) setSocials({
                github: student.socialLinks.github || '',
                linkedin: student.socialLinks.linkedin || '',
                portfolio: student.socialLinks.portfolio || ''
            });

        } catch (err) {
            toast.error("Failed to load your profile");
        } finally {
            setLoading(false);
        }
    };

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error("Please upload a PDF file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const link = data.data.url;
            setResumeLink(link);

            // Save link to student record immediately
            await api.put(`/students/${profile?._id}`, { resumeLink: link });
            toast.success("Resume uploaded successfully!");
        } catch (err) {
            toast.error("Failed to upload resume");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Process skills from comma separated string to array
            const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

            // Process projects technologies
            const formattedProjects = projects.map(p => ({
                ...p,
                technologies: typeof p.technologies === 'string'
                    ? p.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
                    : p.technologies
            }));

            const payload = {
                education,
                experience,
                projects: formattedProjects,
                skills: skillsArray,
                socialLinks: socials,
                resumeLink
            };

            await api.put(`/students/${profile?._id}`, payload);
            toast.success("Resume data saved successfully!");

        } catch (err: unknown) {
            const error = err as any;
            toast.error(error.response?.data?.message || "Failed to save resume");
        } finally {
            setSaving(false);
        }
    };

    const addItem = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, itemTemplate: Omit<T, 'id'>) => {
        setter((prev) => [...prev, { id: crypto.randomUUID(), ...itemTemplate } as T]);
    };

    const removeItem = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
        setter((prev) => prev.filter(item => item.id !== id));
    };

    const updateItem = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string, field: keyof T, value: unknown) => {
        setter((prev) => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const printResume = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Resume Builder...</div>;

    const navItems = [
        { id: 'education', label: 'Education', icon: <GraduationCap className="h-4 w-4 mr-2" /> },
        { id: 'experience', label: 'Experience', icon: <Briefcase className="h-4 w-4 mr-2" /> },
        { id: 'projects', label: 'Projects', icon: <Code className="h-4 w-4 mr-2" /> },
        { id: 'skills', label: 'Skills & Links', icon: <FileText className="h-4 w-4 mr-2" /> },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] print:h-auto overflow-hidden print:overflow-visible">

            {/* LEFT SIDE: EDITOR (Hidden on print) */}
            <div className="w-full lg:w-[45%] flex flex-col h-full overflow-hidden border border-border rounded-xl bg-card shadow-sm print:hidden">
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Resume Builder
                    </h2>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                </div>

                {/* RESUME UPLOAD SECTION (New) */}
                <div className="p-4 border-b border-border bg-primary/5">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Upload className="h-4 w-4 text-primary" /> Upload Existing Resume
                            </h3>
                            {resumeLink && (
                                <a href={resumeLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> Preview Current
                                </a>
                            )}
                        </div>
                        <div className="relative group">
                            <input
                                type="file"
                                id="resume-upload"
                                className="hidden"
                                accept=".pdf"
                                onChange={handleResumeUpload}
                                disabled={uploading}
                            />
                            <label
                                htmlFor="resume-upload"
                                className={cn(
                                    "flex flex-col items-center justify-center py-4 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                                    uploading ? "bg-muted animate-pulse border-muted-foreground/30" : "bg-card hover:bg-muted/50 border-primary/20 hover:border-primary",
                                    resumeLink ? "border-green-500/30 bg-green-500/5" : ""
                                )}
                            >
                                {uploading ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading PDF...
                                    </div>
                                ) : resumeLink ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-widest">
                                        <CheckCircle className="h-4 w-4" /> Resume Uploaded
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-xs font-bold text-primary uppercase tracking-widest">Select PDF Resume</div>
                                        <div className="text-[10px] text-muted-foreground">(Max 5MB)</div>
                                    </div>
                                )}
                            </label>
                            {resumeLink && !uploading && (
                                <button
                                    onClick={() => setResumeLink('')}
                                    className="absolute -top-2 -right-2 p-1 bg-background border border-border rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Horizontal Nav */}
                <div className="flex border-b overflow-x-auto">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === item.id
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/10">

                    {/* EDUCATION TAB */}
                    {activeTab === 'education' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {education.map((edu) => (
                                <Card key={edu.id} className="border-border shadow-sm relative group">
                                    <Button
                                        variant="ghost" size="icon"
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeItem(setEducation, edu.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Institution *</label>
                                                <Input value={edu.institution} onChange={e => updateItem(setEducation, edu.id, 'institution', e.target.value)} placeholder="University Name" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Degree *</label>
                                                <Input value={edu.degree} onChange={e => updateItem(setEducation, edu.id, 'degree', e.target.value)} placeholder="B.Tech, B.Sc, etc." className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Field of Study</label>
                                                <Input value={edu.fieldOfStudy || ''} onChange={e => updateItem(setEducation, edu.id, 'fieldOfStudy', e.target.value)} placeholder="Computer Science" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Grade/CGPA</label>
                                                <Input value={edu.grade || ''} onChange={e => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) updateItem(setEducation, edu.id, 'grade', v); }} placeholder="e.g. 8.5" inputMode="decimal" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Start Year</label>
                                                <Input type="number" min={1900} max={2099} value={edu.startDate || ''} onChange={e => updateItem(setEducation, edu.id, 'startDate', e.target.value)} placeholder="2020" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">End Year / Expected</label>
                                                <Input type="number" min={1900} max={2099} value={edu.endDate || ''} onChange={e => updateItem(setEducation, edu.id, 'endDate', e.target.value)} placeholder="2024" className="h-8 text-sm" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full border-dashed border-2 bg-transparent hover:bg-muted/50 text-muted-foreground" onClick={() => addItem(setEducation, { institution: '', degree: '' })}>
                                <Plus className="h-4 w-4 mr-2" /> Add Education
                            </Button>
                        </div>
                    )}

                    {/* EXPERIENCE TAB */}
                    {activeTab === 'experience' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {experience.map((exp) => (
                                <Card key={exp.id} className="border-border shadow-sm relative group">
                                    <Button
                                        variant="ghost" size="icon"
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeItem(setExperience, exp.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Job Title / Role *</label>
                                                <Input value={exp.title} onChange={e => updateItem(setExperience, exp.id, 'title', e.target.value)} placeholder="Software Intern" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name *</label>
                                                <Input value={exp.company} onChange={e => updateItem(setExperience, exp.id, 'company', e.target.value)} placeholder="Tech Corp" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Location</label>
                                                <Input value={exp.location || ''} onChange={e => updateItem(setExperience, exp.id, 'location', e.target.value)} placeholder="Remote / City" className="h-8 text-sm" />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-6">
                                                <input type="checkbox" checked={exp.current} onChange={e => updateItem(setExperience, exp.id, 'current', e.target.checked)} className="rounded text-primary focus:ring-primary" />
                                                <label className="text-xs font-semibold text-foreground">I currently work here</label>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Start Date</label>
                                                <Input type="month" value={exp.startDate || ''} onChange={e => updateItem(setExperience, exp.id, 'startDate', e.target.value)} className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">End Date</label>
                                                <Input type="month" value={exp.endDate || ''} disabled={exp.current} onChange={e => updateItem(setExperience, exp.id, 'endDate', e.target.value)} className="h-8 text-sm disabled:opacity-50" />
                                            </div>
                                            <div className="col-span-1 md:col-span-2 space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                                                <Textarea value={exp.description || ''} onChange={e => updateItem(setExperience, exp.id, 'description', e.target.value)} placeholder="Describe your responsibilities and achievements..." className="min-h-[80px] text-sm resize-none" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full border-dashed border-2 bg-transparent hover:bg-muted/50 text-muted-foreground" onClick={() => addItem(setExperience, { title: '', company: '', current: false })}>
                                <Plus className="h-4 w-4 mr-2" /> Add Experience
                            </Button>
                        </div>
                    )}

                    {/* PROJECTS TAB */}
                    {activeTab === 'projects' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {projects.map((proj) => (
                                <Card key={proj.id} className="border-border shadow-sm relative group">
                                    <Button
                                        variant="ghost" size="icon"
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeItem(setProjects, proj.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="col-span-1 md:col-span-2 space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Project Title *</label>
                                                <Input value={proj.title} onChange={e => updateItem(setProjects, proj.id, 'title', e.target.value)} placeholder="E-commerce Fullstack App" className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Project Link (Github/Live)</label>
                                                <Input type="url" value={proj.link || ''} onChange={e => updateItem(setProjects, proj.id, 'link', e.target.value)} placeholder="https://github.com/..." className="h-8 text-sm" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Technologies (comma separated)</label>
                                                <Input
                                                    value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                                                    onChange={e => updateItem(setProjects, proj.id, 'technologies', e.target.value)}
                                                    placeholder="React, Node.js, MongoDB"
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="col-span-1 md:col-span-2 space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                                                <Textarea value={proj.description || ''} onChange={e => updateItem(setProjects, proj.id, 'description', e.target.value)} placeholder="What did you build? What problem does it solve?" className="min-h-[80px] text-sm resize-none" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full border-dashed border-2 bg-transparent hover:bg-muted/50 text-muted-foreground" onClick={() => addItem(setProjects, { title: '' })}>
                                <Plus className="h-4 w-4 mr-2" /> Add Project
                            </Button>
                        </div>
                    )}

                    {/* SKILLS & SOCIALS TAB */}
                    {activeTab === 'skills' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Card className="border-border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold text-foreground">Technical Skills</CardTitle>
                                    <CardDescription className="text-xs">Enter your skills separated by commas</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={skills}
                                        onChange={e => setSkills(e.target.value)}
                                        placeholder="JavaScript, Python, React, SQL, Git, AWS..."
                                        className="min-h-[100px] text-sm resize-none"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-bold text-foreground">Social Links</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">LinkedIn Profile URL</label>
                                        <Input type="url" value={socials.linkedin || ''} onChange={e => setSocials({ ...socials, linkedin: e.target.value })} placeholder="https://linkedin.com/in/username" className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">GitHub Profile URL</label>
                                        <Input type="url" value={socials.github || ''} onChange={e => setSocials({ ...socials, github: e.target.value })} placeholder="https://github.com/username" className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Personal Portfolio URL</label>
                                        <Input type="url" value={socials.portfolio || ''} onChange={e => setSocials({ ...socials, portfolio: e.target.value })} placeholder="https://yourwebsite.com" className="h-8 text-sm" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                </div>
            </div>

            {/* RIGHT SIDE: LIVE PREVIEW (Full width on print) */}
            <div className="w-full lg:w-[55%] h-full flex flex-col bg-muted/30 rounded-xl overflow-hidden print:w-full print:bg-white print:overflow-visible border border-border">
                <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm z-10 print:hidden">
                    <h2 className="text-xl font-bold text-foreground">Live Preview</h2>
                    <Button onClick={printResume} variant="secondary" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <DownloadIcon className="h-4 w-4" /> Export PDF
                    </Button>
                </div>

                {/* A4 Paper Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible bg-[#525659] print:bg-white">
                    <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] h-fit p-[20mm] print:shadow-none print:w-full print:max-w-none print:min-h-0 print:p-0 text-gray-800 shrink-0">

                        {/* Header: Name & Contact */}
                        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">{profile?.name || 'Your Name'}</h1>
                            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 font-medium">
                                <span>{profile?.email || 'email@example.com'}</span>
                                {profile?.phone && (
                                    <><span>•</span><span>{profile.phone}</span></>
                                )}
                                {socials.linkedin && (
                                    <><span>•</span><a href={socials.linkedin} className="text-blue-600 hover:underline">LinkedIn</a></>
                                )}
                                {socials.github && (
                                    <><span>•</span><a href={socials.github} className="text-blue-600 hover:underline">GitHub</a></>
                                )}
                                {socials.portfolio && (
                                    <><span>•</span><a href={socials.portfolio} className="text-blue-600 hover:underline">Portfolio</a></>
                                )}
                            </div>
                        </div>

                        {/* Education */}
                        {education.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3">Education</h2>
                                <div className="space-y-3">
                                    {education.map((edu, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-800">{edu.institution || 'University Name'}</h3>
                                                <p className="text-sm text-gray-700 italic">
                                                    {edu.degree || 'Degree'}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                                                    {edu.grade ? `, CGPA/Grade: ${edu.grade}` : ''}
                                                </p>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-600 text-right whitespace-nowrap">
                                                {edu.startDate ? `${edu.startDate} - ` : ''}{edu.endDate || 'Present'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience */}
                        {experience.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3">Experience</h2>
                                <div className="space-y-4">
                                    {experience.map((exp, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{exp.title || 'Job Title'}</h3>
                                                    <p className="text-sm font-semibold text-gray-700">{exp.company || 'Company Name'}{exp.location ? ` | ${exp.location}` : ''}</p>
                                                </div>
                                                <div className="text-sm font-semibold text-gray-600 text-right whitespace-nowrap">
                                                    {exp.startDate ? `${exp.startDate} - ` : ''}{exp.current ? 'Present' : (exp.endDate || '')}
                                                </div>
                                            </div>
                                            {exp.description && (
                                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line leading-relaxed">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {projects.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3">Projects</h2>
                                <div className="space-y-4">
                                    {projects.map((proj, idx) => {
                                        const techArray = Array.isArray(proj.technologies)
                                            ? proj.technologies
                                            : typeof proj.technologies === 'string'
                                                ? proj.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
                                                : [];

                                        return (
                                            <div key={idx}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                        {proj.title || 'Project Title'}
                                                        {proj.link && <a href={proj.link} className="text-xs text-blue-600 font-normal hover:underline">(Link)</a>}
                                                    </h3>
                                                </div>
                                                {techArray.length > 0 && (
                                                    <p className="text-xs font-semibold text-gray-600 mb-1">Tech Stack: {techArray.join(', ')}</p>
                                                )}
                                                {proj.description && (
                                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line leading-relaxed">{proj.description}</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {skills && skills.trim().length > 0 && (
                            <div className="mb-6 pb-6">
                                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3">Technical Skills</h2>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                    {skills}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Global Print Styles to handle layout correctly */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    header, nav, aside, .print\\:hidden { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; height: auto !important; overflow: visible !important; }
                }
            `}} />
        </div>
    );
}

// aria-label placeholder
