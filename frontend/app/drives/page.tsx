"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CalendarDays, Building2, MapPin, Users, Plus, GraduationCap, Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface PlacementDrive {
    _id: string;
    companyId: string;
    companyName: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    venue?: string;
    driveType: string;
    eligibleDepartments: string[];
    minCgpa: number;
    status: string;
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
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

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

    const filteredDrives = useMemo(() => {
        return drives.filter((drive: PlacementDrive) =>
            drive.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            drive.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (drive.venue && drive.venue.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [drives, searchQuery]);

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
                    <Link href="/drives/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Create New Drive
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by title, company, or venue..." 
                    className="pl-10 h-10 bg-card/50 border-border hover:border-primary/50 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center p-12 text-muted-foreground">Loading drives...</div>
            ) : filteredDrives.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-2xl animate-in zoom-in-95 duration-500">
                    <CalendarDays className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground">No drives found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrives.map((drive: PlacementDrive) => (
                        <Card key={drive._id} className="hover:border-primary/50 transition-colors flex flex-col group">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{drive.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 text-primary/80 font-medium">
                                            <Building2 className="w-3 h-3" /> {drive.companyName || 'Unknown Company'}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right text-sm font-medium text-muted-foreground">
                                        <div className="flex items-center gap-1 justify-end"><CalendarDays className="w-3 h-3" /> {safeFormatDate(drive.date)}</div>
                                        <div className="flex items-center gap-1 justify-end mt-1"><MapPin className="w-3 h-3" /> {drive.venue || 'TBA'}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                                <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">{drive.description}</p>

                                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-primary/5 p-3 rounded-lg border border-primary/20">
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                        <GraduationCap className="h-3 w-3" /> CGPA: {drive.minCgpa || 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                       <Users className="h-3 w-3" /> {drive.eligibleDepartments?.length || 'All'} Depts
                                   </span>
                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 capitalize">
                                        <Building2 className="h-3 w-3" /> Mode: {drive.driveType?.replace('_', ' ').toLowerCase() || 'On Campus'}
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

