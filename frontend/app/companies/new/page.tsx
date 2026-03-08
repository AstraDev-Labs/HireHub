"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// UI Helpers
const textareaClass = "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const formSchema = z.object({
    name: z.string().min(2, "Company name is required"),
    email: z.string().email("Invalid email"),
    website: z.string().optional(),
    jobRoles: z.array(z.string()).min(1, "At least one job role is required"),
    packageLpa: z.coerce.number().min(0, "Package must be a number"),
    minCgpa: z.coerce.number().min(0).max(10),
    location: z.string().min(2, "Location is required"),
    description: z.string().optional(),
    hiringStatus: z.enum(['OPEN', 'CLOSED'])
});

export default function AddCompanyPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [jobRoles, setJobRoles] = useState<string[]>([]);
    const router = useRouter();
    const { user } = useAuth();

    // Protect Route: Only ADMIN
    if (user && user.role !== 'ADMIN') {
        // We can redirect or show access denied. 
        // Better to redirect in useEffect to avoid hydration mismatch if user loads late, 
        // but simple return is okay if we handle loading state.
        // Let's use useEffect for cleaner redirect.
    }

    // Actually, let's just use useAuth loading state if available, or just check user.
    // Since useAuth might load user asynchronously, we should wait.
    // But for now, let's do a simple check.

    if (user?.role && user.role !== 'ADMIN') {
        return <div className="p-8 text-center text-red-500">Access Denied: Only Admins can add companies.</div>;
    }

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            website: '',
            jobRoles: [],
            packageLpa: 0,
            minCgpa: 0,
            location: '',
            description: '',
            hiringStatus: 'OPEN'
        }
    });

    // Sync state with form
    const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !jobRoles.includes(val)) {
                const newRoles = [...jobRoles, val];
                setJobRoles(newRoles);
                form.setValue('jobRoles', newRoles, { shouldValidate: true });
                e.currentTarget.value = '';
            }
        }
    };

    const removeRole = (roleToRemove: string) => {
        const newRoles = jobRoles.filter(r => r !== roleToRemove);
        setJobRoles(newRoles);
        form.setValue('jobRoles', newRoles, { shouldValidate: true });
    };

    async function onSubmit(values: any) {
        setIsLoading(true);
        try {
            await api.post('/companies', values);
            toast.success('Company created successfully');
            router.push('/companies');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create company');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Company</CardTitle>
                    <CardDescription>Enter company details for placement drive</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Company Name</label>
                                <Input {...form.register("name")} />
                                {form.formState.errors.name && <p className="text-red-500 text-xs">{String(form.formState.errors.name.message)}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contact Email</label>
                                <Input type="email" {...form.register("email")} />
                                {form.formState.errors.email && <p className="text-red-500 text-xs">{String(form.formState.errors.email.message)}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Job Roles (Press Enter to add)</label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[42px]">
                                    {jobRoles.map((role, index) => (
                                        <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs flex items-center">
                                            {role}
                                            <button type="button" onClick={() => removeRole(role)} className="ml-1 text-primary hover:text-red-500">
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                                        placeholder={jobRoles.length === 0 ? "e.g. SDE, Analyst" : ""}
                                        onKeyDown={handleRoleKeyDown}
                                    />
                                </div>
                                {form.formState.errors.jobRoles && <p className="text-red-500 text-xs">{String(form.formState.errors.jobRoles.message)}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Package (LPA)</label>
                                <Input type="number" step="0.1" {...form.register("packageLpa")} />
                                {form.formState.errors.packageLpa && <p className="text-red-500 text-xs">{String(form.formState.errors.packageLpa.message)}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input {...form.register("location")} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hiring Status</label>
                                <select className={inputClass} {...form.register("hiringStatus")}>
                                    <option value="OPEN">Open</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Min CGPA</label>
                                <Input type="number" step="0.1" min={0} max={10} {...form.register("minCgpa")} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Website</label>
                                <Input {...form.register("website")} placeholder="Optional" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea className={textareaClass} {...form.register("description")} />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Company'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// aria-label placeholder
