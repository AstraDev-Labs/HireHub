"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, Building2, MapPin, Users, Plus, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface PlacementDrive {
    _id: string;
    company: { name: string; logo?: string };
    title: string;
    description: string;
    date: string;
    location: string;
    eligibilityCriteria: { minCGPA: number; allowedBranches: string[] };
}

const safeFormatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBA';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Date TBA';
    try {
        return format(d, 'MMM dd, yyyy');
    } catch {
        return 'Date TBA';
    }
};

export default function DrivesPage() {
    const { user } = useAuth();
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrives = async () => {
            try {
                const { data } = await api.get('/drives');
                // Backend returns data.data.drives, not placementDrives
                setDrives(data.data.drives || data.data.placementDrives || []);
            } catch (err) { } finally {
                setLoading(false);
            }
        };
        fetchDrives();
    }, []);

    if (!user) return null;
    const canCreate = user.role === 'ADMIN' || user.role === 'STAFF' || user.role === 'COMPANY';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Placement Drives</h1>
                    <p className="text-muted-foreground mt-2">Discover and register for upcoming recruitment events.</p>
                </div>
                {canCreate && (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Create New Drive
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center p-12 text-muted-foreground">Loading drives...</div>
            ) : drives.length === 0 ? (
                <Card className="bg-muted/30 border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Active Drives</h3>
                        <p className="text-muted-foreground">There are currently no placement drives scheduled.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {drives.map(drive => (
                        <Card key={drive._id} className="hover:border-primary/50 transition-colors flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{drive.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1 text-primary font-medium">
                                            <Building2 className="w-3 h-3" /> {drive.company?.name || 'Unknown Company'}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right text-sm font-medium text-muted-foreground">
                                        <div className="flex items-center gap-1 justify-end"><CalendarDays className="w-3 h-3" /> {safeFormatDate(drive.date)}</div>
                                        <div className="flex items-center gap-1 justify-end mt-1"><MapPin className="w-3 h-3" /> {drive.location || 'TBA'}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                                <p className="text-sm line-clamp-3 text-muted-foreground">{drive.description}</p>

                                <div className="flex items-center gap-4 text-xs font-semibold bg-primary/5 p-3 rounded-lg border border-primary/20">
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                        <GraduationCap className="h-3 w-3" /> Min CGPA: {drive.eligibilityCriteria?.minCGPA || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                        <Users className="h-3 w-3" /> {drive.eligibilityCriteria?.allowedBranches?.length || 'All'} Branches
                                    </span>
                                </div>

                                <Link href={`/drives/${drive._id}`}>
                                    <Button className="w-full mt-auto" variant="outline">View Details</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

