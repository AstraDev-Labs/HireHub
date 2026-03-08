"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../../components/ui/dialog";
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit, Trash, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyRoundsPage() {
    const { id } = useParams();
    const router = useRouter(); // Initialize router
    const { user } = useAuth();
    const [rounds, setRounds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create/Edit Round State
    const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
    const [editingRound, setEditingRound] = useState<any>(null);
    const [roundForm, setRoundForm] = useState({ roundName: '', roundType: '', description: '', roundOrder: 1 });

    // Announcement State
    const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
    const [announceForm, setAnnounceForm] = useState({ subject: '', message: '' });
    const [announceSending, setAnnounceSending] = useState(false);

    const fetchRounds = async () => {
        try {
            // If user is COMPANY, use /my/rounds from backend (defined in routes)
            // Or use /companies/[id]/rounds if we have that route? 
            // routes.js has: router.get('/my/rounds', ... companyController.getRounds);
            // It does NOT seem to have a generic public Get Rounds route in the snippet I saw?
            // Wait, let's check companyRoutes.js again.
            // It has `router.get('/my/rounds', ...)`
            // It does NOT have a public route for rounds.

            // If we are ADMIN or viewing as student, we might need a different endpoint.
            // But this page is likely for Company Staff to MANAGE rounds.

            let endpoint = '';
            if (user?.role === 'COMPANY') {
                endpoint = '/companies/my/rounds';
            } else {
                endpoint = `/companies/${id}/rounds`;
            }

            const { data } = await api.get(endpoint);
            setRounds(data.data.rounds || []);
        } catch (err) {
            console.error(err);
            // toast.error("Failed to load rounds");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        if (user.role === 'COMPANY') {
            if (id && user.companyId !== id) {
                toast.error("Unauthorized access to another company's rounds.");
                router.push('/dashboard');
                return;
            }
            fetchRounds();
        } else if (user.role === 'ADMIN' || user.role === 'STAFF') {
            fetchRounds();
        }
    }, [user, id, router]);

    const handleSaveRound = async () => {
        try {
            if (editingRound) {
                await api.patch(`/companies/rounds/${editingRound._id}`, roundForm);
                toast.success("Round updated");
            } else {
                // For Admin/Staff, we must explicitly provide the companyId for the company we are managing
                const payload: any = { ...roundForm };
                if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
                    payload.companyId = id as string;
                }
                await api.post('/companies/rounds', payload);
                toast.success("Round created");
            }
            setIsRoundModalOpen(false);
            setEditingRound(null);
            setRoundForm({ roundName: '', roundType: '', description: '', roundOrder: 1 });
            fetchRounds();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save round");
        }
    };

    const handleDeleteRound = async (roundId: string) => {
        if (!confirm("Delete this round?")) return;
        try {
            await api.delete(`/companies/rounds/${roundId}`);
            toast.success("Round deleted");
            fetchRounds();
        } catch (err) {
            toast.error("Failed to delete round");
        }
    };

    const handleSendAnnouncement = async () => {
        if (announceSending) return;
        setAnnounceSending(true);
        try {
            await api.post('/companies/announce', announceForm);
            toast.success("Announcement sent successfully");
            setIsAnnounceModalOpen(false);
            setAnnounceForm({ subject: '', message: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to send announcement");
        } finally {
            setAnnounceSending(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    const isAuthorized = user?.role === 'COMPANY' || user?.role === 'ADMIN' || user?.role === 'STAFF';
    if (!isAuthorized) return <div className="p-8">Access Denied: Only authorized staff can manage rounds here.</div>;

    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Manage Selection Process</h1>
                <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsAnnounceModalOpen(true)}>
                        <Send className="mr-2 h-4 w-4" /> Send Announcement
                    </Button>
                    <Button onClick={() => { setEditingRound(null); setRoundForm({ roundName: '', roundType: '', description: '', roundOrder: rounds.length + 1 }); setIsRoundModalOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Round
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {rounds.map((round) => (
                    <Card key={round._id}>
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardTitle>{round.roundType || round.roundName}</CardTitle>
                                <div className="space-x-2">
                                    <Button size="icon" variant="ghost" onClick={() => {
                                        setEditingRound(round);
                                        setRoundForm({
                                            roundName: round.roundName || '',
                                            roundType: round.roundType || '',
                                            description: round.description || '',
                                            roundOrder: round.roundOrder || 1
                                        });
                                        setIsRoundModalOpen(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" onClick={() => handleDeleteRound(round._id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            {/* <CardDescription>{new Date(round.roundDate).toLocaleDateString()}</CardDescription> */}
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">{round.description}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-500">Round #{round.roundOrder}</span>
                                <Button variant="secondary" onClick={() => router.push(`/companies/${id}/rounds/${round._id}`)}>
                                    View Candidates
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {rounds.length === 0 && <p className="text-gray-500 text-center">No rounds defined. Add rounds to define your selection process.</p>}
            </div>

            {/* Create/Edit Round Dialog */}
            <Dialog open={isRoundModalOpen} onOpenChange={setIsRoundModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRound ? 'Edit Round' : 'Add Selection Round'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Round Number</label>
                                <Input type="number" min="1" placeholder="1" value={roundForm.roundOrder} onChange={(e) => setRoundForm({ ...roundForm, roundOrder: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Round Type</label>
                                <Input placeholder="Round Type (e.g. Technical, HR)" value={roundForm.roundType} onChange={(e) => setRoundForm({ ...roundForm, roundType: e.target.value, roundName: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea placeholder="Description (e.g. Topics covered, duration)" value={roundForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRoundForm({ ...roundForm, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveRound}>Save Round</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Announcement Dialog */}
            <Dialog open={isAnnounceModalOpen} onOpenChange={setIsAnnounceModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Announcement</DialogTitle>
                        <DialogDescription>Send a message to all students applied to your company.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input placeholder="Subject" value={announceForm.subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnounceForm({ ...announceForm, subject: e.target.value })} />
                        <Textarea placeholder="Message" value={announceForm.message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnnounceForm({ ...announceForm, message: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSendAnnouncement} disabled={announceSending}>
                            {announceSending ? 'Sending...' : 'Send Message'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
