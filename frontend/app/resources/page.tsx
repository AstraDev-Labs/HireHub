"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Link as LinkIcon, Download, Plus, Trash2, Globe, Building2, Upload, X, FileUp, Search } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import toast from 'react-hot-toast';

export default function ResourcesPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [companies, setCompanies] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        driveLink: '',
        companyId: '',
        resourceType: 'Link'
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchResources = async () => {
        try {
            const { data } = await api.get('/resources');
            setResources(data.data.resources);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const { data } = await api.get('/companies');
            setCompanies(data.data.companies);
        } catch (err) {
            console.error("Failed to fetch companies", err);
        }
    };

    useEffect(() => {
        fetchResources();
        if (user?.role && ['ADMIN', 'STAFF'].includes(user.role)) {
            fetchCompanies();
        }
    }, [user]);

    const handleCreateResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let finalDriveLink = formData.driveLink;

            // If it's a file type, upload the file first
            if (['PDF', 'Video'].includes(formData.resourceType)) {
                if (!selectedFile) {
                    toast.error("Please select a file to upload");
                    return;
                }

                setUploading(true);
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);

                try {
                    const { data: uploadRes } = await api.post('/upload', uploadFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    finalDriveLink = uploadRes.data.url;
                } catch (err: any) {
                    toast.error("File upload failed");
                    setUploading(false);
                    return;
                }
            } else if (!finalDriveLink) {
                toast.error("Please provide a resource URL");
                return;
            }

            const payload = {
                ...formData,
                driveLink: finalDriveLink
            };

            if (user?.role === 'COMPANY' && user.companyId) {
                payload.companyId = user.companyId;
            }

            await api.post('/resources', payload);
            toast.success("Resource deployed successfully");
            setIsAddModalOpen(false);
            setFormData({ title: '', description: '', driveLink: '', companyId: '', resourceType: 'Link' });
            setSelectedFile(null);
            fetchResources();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add resource");
        } finally {
            setUploading(false);
        }
    };

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

    const handleDeleteResource = async (id: string) => {
        console.log("🚀 DELETE PROCESS START: ", id);
        
        if (!id) {
            toast.error("Resource ID missing!");
            return;
        }

        setDeletingId(id);
        try {
            console.log("🔌 Calling DELETE /api/resources/" + id);
            await api.delete(`/resources/${id}`);
            toast.success("Resource deleted");
            setConfirmingDeleteId(null);
            fetchResources();
        } catch (err: any) {
            console.error("💥 Delete error:", err);
            toast.error(err.response?.data?.message || "Failed to delete resource");
        } finally {
            setDeletingId(null);
        }
    };

    const canManage = user?.role && ['ADMIN', 'STAFF', 'COMPANY'].includes(user.role);

    const filteredResources = useMemo(() => {
        return resources.filter((resource: any) => 
            resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.companyId?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [resources, searchQuery]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 text-foreground">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight">Preparation Hub</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Placement Success Resources</p>
                </div>

                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-widest px-6 h-12 shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4 stroke-[3]" /> Deploy Resource
                        </Button>

                        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                            <DialogContent className="sm:max-w-[525px] border-2 border-border/50 shadow-2xl">
                                <form onSubmit={handleCreateResource}>
                                    <DialogHeader className="space-y-3 pb-4">
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Preparation Asset</DialogTitle>
                                        <DialogDescription className="font-medium text-muted-foreground">
                                            Upload documents or external links to assist students in placement readiness.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Title</label>
                                            <Input
                                                placeholder="e.g., Data Structures Masterclass"
                                                className="h-12 bg-muted/30 border-border font-medium"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Organization</label>
                                            {user?.role === 'COMPANY' ? (
                                                <Input disabled value={user.fullName || "Your Company"} className="h-12 bg-muted/50 border-border font-bold italic" />
                                            ) : (
                                                <select
                                                    className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={formData.companyId}
                                                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select Company Context</option>
                                                    {companies.map((c: any) => (
                                                        <option key={c._id} value={c._id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Type</label>
                                                <select
                                                    className="flex h-12 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={formData.resourceType}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, resourceType: e.target.value });
                                                        setSelectedFile(null);
                                                    }}
                                                >
                                                    <option value="Link">Drive Link</option>
                                                    <option value="PDF">PDF Document</option>
                                                    <option value="Video">Video Tutorial</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                                    {formData.resourceType === 'Link' ? 'Resource URL' : 'Resource File'}
                                                </label>
                                                {formData.resourceType === 'Link' ? (
                                                    <Input
                                                        placeholder="https://drive.google.com/..."
                                                        type="url"
                                                        className="h-12 bg-muted/30 border-border font-medium"
                                                        value={formData.driveLink}
                                                        onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                                                        required
                                                    />
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            ref={fileInputRef}
                                                            accept={formData.resourceType === 'PDF' ? '.pdf' : 'video/*'}
                                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className={cn(
                                                                "w-full h-12 bg-muted/30 border-dashed border-2 font-medium justify-start px-3",
                                                                selectedFile ? "border-primary/50 text-foreground" : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {selectedFile ? (
                                                                <>
                                                                    <FileUp className="h-4 w-4 mr-2 text-primary" />
                                                                    <span className="truncate">{selectedFile.name}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="h-4 w-4 mr-2" />
                                                                    <span>Choose {formData.resourceType}...</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                        {selectedFile && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedFile(null)}
                                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Resource Description</label>
                                            <Textarea
                                                placeholder="Outline the contents of this resource..."
                                                className="min-h-[100px] bg-muted/30 border-border font-medium resize-none"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="pt-4 border-t border-border/50">
                                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="font-black uppercase text-[10px] tracking-widest" disabled={uploading}>Abort</Button>
                                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg shadow-primary/20" disabled={uploading}>
                                            {uploading ? "Deploying Data..." : "Finalize Upload"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search resources by title or company..." 
                    className="pl-10 h-10 bg-card/50 border-border hover:border-primary/50 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed border-border/50 rounded-3xl animate-in zoom-in-95 duration-700">
                        <Globe className="h-16 w-16 text-muted-foreground/30 mb-4 stroke-[1]" />
                        <h3 className="text-xl font-bold uppercase tracking-tight text-muted-foreground">Digital Archives Empty</h3>
                        <p className="text-sm font-medium text-muted-foreground/60 mt-2">Preparation assets awaiting deployment.</p>
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground mt-12 animate-in fade-in duration-500">
                        <p className="text-lg font-semibold">No results found for your search.</p>
                        <p className="text-sm">Try adjusting your search terms.</p>
                    </div>
                ) : (
                    resources.map((res: any) => (
                        <Card key={res._id} className="group hover:shadow-2xl transition-all duration-500 border-2 border-border/50 bg-card text-card-foreground overflow-hidden rounded-2xl active:scale-[0.98]">
                            <CardHeader className="bg-muted/30 border-b border-border/50 pb-6 relative overflow-hidden">
                                <Building2 className="absolute -right-4 -top-4 h-24 w-24 text-primary/5 stroke-[3] group-hover:scale-110 transition-transform duration-700" />
                                <div className="flex justify-between items-start z-10 relative">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {res.title}
                                        </CardTitle>
                                        <CardDescription className="font-bold text-muted-foreground flex items-center gap-2">
                                            <span className="text-primary/70 font-black">@</span> {res.companyId?.name || "General Resources"}
                                        </CardDescription>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                        <FileText className="h-5 w-5 stroke-[2.5]" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 relative">
                                <p className="text-sm text-foreground/70 font-medium leading-relaxed line-clamp-3 min-h-[4.5rem]">
                                    {res.description || "In-depth preparation material curated for placement readiness. Includes company-specific patterns and insights."}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-4 pb-6 flex items-center gap-3">
                                <Link href={res.driveLink} target="_blank" className="flex-1">
                                    <Button className="w-full bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 font-black uppercase text-[10px] tracking-widest h-11 transition-all shadow-sm">
                                        <LinkIcon className="mr-2 h-4 w-4 stroke-[3]" /> Open Access
                                    </Button>
                                </Link>
                                {canManage && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log("🖱️ TRASH CLICKED. State:", confirmingDeleteId === res._id ? "CONFIRM" : "FIRST_CLICK");
                                            if (confirmingDeleteId === res._id) {
                                                handleDeleteResource(res._id);
                                            } else {
                                                setConfirmingDeleteId(res._id);
                                            }
                                        }}
                                        className={cn(
                                            "h-11 transition-all rounded-xl relative flex items-center justify-center",
                                            confirmingDeleteId === res._id 
                                                ? "border-destructive bg-destructive text-white hover:bg-destructive/90 w-24 px-2 ring-4 ring-destructive/10" 
                                                : "border-destructive/20 text-destructive hover:bg-destructive hover:text-white w-11",
                                            deletingId === res._id && "opacity-50 cursor-not-allowed"
                                        )}
                                        disabled={deletingId !== null}
                                    >
                                        {deletingId === res._id ? (
                                            <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                                        ) : confirmingDeleteId === res._id ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95 duration-200">DELETE?</span>
                                        ) : (
                                            <Trash2 className="h-4 w-4 stroke-[2.5]" />
                                        )}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

// aria-label placeholder
