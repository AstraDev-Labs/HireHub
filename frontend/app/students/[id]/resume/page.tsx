"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { ArrowLeft, DownloadIcon, FileText, User } from 'lucide-react';

interface Education {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    grade?: string;
    startDate?: string;
    endDate?: string;
}

interface Experience {
    title: string;
    company: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
    description?: string;
}

interface Project {
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
    resumeLink?: string;
    education?: Education[];
    experience?: Experience[];
    projects?: Project[];
    skills?: string[];
    socialLinks?: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
    };
}

export default function StudentResumePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchStudentProfile();
    }, [user, params.id]);

    const fetchStudentProfile = async () => {
        try {
            const { data } = await api.get(`/students/${params.id}`);
            const student = data.data.student;

            // Format the skills array if it exists as string logic inside
            setProfile(student);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to load student resume");
        } finally {
            setLoading(false);
        }
    };

    const printResume = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Resume...</div>;

    if (!profile) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-muted-foreground min-h-[50vh] animate-in fade-in duration-500">
                <User className="h-16 w-16 text-muted mb-4" />
                <h2 className="text-xl font-bold text-foreground">Student Not Found</h2>
                <p className="mb-6">We couldn't find the requested student profile.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const {
        education = [],
        experience = [],
        projects = [],
        skills = [],
        socialLinks = { github: '', linkedin: '', portfolio: '' },
        resumeLink
    } = profile;

    // A student hasn't touched the Resume Builder if all these are empty, AND they have no uploaded resumeLink
    const hasResumeData = education.length > 0 || experience.length > 0 || projects.length > 0 || skills.length > 0;
    const hasAnyResume = hasResumeData || !!resumeLink;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12 print:max-w-none print:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Action Bar (Hidden on print) */}
            <div className="flex items-center justify-between print:hidden bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            {profile.name}
                        </h2>
                    </div>
                </div>
                {hasResumeData && (
                    <Button onClick={printResume} variant="secondary" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <DownloadIcon className="h-4 w-4" /> Export PDF
                    </Button>
                )}
            </div>

            {!hasAnyResume ? (
                <Card className="border-dashed border-2 bg-muted/20 print:hidden mt-8">
                    <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                        <FileText className="h-16 w-16 text-muted mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No Resume Data</h3>
                        <p className="text-muted-foreground max-w-md mb-4">
                            This student has not built their resume yet using the Resume Builder tool, and no PDF resume was uploaded.
                        </p>
                    </CardContent>
                </Card>
            ) : !hasResumeData && resumeLink ? (
                <Card className="mt-8 border print:border-none shadow-sm h-[800px] overflow-hidden">
                    <iframe src={resumeLink} className="w-full h-full border-0 print:block" title="Student Resume" />
                </Card>
            ) : (
                <div className="w-full h-full flex flex-col rounded-xl overflow-hidden print:overflow-visible">
                    {/* A4 Paper Container */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible bg-muted/30 print:bg-white rounded-xl shadow-inner print:shadow-none border border-border">
                        <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] h-fit p-[20mm] print:shadow-none print:w-full print:max-w-none print:min-h-0 print:p-0 text-gray-800 shrink-0">

                            {/* Header: Name & Contact */}
                            <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">{profile.name}</h1>
                                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600 font-medium">
                                    <span>{profile.email}</span>
                                    {profile.phone && (
                                        <><span>•</span><span>{profile.phone}</span></>
                                    )}
                                    {socialLinks.linkedin && (
                                        <><span>•</span><a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a></>
                                    )}
                                    {socialLinks.github && (
                                        <><span>•</span><a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a></>
                                    )}
                                    {socialLinks.portfolio && (
                                        <><span>•</span><a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Portfolio</a></>
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
                                                            {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-normal hover:underline">(Link)</a>}
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
                            {skills && skills.length > 0 && (
                                <div className="mb-6 pb-6">
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3">Technical Skills</h2>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                        {skills.join(', ')}
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>
                    {/* Fallback link to uploaded resume if also available and generated data is present */}
                    {resumeLink && (
                        <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border print:hidden text-center">
                            <p className="text-muted-foreground mb-3">This student also has an uploaded PDF resume.</p>
                            <a href={resumeLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                <FileText className="h-4 w-4 mr-2" /> View Original Uploaded PDF
                            </a>
                        </div>
                    )}
                </div>
            )}

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
