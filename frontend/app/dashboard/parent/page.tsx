"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function ParentDashboard() {
    const { user } = useAuth();
    const [linkedStudent, setLinkedStudent] = useState<any>(null);
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Get linked student profile
            // We need a new endpoint or update 'my/profile' to return linked student info
            // For now, let's assume we can fetch it via the linkedStudentId if present in user, 
            // BUT user object might be stale. Let's fetch /auth/me or similar if exists, or just query student by ID.

            // If user has linkedStudentId, we can directly fetch student details
            if (!user?.linkedStudentId && !user?.studentName) {
                // Try fetching updated user profile? Or assume if it's not there, it's not there.
            }

            // Better Approach: Endpoint for parent dashboard data
            // api.get('/dashboard/parent') would be ideal.
            // Let's implement that in dashboardController/routes later.
            // For now, let's try to fetch student by ID if we can get it.

            if (user?.linkedStudentId) {
                const studentRes = await api.get(`/students/${user.linkedStudentId}`);
                setLinkedStudent(studentRes.data.data.student);

                const placementRes = await api.get(`/students/${user.linkedStudentId}/placements`);
                // We don't have this specific route directly exposed cleanly yet for "my placements" but logic exists
                // Let's use the placement status endpoint
                const statusRes = await api.get(`/placement/student/${user.linkedStudentId}`);
                setPlacements(statusRes.data.data.statuses);
            }

        } catch (error) {
            console.error(error);
            // toast.error("Failed to load student data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading Dashboard...</div>;

    return (
        <div className="container mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Parent Dashboard</h1>
                <p className="text-muted-foreground font-medium">Monitor your linked child's placement journey.</p>
            </div>

            {/* Student Profile Card */}
            <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xl font-bold">Student Profile</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">Details of your linked child</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {linkedStudent ? (
                        <div className="space-y-2">
                            <p><strong>Name:</strong> {linkedStudent.name}</p>
                            <p><strong>Department:</strong> {linkedStudent.department}</p>
                            <p><strong>Batch:</strong> {linkedStudent.batchYear}</p>
                            <p><strong>Status:</strong> <Badge>{linkedStudent.placementStatus}</Badge></p>
                            <p><strong>CGPA:</strong> {linkedStudent.cgpa}</p>
                        </div>
                    ) : (
                        <div className="text-yellow-600">
                            No student linked yet. Please contact admin to link your account to your child.
                            <br />
                            (Registered Child Name: {user?.studentName || 'N/A'})
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Placement Updates */}
            {linkedStudent && (
                <Card className="border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-xl font-bold">Placement Updates</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Recent interview rounds and results</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {placements.length > 0 ? (
                            <div className="divide-y divide-border/50">
                                {placements.map((p: any) => (
                                    <div key={p._id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">{p.companyId?.name || 'Unknown Company'}</h4>
                                            <p className="text-sm text-muted-foreground font-medium">{p.roundId?.roundName || 'Round Update'}</p>
                                        </div>
                                        <Badge variant={
                                            p.status === 'CLEARED' || p.status === 'OFFERED' ? 'default' :
                                                p.status === 'REJECTED' ? 'destructive' : 'secondary'
                                        } className="font-bold tracking-wider px-3">
                                            {p.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground font-medium text-center py-12">No placement activities recorded yet.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// aria-label placeholder
