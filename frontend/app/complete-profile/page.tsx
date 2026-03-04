"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    // department: z.string().min(2, "Department is required"), // Removed as set in registration
    batchYear: z.string().min(4, "Batch Year is required"), // Using string for input, convert to number
    cgpa: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 10, {
        message: "CGPA must be between 0 and 10"
    })
});

export default function CompleteProfilePage() {
    const { user, login } = useAuth(); // We might need to re-login or just update state?
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phone: "",
            // department: "",
            batchYear: new Date().getFullYear().toString(),
            cgpa: ""
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            // We need an endpoint to update student profile.
            // Using existing student update endpoint? We need the student ID.
            // But from frontend we might only have User ID.
            // Ideally we should have a `PATCH /students/me` or similar.
            // Or we fetch the student ID first.

            // Let's assume we can find the student by the logged in user's token in a new endpoint
            // OR we use the generic update if we know the ID.

            // Allow endpoint: POST /students/complete-profile
            await api.post('/students/complete-profile', {
                phone: values.phone,
                // department: values.department, // Removed
                batchYear: parseInt(values.batchYear),
                cgpa: parseFloat(values.cgpa)
            });

            toast.success("Profile completed successfully!");
            router.push('/dashboard');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Complete Your Profile</CardTitle>
                    <CardDescription>Please provide your academic and contact details to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input {...form.register("phone")} placeholder="e.g. 9876543210" />
                            {form.formState.errors.phone && <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Batch Year</label>
                            <Input {...form.register("batchYear")} type="number" placeholder="2025" />
                            {form.formState.errors.batchYear && <p className="text-red-500 text-sm">{form.formState.errors.batchYear.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current CGPA</label>
                            <Input {...form.register("cgpa")} step="0.01" type="number" placeholder="8.5" />
                            {form.formState.errors.cgpa && <p className="text-red-500 text-sm">{form.formState.errors.cgpa.message}</p>}
                        </div>

                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save & Continue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

// aria-label placeholder
