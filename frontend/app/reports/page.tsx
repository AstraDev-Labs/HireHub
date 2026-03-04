"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Users, Building2, BarChart3, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const { user } = useAuth();
    const [downloading, setDownloading] = useState('');

    const downloadCSV = (data: any[], filename: string) => {
        if (!data.length) { toast.error("No data to export"); return; }
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h] ?? '';
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    };

    const exportStudents = async () => {
        setDownloading('students');
        try {
            const { data } = await api.get('/students');
            const students = data.data.students.map((s: any) => ({
                Name: s.name,
                Department: s.department,
                BatchYear: s.batchYear,
                CGPA: s.cgpa,
                PlacementStatus: s.placementStatus,
                Email: s.email || '',
            }));
            downloadCSV(students, `students_report_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success("Students report downloaded");
        } catch { toast.error("Failed to fetch students data"); }
        finally { setDownloading(''); }
    };

    const exportCompanies = async () => {
        setDownloading('companies');
        try {
            const { data } = await api.get('/companies');
            const companies = data.data.companies.map((c: any) => ({
                Name: c.name,
                Location: Array.isArray(c.location) ? c.location.join('; ') : c.location,
                PackageLPA: c.packageLpa,
                MinCGPA: c.minCgpa,
                HiringStatus: c.hiringStatus,
                JobRoles: c.jobRoles?.join('; ') || '',
                Website: c.website || '',
            }));
            downloadCSV(companies, `companies_report_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success("Companies report downloaded");
        } catch { toast.error("Failed to fetch companies data"); }
        finally { setDownloading(''); }
    };

    const exportPlacementStats = async () => {
        setDownloading('stats');
        try {
            const { data } = await api.get('/dashboard');
            const stats = data.data;
            const rows = [
                { Metric: 'Total Students', Value: stats.totalStudents },
                { Metric: 'Placed Students', Value: stats.placedStudents },
                { Metric: 'Total Companies', Value: stats.totalCompanies },
                { Metric: 'Active Drives', Value: stats.activeDrives || 0 },
                { Metric: 'Placement Rate', Value: `${stats.placementRate || 0}%` },
            ];
            if (stats.departmentWiseStats) {
                stats.departmentWiseStats.forEach((d: any) => {
                    rows.push({ Metric: `${d.department} - Total`, Value: d.total });
                    rows.push({ Metric: `${d.department} - Placed`, Value: d.placed });
                });
            }
            downloadCSV(rows, `placement_stats_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success("Stats report downloaded");
        } catch { toast.error("Failed to fetch stats"); }
        finally { setDownloading(''); }
    };

    if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
        return <div className="p-8 text-center text-muted-foreground">Access restricted to Admin/Staff only.</div>;
    }

    const reports = [
        {
            title: 'Student Report',
            description: 'Export all students with name, department, batch year, CGPA, and placement status.',
            icon: Users,
            action: exportStudents,
            key: 'students',
            color: 'text-primary bg-primary/10 border-primary/20',
        },
        {
            title: 'Company Report',
            description: 'Export all participating companies with package, CGPA requirements, and job roles.',
            icon: Building2,
            action: exportCompanies,
            key: 'companies',
            color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        },
        {
            title: 'Placement Statistics',
            description: 'Export overall placement stats including department-wise breakdown and rates.',
            icon: BarChart3,
            action: exportPlacementStats,
            key: 'stats',
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Reports & Export</h2>
                <p className="text-muted-foreground mt-1 text-sm font-medium">Download placement data as high-quality CSV files</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reports.map(report => (
                    <Card key={report.key} className="border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 border ${report.color}`}>
                                <report.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-lg font-bold text-foreground">{report.title}</CardTitle>
                            <CardDescription className="text-muted-foreground">{report.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={report.action} disabled={downloading === report.key} className="w-full gap-2" variant="outline">
                                {downloading === report.key ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
                                ) : (
                                    <><FileDown className="h-4 w-4" /> Download CSV</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// aria-label placeholder
