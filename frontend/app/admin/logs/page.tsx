"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Search, RefreshCcw, ShieldCheck, 
    Clock, Activity, Filter, FileText,
    ChevronLeft, ChevronRight, User, Hash
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminLogsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResource, setFilterResource] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/logs');
            setLogs(res.data.data.logs);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            toast.error("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        fetchLogs();
    }, [user, router]);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.actorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.resourceId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesResource = filterResource === 'ALL' || log.resource === filterResource;

        return matchesSearch && matchesResource;
    });

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase text-[10px] font-bold">Create</Badge>;
            case 'UPDATE': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase text-[10px] font-bold">Update</Badge>;
            case 'DELETE': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase text-[10px] font-bold">Delete</Badge>;
            default: return <Badge variant="secondary" className="uppercase text-[10px]">{action}</Badge>;
        }
    };

    if (user && user.role !== 'ADMIN') return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-primary" /> System Audit Logs
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">Track every administrative action across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="font-bold gap-2">
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Logs
                    </Button>
                </div>
            </div>

            <Card className="border-border shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border py-6">
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by actor, details, or resource ID..." 
                                className="pl-10 bg-background border-border/50 h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resource:</span>
                            </div>
                            <select 
                                value={filterResource}
                                onChange={(e) => setFilterResource(e.target.value)}
                                className="bg-background border border-border/50 rounded-md px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none min-w-[140px]"
                            >
                                <option value="ALL">All Resources</option>
                                <option value="Challenge">Challenges</option>
                                <option value="Drive">Placement Drives</option>
                                <option value="Interview">Interviews</option>
                                <option value="User">User Approvals</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[180px] font-bold text-xs uppercase tracking-widest">Timestamp</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-widest">Actor</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-widest">Action</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-widest">Resource</TableHead>
                                    <TableHead className="font-bold text-xs uppercase tracking-widest">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <span className="text-muted-foreground font-medium animate-pulse">Fetching audit trails...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <Activity className="w-12 h-12 mb-2" />
                                                <p className="font-bold text-lg">No audit logs found</p>
                                                <p className="text-sm italic">Adjust your filters or check back later.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-primary/40" />
                                                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm flex items-center gap-2">
                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                        {log.actorName}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-black tracking-tighter text-primary/60">{log.actorRole}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getActionBadge(log.action)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs text-foreground/80">{log.resource}</span>
                                                    <span className="text-[9px] font-mono text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                                                        <Hash className="w-2 h-2" />
                                                        {log.resourceId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <div className="flex items-start gap-2">
                                                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                                    <p className="text-sm text-foreground/90 font-medium leading-relaxed">{log.details}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground italic font-medium">
                <p>Showing {filteredLogs.length} activity records</p>
                <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-green-500" />
                    <span>Immutable audit trail secured by DynamoDB</span>
                </div>
            </div>
        </div>
    );
}
