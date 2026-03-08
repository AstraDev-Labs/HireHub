"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Trash2, Loader2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Offer {
    _id: string;
    studentId: string;
    companyId: string;
    studentName: string;
    companyName: string;
    role: string;
    packageLpa: number;
    joiningDate: string;
    offerDate: string;
    status: string;
    remarks: string;
    attachmentUrl?: string;
}

const statusColors: Record<string, string> = {
    ISSUED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ACCEPTED: 'bg-green-500/10 text-green-500 border-green-500/20',
    DECLINED: 'bg-red-500/10 text-red-500 border-red-500/20',
    REVOKED: 'bg-muted text-muted-foreground border-border',
};

export default function OffersPage() {
    const { user } = useAuth();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [form, setForm] = useState({ studentId: '', companyId: '', role: '', packageLpa: 0, joiningDate: '', offerDate: '', remarks: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenCreate = () => {
        setForm({
            studentId: '',
            companyId: user?.role === 'COMPANY' ? (user.companyId || '') : '',
            role: '',
            packageLpa: user?.role === 'COMPANY' ? (companies.find(c => c._id === user.companyId)?.packageLpa || 0) : 0,
            joiningDate: '',
            offerDate: '',
            remarks: ''
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setStudentSearch('');
        setShowCreate(true);
    };

    const isAdmin = user && ['ADMIN', 'STAFF'].includes(user.role);
    const isCompany = user?.role === 'COMPANY';

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(studentSearch.toLowerCase()))
    );

    useEffect(() => {
        if (!user) return;
        fetchOffers();
        if (isAdmin || isCompany) fetchStudentsAndCompanies();
    }, [user]);

    const fetchOffers = async () => {
        try {
            const { data } = await api.get('/offers');
            setOffers(data.data.offers);
        } catch { toast.error("Failed to load offers"); }
        finally { setLoading(false); }
    };

    const fetchStudentsAndCompanies = async () => {
        try {
            const [sRes, cRes] = await Promise.all([
                api.get('/students'),
                api.get(isCompany ? `/companies/${user?.companyId}` : '/companies')
            ]);
            setStudents(sRes.data.data.students || []);

            // Handle both array (/companies) and single object (/companies/:id) responses
            const compData = cRes.data.data.companies || (cRes.data.data.company ? [cRes.data.data.company] : []);
            setCompanies(compData);
        } catch (e) { console.error("Failed to load select data", e); }
    };

    const handleCreate = async () => {
        if (!form.studentId || !form.companyId) { toast.error("Student and Company are required"); return; }

        let fileUrl = '';
        if (selectedFile) {
            setUploading(true);
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);
                const { data } = await api.post('/upload', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                fileUrl = data.fileUrl;
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to upload attachment');
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        setSubmitting(true);
        try {
            await api.post('/offers', { ...form, attachmentUrl: fileUrl });
            toast.success("Offer letter issued!");
            setShowCreate(false);
            setForm({ studentId: '', companyId: '', role: '', packageLpa: 0, joiningDate: '', offerDate: '', remarks: '' });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchOffers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to issue offer");
        } finally { setSubmitting(false); }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/offers/${id}`, { status });
            setOffers(prev => prev.map(o => o._id === id ? { ...o, status } : o));
            toast.success(`Offer ${status.toLowerCase()}`);
        } catch { toast.error("Failed to update"); }
    };

    const deleteOffer = async (id: string) => {
        if (!confirm("Delete this offer letter?")) return;
        try {
            await api.delete(`/offers/${id}`);
            setOffers(prev => prev.filter(o => o._id !== id));
            toast.success("Offer deleted");
        } catch { toast.error("Failed to delete"); }
    };

    const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading offers...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Offer Letters</h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        {user?.role === 'STUDENT' ? 'Your offer letters from companies' : 'Manage offer letters for placed students'}
                    </p>
                </div>
                {(isAdmin || isCompany) && (
                    <Button onClick={handleOpenCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Issue Offer
                    </Button>
                )}
            </div>

            {/* Stats */}
            {offers.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['ISSUED', 'ACCEPTED', 'DECLINED', 'REVOKED'].map(s => (
                        <Card key={s} className="border-0 shadow-sm">
                            <CardContent className="py-4 text-center">
                                <p className="text-2xl font-bold">{offers.filter(o => o.status === s).length}</p>
                                <p className="text-xs text-muted-foreground mt-1">{s}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Offers Table */}
            {offers.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-50" />
                        <p className="font-medium">No offer letters yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Package</TableHead>
                                <TableHead>Offer Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offers.map(offer => (
                                <TableRow key={offer._id}>
                                    <TableCell className="font-medium text-foreground">{offer.studentName}</TableCell>
                                    <TableCell className="text-muted-foreground">{offer.companyName}</TableCell>
                                    <TableCell className="text-foreground">{offer.role || '-'}</TableCell>
                                    <TableCell className="text-foreground">{offer.packageLpa ? `${offer.packageLpa} LPA` : '-'}</TableCell>
                                    <TableCell className="text-muted-foreground">{offer.offerDate || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("px-2 py-0.5", statusColors[offer.status])}>{offer.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* View Attachment */}
                                            {offer.attachmentUrl && (
                                                <a href={offer.attachmentUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-blue-500 hover:text-blue-600 hover:bg-blue-50")}>
                                                    <Paperclip className="h-4 w-4 mr-1" /> View
                                                </a>
                                            )}
                                            {/* Student can accept/decline */}
                                            {user?.role === 'STUDENT' && offer.status === 'ISSUED' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-green-500 hover:text-green-600 hover:bg-green-500/10 text-xs h-7" onClick={() => updateStatus(offer._id, 'ACCEPTED')}>Accept</Button>
                                                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-7" onClick={() => updateStatus(offer._id, 'DECLINED')}>Decline</Button>
                                                </>
                                            )}
                                            {/* Admin can revoke or delete */}
                                            {isAdmin && offer.status === 'ISSUED' && (
                                                <Button size="sm" variant="outline" className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 text-xs h-7" onClick={() => updateStatus(offer._id, 'REVOKED')}>Revoke</Button>
                                            )}
                                            {isAdmin && (
                                                <Button size="sm" variant="ghost" onClick={() => deleteOffer(offer._id)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Issue Offer Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Issue Offer Letter</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Student *</label>
                            <Input
                                placeholder="Search student by name, email, or dept..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="mb-2 h-8 text-sm"
                            />
                            <select className={selectClass} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                                <option value="">Select Student</option>
                                {filteredStudents.map((s: any) => <option key={s._id} value={s._id}>{s.name} ({s.department})</option>)}
                            </select>
                            {filteredStudents.length === 0 && <p className="text-xs text-muted-foreground mt-1">No students found matching "{studentSearch}"</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Company *</label>
                            <select
                                className={selectClass}
                                value={form.companyId}
                                disabled={isCompany}
                                onChange={(e) => {
                                    const comp = companies.find((c: any) => c._id === e.target.value);
                                    setForm({ ...form, companyId: e.target.value, packageLpa: comp?.packageLpa || 0 });
                                }}
                            >
                                <option value="">Select Company</option>
                                {companies
                                    .filter(c => isCompany ? c._id === user.companyId : true)
                                    .map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Role</label>
                                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Package (LPA)</label>
                                <Input type="number" value={form.packageLpa} onChange={(e) => setForm({ ...form, packageLpa: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Offer Date</label>
                                <Input type="date" value={form.offerDate} onChange={(e) => setForm({ ...form, offerDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Joining Date</label>
                                <Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Remarks</label>
                            <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes..." />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Attachment (PDF/Document)</label>
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                ref={fileInputRef}
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={submitting || uploading}>
                            {(submitting || uploading) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Issuing...</> : 'Issue Offer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// aria-label placeholder
