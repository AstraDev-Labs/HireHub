"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

const formSchema = z.object({
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const params = useParams();
    const token = params.token;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const passwordValue = form.watch('password');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await api.patch(`/auth/reset-password/${token}`, { password: values.password });
            toast.success('Password reset successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Token is invalid or has expired';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background px-4">
            <Card className="w-full max-w-sm shadow-2xl border border-border bg-card text-card-foreground animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">Reset Password</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm font-medium">
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="password">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...form.register("password")}
                                    className={cn(
                                        "bg-muted/50 border-border focus:ring-primary h-11 pl-10 pr-10",
                                        form.formState.errors.password ? "border-destructive ring-destructive/20" : ""
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* password requirements UI */}
                            {passwordValue && (
                                <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-1.5 border border-border/50">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground mb-1 tracking-tighter">Security Requirements</p>
                                    {[
                                        { label: '8+ Characters', met: passwordValue.length >= 8 },
                                        { label: 'Lower & Uppercase', met: /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue) },
                                        { label: 'Numbers & Specials', met: /[0-9]/.test(passwordValue) && /[!@#$%^&*]/.test(passwordValue) }
                                    ].map((req, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            {req.met ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-400" />}
                                            <span className={cn("text-[11px] font-bold", req.met ? "text-green-600" : "text-muted-foreground")}>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {form.formState.errors.password && (
                                <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="confirmPassword">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...form.register("confirmPassword")}
                                    className={cn(
                                        "bg-muted/50 border-border focus:ring-primary h-11 pl-10",
                                        form.formState.errors.confirmPassword ? "border-destructive ring-destructive/20" : ""
                                    )}
                                />
                            </div>
                            {form.formState.errors.confirmPassword && (
                                <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2" type="submit" disabled={isLoading}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
