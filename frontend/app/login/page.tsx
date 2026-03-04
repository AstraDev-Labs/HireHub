"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', values);
            const { token, refreshToken, data } = response.data;
            login(token, refreshToken, data.user, data.isProfileComplete);
            toast.success('Login success!');
        } catch (error: any) {
            console.error(error);
            const errorData = error.response?.data;
            const msg = errorData?.message || 'Login failed';

            // Handle email not verified
            if (errorData?.code === 'EMAIL_NOT_VERIFIED') {
                toast.error('Your email is not verified. Please register again.', { duration: 5000 });
                return;
            }

            toast.error(msg, { duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm shadow-2xl border border-border bg-card text-card-foreground animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                <CardHeader className="space-y-1 pb-4">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce duration-[2000ms]">
                            <span className="text-2xl font-black text-primary-foreground">H</span>
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-center tracking-tight text-foreground">Welcome Back</CardTitle>
                    <CardDescription className="text-center text-muted-foreground text-sm font-medium">
                        Enter your credentials to access HireHub
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="email">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@university.edu"
                                {...form.register("email")}
                                className={cn(
                                    "bg-muted/50 border-border focus:ring-primary h-11",
                                    form.formState.errors.email ? "border-destructive ring-destructive/20" : ""
                                )}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground" htmlFor="password">
                                    Password
                                </label>
                                <Link href="/forgot-password" title="Click to reset password" className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">Forgot?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...form.register("password")}
                                className={cn(
                                    "bg-muted/50 border-border focus:ring-primary h-11",
                                    form.formState.errors.password ? "border-destructive ring-destructive/20" : ""
                                )}
                            />
                            {form.formState.errors.password && (
                                <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4" type="submit" disabled={isLoading}>
                            {isLoading ? "Authenticating..." : "Sign In"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="/register" className="text-primary hover:underline">Register here</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

// aria-label placeholder
