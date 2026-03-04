"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', values);
            setIsSuccess(true);
            toast.success('Reset link sent to your email!');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Something went wrong';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm shadow-2xl border border-border bg-card text-card-foreground animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                <CardHeader className="space-y-1 pb-4">
                    <div className="flex justify-start mb-2">
                        <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs font-medium">
                            <ArrowLeft className="h-3 w-3" /> Back to Login
                        </Link>
                    </div>
                    <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">Forgot Password?</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm font-medium">
                        Enter your email and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isSuccess ? (
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@university.edu"
                                        {...form.register("email")}
                                        className={cn(
                                            "bg-muted/50 border-border focus:ring-primary h-11 pl-10",
                                            form.formState.errors.email ? "border-destructive ring-destructive/20" : ""
                                        )}
                                    />
                                </div>
                                {form.formState.errors.email && (
                                    <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                            <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2" type="submit" disabled={isLoading}>
                                {isLoading ? "Sending Link..." : "Send Reset Link"}
                            </Button>
                        </form>
                    ) : (
                        <div className="py-6 text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="bg-green-500/10 p-3 rounded-full">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg">Check your email</h3>
                                <p className="text-sm text-muted-foreground">
                                    If an account exists for {form.getValues('email')}, you will receive a password reset link shortly.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                            >
                                Return to Login
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
