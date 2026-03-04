"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, X, Trophy } from 'lucide-react';

export default function RoundEvaluationPage() {
    const { id, roundId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [round, setRound] = useState<any>(null);
    const [rounds, setRounds] = useState<any[]>([]); // All rounds to select next round
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

    // Action State
    const [action, setAction] = useState<'PROMOTE' | 'REJECT' | 'OFFER' | null>(null);
    const [nextRoundId, setNextRoundId] = useState<string>('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Derived state for display
    const displayedStudents = showHistory
        ? students
        : students.filter(s => s.placementStatus === 'PENDING');

    useEffect(() => {
        if (user?.role === 'COMPANY') {
            if (id && user.companyId !== id) {
                toast.error("Unauthorized");
                router.push('/dashboard');
                return;
            }
            fetchData();
        }
    }, [user, id, roundId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch All Rounds (to find current and next)
            const roundsRes = await api.get('/companies/my/rounds');
            const allRounds = roundsRes.data.data.rounds;
            setRounds(allRounds);

            const currentRound = allRounds.find((r: any) => r._id === roundId);
            setRound(currentRound);

            // Fetch Students for this round
            const studentsRes = await api.get(`/companies/rounds/${roundId}/students`);
            setStudents(studentsRes.data.data.students);
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Select all currently displayed students
            setSelectedStudents(displayedStudents.map(s => s._id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (studentId: string, checked: boolean) => {
        if (checked) {
            setSelectedStudents(prev => [...prev, studentId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        }
    };

    const initiateAction = (act: 'PROMOTE' | 'REJECT' | 'OFFER') => {
        if (selectedStudents.length === 0) {
            toast.error("Select at least one student");
            return;
        }
        setAction(act);
        setIsConfirmOpen(true);
    };

    const confirmAction = async () => {
        if (action === 'PROMOTE' && !nextRoundId) {
            toast.error("Please select the next round");
            return;
        }

        setProcessing(true);
        try {
            await api.post('/companies/rounds/evaluate', {
                studentIds: selectedStudents,
                roundId,
                action,
                nextRoundId: action === 'PROMOTE' ? nextRoundId : undefined
            });

            toast.success(`Successfully processed ${selectedStudents.length} students`);
            setIsConfirmOpen(false);
            setSelectedStudents([]);
            fetchData(); // Refresh list
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Action failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!round) return <div>Round not found</div>;

    // Filter potential next rounds (must have order > current round)
    const nextRounds = rounds.filter(r => r.roundOrder > round.roundOrder);

    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{round.roundType} (Round {round.roundOrder})</h1>
                    <p className="text-muted-foreground text-sm">Evaluation & Selection</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CardTitle>Candidates ({displayedStudents.length})</CardTitle>
                            <div className="flex items-center space-x-2 ml-4">
                                <Checkbox
                                    id="showHistory"
                                    checked={showHistory}
                                    onCheckedChange={(c) => setShowHistory(c as boolean)}
                                />
                                <label htmlFor="showHistory" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Show Processed
                                </label>
                            </div>
                        </div>

                        <div className="space-x-2">
                            <Button variant="destructive" onClick={() => initiateAction('REJECT')} disabled={selectedStudents.length === 0}>
                                <X className="h-4 w-4 mr-2" /> Reject
                            </Button>
                            {nextRounds.length > 0 && (
                                <Button variant="default" onClick={() => initiateAction('PROMOTE')} disabled={selectedStudents.length === 0}>
                                    <Check className="h-4 w-4 mr-2" /> Promote
                                </Button>
                            )}
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => initiateAction('OFFER')} disabled={selectedStudents.length === 0}>
                                <Trophy className="h-4 w-4 mr-2" /> Offer
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={displayedStudents.length > 0 && selectedStudents.length === displayedStudents.length}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                    />
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>CGPA</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        {showHistory ? "No students found in this round." : "No pending students. Check 'Show Processed' to see history."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayedStudents.map(student => (
                                    <TableRow key={student._id} className={['CLEARED', 'REJECTED', 'PLACED'].includes(student.placementStatus) ? "opacity-50 bg-gray-50 dark:bg-gray-800" : ""}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedStudents.includes(student._id)}
                                                onCheckedChange={(checked) => handleSelectStudent(student._id, checked as boolean)}
                                                disabled={['CLEARED', 'REJECTED', 'PLACED'].includes(student.placementStatus)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{student.fullName}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>{student.department}</TableCell>
                                        <TableCell>{student.cgpa}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                student.placementStatus === 'CLEARED' ? 'default' :
                                                    student.placementStatus === 'REJECTED' ? 'destructive' :
                                                        student.placementStatus === 'PLACED' ? 'secondary' : 'outline'
                                            }>
                                                {student.placementStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm {action === 'PROMOTE' ? 'Promotion' : action === 'REJECT' ? 'Rejection' : 'Job Offer'}</DialogTitle>
                        <DialogDescription>
                            You are about to {action === 'PROMOTE' ? 'promote' : action === 'REJECT' ? 'reject' : 'offer placement to'} {selectedStudents.length} students.
                            This action will send email notifications.
                        </DialogDescription>
                    </DialogHeader>

                    {action === 'PROMOTE' && (
                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Select Next Round</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={nextRoundId}
                                onChange={(e) => setNextRoundId(e.target.value)}
                            >
                                <option value="" disabled>Select Round</option>
                                {nextRounds.map(r => (
                                    <option key={r._id} value={r._id}>{r.roundType} (Round {r.roundOrder})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={confirmAction} disabled={processing}>
                            {processing ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
