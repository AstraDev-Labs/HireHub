"use client";

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Users, Building2, UserCheck, UserX, TrendingUp, ClipboardList, Clock, CheckCircle, XCircle, BarChart3, AlertCircle, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const DashboardClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>;
};

// Simple bar component for charts
function ProgressBar({ value, max, color = 'bg-primary', label, count }: { value: number; max: number; color?: string; label: string; count?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-muted-foreground">{count || `${value}/${max}`}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
                    style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// Stat card component
function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-muted-foreground', valueColor = '', onClick }: any) {
    return (
        <Card className={cn("hover:shadow-lg transition-all duration-300 border-0 shadow-md", onClick && "cursor-pointer")} onClick={onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={cn("h-5 w-5", iconColor)} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-3xl font-bold", valueColor)}>{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

// ============ ADMIN/STAFF DASHBOARD ============
function AdminDashboard({ user }: { user: any }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        api.get('/dashboard').then(res => setStats(res.data.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading || !stats) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                        <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                            <Clock className="h-4 w-4" />
                            <DashboardClock />
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Welcome back, {user?.fullName}! Here's what's happening today.
                    </p>
                </div>
            </div>
            {/* Top Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Total Students" value={stats.totalStudents} subtitle="Registered" icon={Users} iconColor="text-blue-500" />
                <StatCard title="Placed" value={stats.placedStudents} subtitle="Successfully placed" icon={UserCheck} iconColor="text-green-500" valueColor="text-green-600" />
                <StatCard title="Not Placed" value={stats.notPlacedStudents} subtitle="Still seeking" icon={UserX} iconColor="text-amber-500" valueColor="text-amber-600" />
                <StatCard title="Companies" value={stats.totalCompanies} subtitle="Active recruiting" icon={Building2} iconColor="text-indigo-500" valueColor="text-indigo-600" />
                <StatCard title="Placement Rate" value={`${stats.placementRate}%`} subtitle="Overall rate" icon={TrendingUp}
                    iconColor={stats.placementRate >= 50 ? "text-green-500" : "text-amber-500"}
                    valueColor={stats.placementRate >= 50 ? "text-green-600" : "text-amber-600"} />
            </div>

            {/* Pending Registrations Alert */}
            {stats.pendingRegistrations > 0 && (
                <Card className="border-amber-200 bg-amber-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/admin/registrations')}>
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="text-amber-800 font-medium">{stats.pendingRegistrations} pending registration(s) awaiting approval</span>
                        <span className="ml-auto text-amber-600 text-sm font-medium">Review →</span>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Department-wise Placement Chart */}
                <Card className="border-0 shadow-md col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Department-wise Placement
                        </CardTitle>
                        <CardDescription>Placed vs Total students by department</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats.departmentStats?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.departmentStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Legend />
                                    <Bar dataKey="total" name="Total Students" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="placed" name="Placed Students" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-muted-foreground py-10 mt-10">No department data</p>}
                    </CardContent>
                </Card>

                {/* Salary Distribution Chart */}
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <IndianRupee className="h-5 w-5 text-primary" />
                            Salary Distribution
                        </CardTitle>
                        <CardDescription>Accepted offers by package ranges</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center pt-0">
                        {stats.salaryStats?.some((s: any) => s.count > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.salaryStats}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={2}
                                    >
                                        {stats.salaryStats.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-muted-foreground w-full py-10">No salary data available</p>}
                    </CardContent>
                </Card>

                {/* Company-wise Applicants */}
                <Card className="border-0 shadow-md col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                            Company Applicants
                        </CardTitle>
                        <CardDescription>Top companies by applicant count</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {stats.companyStats?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.companyStats.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" allowDecimals={false} tick={{ fill: 'currentColor' }} />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: 'currentColor' }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Bar dataKey="applicants" name="Applicants" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                                        {stats.companyStats.slice(0, 15).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.hiringStatus === 'OPEN' ? '#10b981' : '#0ea5e9'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-muted-foreground py-10 mt-10">No company data</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ============ STUDENT DASHBOARD ============
function StudentDashboard({ user }: { user: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/student').then(res => setData(res.data.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load dashboard.</div>;

    const statusColor = (status: string) => {
        switch (status) {
            case 'PLACED': case 'CLEARED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'PENDING_APPROVAL': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">My Dashboard</h2>
                        <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                            <Clock className="h-4 w-4" />
                            <DashboardClock />
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-1">Welcome back, {user?.fullName}</p>
                </div>
            </div>

            {/* Student Info Card */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-transparent">
                <CardContent className="flex items-center gap-6 py-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                        {user?.fullName?.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold">{data.studentName || user?.fullName}</h3>
                        <p className="text-muted-foreground text-sm">{data.department} | CGPA: <strong>{data.cgpa}</strong></p>
                    </div>
                </CardContent>
            </Card>

            {/* Application Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Total Applications" value={data.totalApplications} subtitle="Companies applied" icon={ClipboardList} iconColor="text-blue-500" />
                <StatCard title="In Progress" value={data.pending} subtitle="Active rounds" icon={Clock} iconColor="text-amber-500" valueColor="text-amber-600" />
                <StatCard title="Cleared" value={data.cleared} subtitle="Rounds cleared" icon={CheckCircle} iconColor="text-green-500" valueColor="text-green-600" />
                <StatCard title="Rejected" value={data.rejected} subtitle="Not selected" icon={XCircle} iconColor="text-red-500" valueColor="text-red-600" />
            </div>

            {/* Application Timeline */}
            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">My Applications</CardTitle>
                    <CardDescription>Track your placement journey</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.applications?.length > 0 ? (
                        <div className="space-y-3">
                            {data.applications.map((app: any) => (
                                <div key={app._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <div>
                                        <h4 className="font-semibold">{app.companyName}</h4>
                                        <p className="text-sm text-muted-foreground">Current Round: {app.roundName}</p>
                                    </div>
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold border", statusColor(app.status))}>
                                        {app.status === 'PENDING_APPROVAL' ? 'Awaiting Approval' : app.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No applications yet</p>
                            <p className="text-sm">Browse companies and apply to start your placement journey!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ============ COMPANY DASHBOARD (enhanced) ============
function CompanyDashboardView({ user }: { user: any }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/company').then(res => setData(res.data.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load dashboard.</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{data.companyName} Dashboard</h2>
                        <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                            <Clock className="h-4 w-4" />
                            <DashboardClock />
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-1">Recruitment overview</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Applicants" value={data.totalApplicants} subtitle="Approved applicants" icon={Users} iconColor="text-blue-500" />
                <StatCard title="Pending Approvals" value={data.pendingApprovals} subtitle="Awaiting admin action" icon={Clock} iconColor="text-amber-500" valueColor="text-amber-600" />
                <StatCard title="Hiring Rounds" value={data.pipeline?.length || 0} subtitle="Selection stages" icon={BarChart3} iconColor="text-indigo-500" valueColor="text-indigo-600" />
            </div>

            {/* Recruitment Pipeline */}
            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">Recruitment Pipeline</CardTitle>
                    <CardDescription>Candidates flowing through each round</CardDescription>
                </CardHeader>
                <CardContent>
                    {data.pipeline?.length > 0 ? (
                        <div className="space-y-4">
                            {data.pipeline.map((round: any, i: number) => (
                                <div key={i} className="p-4 rounded-lg border">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold">Round {round.roundOrder}: {round.roundName}</h4>
                                        <span className="text-sm font-medium text-muted-foreground">{round.total} candidates</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-2 rounded bg-blue-50">
                                            <div className="text-lg font-bold text-blue-600">{round.pending}</div>
                                            <div className="text-xs text-blue-600/70">Pending</div>
                                        </div>
                                        <div className="text-center p-2 rounded bg-green-50">
                                            <div className="text-lg font-bold text-green-600">{round.cleared}</div>
                                            <div className="text-xs text-green-600/70">Cleared</div>
                                        </div>
                                        <div className="text-center p-2 rounded bg-red-50">
                                            <div className="text-lg font-bold text-red-600">{round.rejected}</div>
                                            <div className="text-xs text-red-600/70">Rejected</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No rounds configured yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ============ PARENT DASHBOARD ============
function ParentDashboard({ user }: { user: any }) {
    const [childStatus, setChildStatus] = useState<any[]>([]);
    const [childName, setChildName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/students/my-child-status').then(res => {
            setChildStatus(res.data.data.statuses);
            setChildName(res.data.data.studentName);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <DashboardSkeleton />;

    const statusColor = (status: string) => {
        switch (status) {
            case 'SELECTED': case 'PLACED': case 'CLEARED': return 'bg-green-500 text-white';
            case 'REJECTED': return 'bg-red-500 text-white';
            default: return 'bg-secondary text-secondary-foreground';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Student Progress</h2>
                        <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold border border-primary/20">
                            <Clock className="h-4 w-4" />
                            <DashboardClock />
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-1">Parent of: <span className="font-semibold text-primary">{childName || user?.studentName}</span></p>
                </div>
            </div>

            <Card className="border-0 shadow-md">
                <CardHeader>
                    <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {childStatus.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Your child has not applied to any companies yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {childStatus.map((status: any) => (
                                <div key={status._id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                    <div>
                                        <h4 className="font-semibold">{status.companyId?.name || 'Unknown Company'}</h4>
                                        <p className="text-sm text-muted-foreground">{status.roundId?.roundName || 'Initial Stage'}</p>
                                    </div>
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", statusColor(status.status))}>
                                        {status.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Loading skeleton
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-lg" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map(i => <div key={i} className="h-64 bg-muted rounded-lg" />)}
            </div>
        </div>
    );
}

// ============ MAIN DASHBOARD ============
export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return <DashboardSkeleton />;

    switch (user.role) {
        case 'ADMIN':
        case 'STAFF':
            return <AdminDashboard user={user} />;
        case 'STUDENT':
            return <StudentDashboard user={user} />;
        case 'COMPANY':
            return <CompanyDashboardView user={user} />;
        case 'PARENT':
            return <ParentDashboard user={user} />;
        default:
            return <div className="p-8 text-center">Unknown role</div>;
    }
}

// aria-label placeholder
