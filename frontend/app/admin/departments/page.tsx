"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "../../../components/ui/label";
import toast from 'react-hot-toast';
import { Trash2, Plus, Building, Pencil } from 'lucide-react';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newDept, setNewDept] = useState({ name: '', code: '' });
    const [processing, setProcessing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.data.departments);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load departments");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setNewDept({ name: '', code: '' });
        setIsAddOpen(true);
    };

    const handleOpenEdit = (dept: any) => {
        setEditingId(dept._id);
        setNewDept({ name: dept.name, code: dept.code });
        setIsAddOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDept.name || !newDept.code) {
            toast.error("Please fill in all fields");
            return;
        }

        setProcessing(true);
        try {
            if (editingId) {
                await api.patch(`/departments/${editingId}`, newDept);
                toast.success("Department updated successfully");
            } else {
                await api.post('/departments', newDept);
                toast.success("Department added successfully");
            }
            setIsAddOpen(false);
            setNewDept({ name: '', code: '' });
            setEditingId(null);
            fetchDepartments();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Operation failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            await api.delete(`/departments/${id}`);
            toast.success("Department deleted");
            fetchDepartments();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete department");
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Departments</h1>
                    <p className="text-muted-foreground">Manage academic departments</p>
                </div>
                <Button onClick={handleOpenAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Department
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Department" : "Add New Department"}</DialogTitle>
                            <DialogDescription>
                                {editingId ? "Update department details." : "Create a new academic department."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Department Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Computer Science and Engineering"
                                    value={newDept.name}
                                    onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Department Code</Label>
                                <Input
                                    id="code"
                                    placeholder="CSE"
                                    value={newDept.code}
                                    onChange={(e) => setNewDept(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : (editingId ? 'Update Department' : 'Add Department')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border bg-card shadow-sm text-card-foreground">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-bold">
                        <Building className="h-5 w-5 text-primary" /> All Departments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : departments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No departments found.</TableCell>
                                </TableRow>
                            ) : (
                                departments.map(dept => (
                                    <TableRow key={dept._id}>
                                        <TableCell className="font-bold text-foreground">{dept.code}</TableCell>
                                        <TableCell className="text-muted-foreground font-medium">{dept.name}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="bg-muted text-muted-foreground hover:bg-muted/80 border-border"
                                                onClick={() => handleOpenEdit(dept)}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(dept._id, dept.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

// aria-label placeholder
