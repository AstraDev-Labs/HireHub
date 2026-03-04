"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
    const { user } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterBatch, setFilterBatch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCgpaMin, setFilterCgpaMin] = useState('');
    const [filterCgpaMax, setFilterCgpaMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (user && user.role === 'STUDENT') {
            router.push('/dashboard');
            return;
        }

        const fetchStudents = async () => {
            try {
                const { data } = await api.get('/students');
                setStudents(data.data.students);
                // Extract unique departments
                const depts = [...new Set(data.data.students.map((s: any) => s.department).filter(Boolean))];
                setDepartments(depts as string[]);
            } catch (err: any) {
                console.error(err);
                toast.error(err.response?.data?.message || "Failed to load students");
            } finally {
                setLoading(false);
            }
        };
        if (user && ['ADMIN', 'STAFF', 'COMPANY'].includes(user.role)) {
            fetchStudents();
        }
    }, [user, router]);

    // Filter logic
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Search by name
            if (searchQuery && !student.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            // Department filter
            if (filterDept && student.department !== filterDept) return false;
            // Batch year filter
            if (filterBatch && String(student.batchYear) !== filterBatch) return false;
            // Status filter
            if (filterStatus && student.placementStatus !== filterStatus) return false;
            // CGPA range
            if (filterCgpaMin && (student.cgpa || 0) < parseFloat(filterCgpaMin)) return false;
            if (filterCgpaMax && (student.cgpa || 0) > parseFloat(filterCgpaMax)) return false;
            return true;
        });
    }, [students, searchQuery, filterDept, filterBatch, filterStatus, filterCgpaMin, filterCgpaMax]);

    // Get unique batch years
    const batchYears = useMemo(() => {
        return [...new Set(students.map(s => s.batchYear).filter(Boolean))].sort((a, b) => b - a);
    }, [students]);

    const activeFilterCount = [filterDept, filterBatch, filterStatus, filterCgpaMin, filterCgpaMax].filter(Boolean).length;

    const clearFilters = () => {
        setFilterDept(''); setFilterBatch(''); setFilterStatus(''); setFilterCgpaMin(''); setFilterCgpaMax('');
        setSearchQuery('');
    };

    const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading students...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Students</h1>
                <div className="flex items-center gap-2">
                    {user?.role === 'ADMIN' && (
                        <Button onClick={() => router.push('/students/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    )}
                </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9" />
                </div>
                <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-1 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">{activeFilterCount}</span>
                    )}
                </Button>
                {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                        <X className="h-3 w-3" /> Clear
                    </Button>
                )}
                <span className="text-sm text-muted-foreground ml-auto">{filteredStudents.length} of {students.length} students</span>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-lg border animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Department</label>
                        <select className={cn(selectClass, "bg-background text-foreground")} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Batch Year</label>
                        <select className={selectClass} value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
                            <option value="">All Years</option>
                            {batchYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Status</label>
                        <select className={selectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="PLACED">Placed</option>
                            <option value="NOT_PLACED">Not Placed</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">CGPA Min</label>
                        <Input type="number" step="0.1" min="0" max="10" placeholder="0"
                            value={filterCgpaMin} onChange={(e) => setFilterCgpaMin(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">CGPA Max</label>
                        <Input type="number" step="0.1" min="0" max="10" placeholder="10"
                            value={filterCgpaMax} onChange={(e) => setFilterCgpaMax(e.target.value)} />
                    </div>
                </div>
            )}

            {/* Students Table */}
            <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden text-card-foreground">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>CGPA</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    {students.length > 0 ? 'No students match your filters.' : 'No students found.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student: any) => (
                                <TableRow key={student._id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell>{student.department}</TableCell>
                                    <TableCell>{student.batchYear}</TableCell>
                                    <TableCell>{student.cgpa}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                            student.placementStatus === 'PLACED'
                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        )}>
                                            {student.placementStatus.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/students/${student._id}`)}>
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// aria-label placeholder
