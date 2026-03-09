"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Building2, MapPin, UploadCloud, Users, GraduationCap, Clock, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import * as ExcelJS from 'exceljs';

export default function NewDrivePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        companyId: '',
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        driveType: 'ON_CAMPUS',
        minCgpa: '0',
        eligibleDepartments: '' // Comma separated string for simplicity
    });

    useEffect(() => {
        if (!user) return;
        if (user.role === 'STUDENT' || user.role === 'PARENT') {
            router.push('/drives');
            return;
        }

        if (user.role === 'ADMIN' || user.role === 'STAFF') {
            const fetchCompanies = async () => {
                try {
                    const { data } = await api.get('/companies');
                    setCompanies(data.data.companies || []);
                } catch (error) {
                    toast.error('Failed to load companies');
                }
            };
            fetchCompanies();
        } else if (user.role === 'COMPANY') {
            setFormData(prev => ({ ...prev, companyId: user.companyId || '' }));
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                minCgpa: parseFloat(formData.minCgpa),
                eligibleDepartments: formData.eligibleDepartments.split(',').map(d => d.trim()).filter(Boolean)
            };

            await api.post('/drives', payload);
            toast.success('Placement Drive scheduled successfully!');
            router.push('/drives');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to schedule drive');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(data);
            const worksheet = workbook.getWorksheet(1);
            
            if (!worksheet) {
                toast.error('The Excel file is empty.');
                setLoading(false);
                return;
            }

            const json: any[] = [];
            const headerRow = worksheet.getRow(1);
            const headers: string[] = [];
            headerRow.eachCell((cell: any, colNumber: number) => {
                headers[colNumber] = cell.value?.toString() || '';
            });

            worksheet.eachRow((row: any, rowNumber: number) => {
                if (rowNumber === 1) return; // Skip headers
                const rowData: any = {};
                row.eachCell((cell: any, colNumber: number) => {
                    const header = headers[colNumber];
                    if (header) rowData[header] = cell.value;
                });
                json.push(rowData);
            });

            if (json.length === 0) {
                toast.error('The Excel file is empty.');
                setLoading(false);
                return;
            }

            let successCount = 0;
            let errCount = 0;

            for (const row of json) {
                try {
                    // Expect columns: title, description, date, time, venue, driveType, minCgpa, eligibleDepartments, companyId (optional if COMPANY)
                    const payload = {
                        title: row.title || row.Title,
                        description: row.description || row.Description || '',
                        date: row.date || row.Date,
                        time: row.time || row.Time || '09:00 AM',
                        venue: row.venue || row.Venue || 'TBA',
                        driveType: row.driveType || row.DriveType || 'ON_CAMPUS',
                        minCgpa: parseFloat(row.minCgpa || row.MinCgpa || '0'),
                        eligibleDepartments: (row.eligibleDepartments || row.EligibleDepartments || '').split(',').map((d: string) => d.trim()).filter(Boolean),
                        companyId: row.companyId || row.CompanyId || formData.companyId
                    };

                    if (!payload.title || !payload.date || (user?.role !== 'COMPANY' && !payload.companyId)) {
                        errCount++;
                        continue;
                    }

                    console.log('Sending drive payload:', payload);
                    const response = await api.post('/drives', payload);
                    console.log('Drive creation response:', response.data);
                    successCount++;
                } catch (err: any) {
                    console.error('Drive creation failed:', err.response?.data || err);
                    errCount++;
                }
            }

            toast.success(`Import complete: ${successCount} imported, ${errCount} failed.`);
            if (successCount > 0) router.push('/drives');

        } catch (error) {
            console.error(error);
            toast.error('Failed to parse Excel file. Please ensure it is formatted correctly.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!user) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schedule Placement Drive</h1>
                    <p className="text-muted-foreground mt-2">Create a new recruitment event for students.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Import Excel
                    </Button>
                    <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Drive Details</CardTitle>
                    <CardDescription>Fill in the information below to announce a new drive.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <select
                                    id="company"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.companyId}
                                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                >
                                    <option value="" disabled>Select a company...</option>
                                    {companies.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="title">Drive Title</Label>
                            <Input id="title" required placeholder="e.g., Software Engineer Hiring Drive 2024"
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description & Requirements</Label>
                            <Textarea id="description" required placeholder="Details about the role, hiring process, etc." className="h-32"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" required
                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Time</Label>
                                <Input id="time" type="time" required
                                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="venue">Venue / Location</Label>
                                <Input id="venue" placeholder="e.g., Main Auditorium or Virtual Meeting Link" required
                                    value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="driveType">Mode of Work</Label>
                                <select
                                    id="driveType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.driveType}
                                    onChange={(e) => setFormData({ ...formData, driveType: e.target.value })}
                                >
                                    <option value="ON_CAMPUS">On Campus</option>
                                    <option value="OFF_CAMPUS">Off Campus</option>
                                    <option value="POOL_CAMPUS">Pool Campus</option>
                                    <option value="VIRTUAL">Virtual</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="minCgpa">Minimum CGPA Required</Label>
                                <Input id="minCgpa" type="number" step="0.1" min="0" max="10" required
                                    value={formData.minCgpa} onChange={e => setFormData({ ...formData, minCgpa: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eligibleDepartments">Eligible Branches</Label>
                                <Input id="eligibleDepartments" placeholder="e.g., CSE, IT, ECE (leave blank for all)"
                                    value={formData.eligibleDepartments} onChange={e => setFormData({ ...formData, eligibleDepartments: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading} className="w-full md:w-auto min-w-[150px]">
                                {loading ? 'Scheduling...' : 'Schedule Drive'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
