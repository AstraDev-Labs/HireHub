"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const formSchema = z.object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
    username: z.string().min(3, { message: "Username must be at least 3 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    phoneNumber: z.string().regex(/^\d{10}$/, { message: "Phone number must be exactly 10 digits" }),
    password: z.string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Must contain at least one special character" }),
    confirmPassword: z.string(),
    role: z.enum(["STUDENT", "COMPANY", "PARENT", "STAFF"]),
    companyId: z.string().optional(),
    companyEmail: z.string().email().optional().or(z.literal('')),
    studentName: z.string().optional(),
    studentContact: z.string().optional(),
    department: z.string().optional(),
    batchYear: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.role === 'COMPANY') return !!data.companyId && !!data.companyEmail;
    if (data.role === 'PARENT') return !!data.studentName && !!data.studentContact;
    if (data.role === 'STAFF' || data.role === 'STUDENT') return !!data.department && (data.role === 'STAFF' || !!data.batchYear);
    return true;
}, {
    message: "Required fields missing",
    path: ["role"],
});

// Password strength calculator
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export default function RegisterPage() {
    const [step, setStep] = useState(1); // 1=BasicInfo, 2=Verification, 3=Password
    const [isLoading, setIsLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const router = useRouter();

    // Phone / Email verification state
    const [phoneOTPSent, setPhoneOTPSent] = useState(false);
    const [phoneOTPCode, setPhoneOTPCode] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneOTPLoading, setPhoneOTPLoading] = useState(false);
    const [phoneCountdown, setPhoneCountdown] = useState(0);

    // Parent student search
    const [studentSearchQuery, setStudentSearchQuery] = useState("");
    const [studentOptions, setStudentOptions] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            username: "",
            email: "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            role: "STUDENT",
            companyId: "",
            companyEmail: "",
            department: "",
            batchYear: ""
        },
    });

    const role = form.watch("role");
    const password = form.watch("password");
    const strength = useMemo(() => getPasswordStrength(password || ''), [password]);

    // Fetch companies / departments based on role
    useEffect(() => {
        if (role === 'COMPANY') {
            api.get('/companies').then(res => {
                setCompanies(res.data.data.companies || []);
            }).catch(err => console.error(err));
        }
        if (role === 'STAFF' || role === 'STUDENT') {
            api.get('/departments').then(res => {
                setDepartments(res.data.data.departments || []);
            }).catch(err => console.error(err));
        }
    }, [role]);

    // Student search for parent role
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (role === 'PARENT' && studentSearchQuery.length > 1) {
                try {
                    const res = await api.get(`/students/search?query=${studentSearchQuery}`);
                    setStudentOptions(res.data.data.students);
                } catch (error) {
                    console.error("Search failed", error);
                }
            } else {
                setStudentOptions([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [studentSearchQuery, role]);

    // Phone OTP countdown
    useEffect(() => {
        if (phoneCountdown > 0) {
            const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [phoneCountdown]);

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        form.setValue("studentName", student.name);
        if (student.phone) form.setValue("studentContact", student.phone);
        setStudentSearchQuery(student.name);
        setStudentOptions([]);
    };

    // Auto-generate username logic
    useEffect(() => {
        const fullName = form.watch("fullName");
        const deptName = form.watch("department");
        const batchYear = form.watch("batchYear");
        const companyId = form.watch("companyId");

        if (!role || !form) return;
        let generatedUsername = "";

        if ((role === 'STUDENT' || role === 'STAFF') && fullName && deptName) {
            const names = fullName.trim().split(/\s+/);
            const firstName = names[0].toUpperCase();
            let initialsArr: string[] = [];
            for (let i = names.length - 1; i > 0; i--) {
                const word = names[i].toUpperCase();
                if (word.length === 1) initialsArr.unshift(word);
                else {
                    if (initialsArr.length === 0) initialsArr.push(word.charAt(0));
                    break;
                }
            }
            const initial = initialsArr.join('');
            const dept = departments.find(d => d.name === deptName);
            const deptCode = dept?.code?.toUpperCase() || deptName.substring(0, 3).toUpperCase();

            if (role === 'STUDENT' && batchYear) {
                generatedUsername = `${firstName}${initial ? '-' + initial : ''}-${deptCode}-${batchYear}`;
            } else if (role === 'STAFF') {
                generatedUsername = `${firstName}${initial ? '-' + initial : ''}-${deptCode}-STAFF`;
            }
        } else if (role === 'COMPANY' && companyId && fullName) {
            const company = companies.find(c => (c.id || c._id) === companyId);
            if (company) {
                const firstName = fullName.trim().split(/\s+/)[0].toUpperCase();
                const cleanCompanyName = company.name.toUpperCase().replace(/\s+/g, '');
                generatedUsername = `${firstName}-${cleanCompanyName}-CPMS`;
            }
        }

        if (generatedUsername) {
            form.setValue("username", generatedUsername);
        }
    }, [role, departments, companies, form, form.watch("fullName"), form.watch("department"), form.watch("batchYear"), form.watch("companyId")]);

    const handleSendPhoneOTP = async () => {
        const email = form.getValues('email');
        const phoneNumber = form.getValues('phoneNumber');
        if (!email) { toast.error("Please fill in your email first."); return; }
        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) { toast.error("Enter a valid 10-digit phone number."); return; }

        setPhoneOTPLoading(true);
        try {
            await api.post('/auth/send-phone-otp', { email, phoneNumber });
            setPhoneOTPSent(true);
            setPhoneCountdown(60);
            toast.success('OTP sent to your email for verification!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setPhoneOTPLoading(false);
        }
    };

    const handleVerifyPhoneOTP = async () => {
        const email = form.getValues('email');
        if (!phoneOTPCode || phoneOTPCode.length !== 6) { toast.error("Enter the 6-digit code."); return; }
        setPhoneOTPLoading(true);
        try {
            await api.post('/auth/verify-phone-otp', { email, code: phoneOTPCode });
            setPhoneVerified(true);
            toast.success('Verified successfully! ✅');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setPhoneOTPLoading(false);
        }
    };

    const canGoToStep2 = () => {
        const { fullName, username, email } = form.getValues();
        if (!fullName || fullName.length < 2) { toast.error("Full name is required."); return false; }
        if (!username || username.length < 3) { toast.error("Username is required."); return false; }
        if (!email || !/\S+@\S+\.\S+/.test(email)) { toast.error("Valid email is required."); return false; }

        if (role === 'COMPANY') {
            if (!form.getValues('companyId')) { toast.error("Select a company."); return false; }
            if (!form.getValues('companyEmail')) { toast.error("Company email is required."); return false; }
        }
        if ((role === 'STAFF' || role === 'STUDENT') && !form.getValues('department')) {
            toast.error("Department is required."); return false;
        }
        if (role === 'STUDENT' && !form.getValues('batchYear')) {
            toast.error("Batch Year is required."); return false;
        }
        if (role === 'PARENT' && !selectedStudent) {
            toast.error("Please select a student."); return false;
        }
        return true;
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!phoneVerified) {
            toast.error("Please verify your account first.");
            setStep(2);
            return;
        }
        setIsLoading(true);
        try {
            const payload: any = {
                fullName: values.fullName,
                username: values.username,
                email: values.email,
                password: values.password,
                role: values.role,
                phoneNumber: values.phoneNumber,
                phoneVerified: true
            };
            if (values.role === 'STAFF' || values.role === 'STUDENT') {
                payload.department = values.department;
                if (values.role === 'STUDENT') payload.batchYear = Number(values.batchYear);
            }
            if (values.role === 'COMPANY') {
                payload.companyId = values.companyId;
                payload.companyEmail = values.companyEmail;
            }
            if (values.role === 'PARENT') {
                payload.studentName = values.studentName;
                payload.studentContact = values.studentContact;
                payload.linkedStudentId = selectedStudent._id || selectedStudent.id;
            }
            await api.post('/auth/register', payload);
            toast.success('Registration successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    }

    const steps = [
        { num: 1, label: 'Basic Info' },
        { num: 2, label: 'Verification' },
        { num: 3, label: 'Security' },
    ];

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
            <Card className="w-full max-w-md shadow-2xl border border-border bg-card text-card-foreground animate-in fade-in slide-in-from-bottom-6 duration-700 overflow-hidden">
                <CardHeader className="space-y-1 pb-6 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
                        <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${(step / 3) * 100}%` }} />
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-center tracking-tight text-foreground pt-4">Create Account</CardTitle>
                    <CardDescription className="text-center text-muted-foreground font-medium">
                        Step {step} of 3 — {steps[step - 1]?.label}
                    </CardDescription>

                    <div className="flex items-center justify-center gap-2 pt-4">
                        {steps.map((s) => (
                            <div key={s.num} className="flex items-center gap-1">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 shadow-sm",
                                    step > s.num ? "bg-emerald-500 border-emerald-500 text-white" :
                                        step === s.num ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" :
                                            "border-muted text-muted-foreground"
                                )}>
                                    {step > s.num ? "✓" : s.num}
                                </div>
                                {s.num < 3 && <div className={cn("w-10 h-0.5 rounded-full", step > s.num ? "bg-emerald-500" : "bg-muted")} />}
                            </div>
                        ))}
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">I am a... <span className="text-destructive">*</span></label>
                                    <select
                                        className={cn(inputClass, "bg-muted/50 h-11 border-border focus:ring-primary dark:bg-slate-900 dark:text-foreground")}
                                        value={role}
                                        onChange={(e) => form.setValue("role", e.target.value as any)}
                                    >
                                        <option value="STUDENT" className="dark:bg-slate-900">Student</option>
                                        <option value="COMPANY" className="dark:bg-slate-900">Company Staff</option>
                                        <option value="PARENT" className="dark:bg-slate-900">Parent</option>
                                        <option value="STAFF" className="dark:bg-slate-900">College Staff</option>
                                    </select>
                                    <p className="text-[10px] text-muted-foreground ml-1">Select your primary role in the portal.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="fullName">Full Name <span className="text-destructive">*</span></label>
                                    <Input id="fullName" placeholder="John Doe" {...form.register("fullName")}
                                        className={cn("bg-muted/50 h-11 border-border focus:ring-primary", form.formState.errors.fullName ? "border-destructive ring-destructive/20" : "")} />
                                    <p className="text-[10px] text-muted-foreground ml-1">Used to generate your official username.</p>
                                    {form.formState.errors.fullName && <p className="text-xs font-medium text-destructive ml-1">{form.formState.errors.fullName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="username">Username <span className="text-destructive">*</span></label>
                                    <Input id="username" placeholder="johndoe123" {...form.register("username")}
                                        readOnly={['STUDENT', 'STAFF', 'COMPANY'].includes(role)}
                                        className={cn("bg-muted/50 h-11 border-border font-mono", ['STUDENT', 'STAFF', 'COMPANY'].includes(role) && "opacity-70 cursor-not-allowed")} />
                                    <p className="text-[10px] text-primary/70 font-medium ml-1">
                                        {role === 'STUDENT' && "Username will be generated based on your Name, Department & Batch."}
                                        {role === 'STAFF' && "Username will be generated based on your Name & Department."}
                                        {role === 'COMPANY' && "Username will be generated based on your Name & Company."}
                                        {role === 'PARENT' && "Choose a unique, permanent login ID for your account."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="email">Email <span className="text-destructive">*</span></label>
                                    <Input id="email" type="email" placeholder="m@example.com" {...form.register("email")}
                                        className={cn("bg-muted/50 h-11 border-border focus:ring-primary", form.formState.errors.email ? "border-destructive ring-destructive/20" : "")} />
                                    <p className="text-[10px] text-muted-foreground ml-1">Verification OTP will be sent here.</p>
                                    {form.formState.errors.email && <p className="text-xs font-medium text-destructive ml-1">{form.formState.errors.email.message}</p>}
                                </div>

                                {(role === 'STAFF' || role === 'STUDENT') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Department</label>
                                            <select
                                                className={cn(inputClass, "bg-muted/50 h-11 border-border dark:bg-slate-900 dark:text-foreground")}
                                                value={form.watch('department')}
                                                onChange={(e) => form.setValue("department", e.target.value)}
                                            >
                                                <option value="" className="dark:bg-slate-900">Select</option>
                                                {departments.map((d: any) => <option key={d.id || d._id} value={d.name} className="dark:bg-slate-900">{d.name}</option>)}
                                            </select>
                                        </div>
                                        {role === 'STUDENT' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Batch</label>
                                                <select
                                                    className={cn(inputClass, "bg-muted/50 h-11 border-border dark:bg-slate-900 dark:text-foreground")}
                                                    value={form.watch('batchYear')}
                                                    onChange={(e) => form.setValue("batchYear", e.target.value)}
                                                >
                                                    <option value="" className="dark:bg-slate-900">Year</option>
                                                    {Array.from({ length: 10 }, (_, i) => {
                                                        const year = new Date().getFullYear() - i;
                                                        return <option key={year} value={year.toString()} className="dark:bg-slate-900">{year}</option>
                                                    })}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {role === 'COMPANY' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Company</label>
                                            <select
                                                className={cn(inputClass, "bg-muted/50 h-11 border-border dark:bg-slate-900 dark:text-foreground")}
                                                value={form.watch('companyId')}
                                                onChange={(e) => form.setValue("companyId", e.target.value)}
                                            >
                                                <option value="" className="dark:bg-slate-900">Select Company</option>
                                                {companies.map((c: any) => <option key={c.id || c._id} value={c.id || c._id} className="dark:bg-slate-900">{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Working Email</label>
                                            <Input type="email" placeholder="hr@org.com" {...form.register("companyEmail")} className="bg-muted/50 h-11 border-border" />
                                        </div>
                                    </div>
                                )}

                                {role === 'PARENT' && (
                                    <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                                        <div className="space-y-2 relative">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Child Name</label>
                                            <Input placeholder="Type name..." value={studentSearchQuery} onChange={(e) => setStudentSearchQuery(e.target.value)} className="bg-background h-11 border-border" />
                                            {studentOptions.length > 0 && (
                                                <div className="absolute z-10 w-full bg-popover border border-border rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                                                    {studentOptions.map((s: any) => (
                                                        <div key={s.id || s._id} className="px-4 py-3 hover:bg-muted cursor-pointer text-sm border-b border-border/50 last:border-0" onClick={() => handleSelectStudent(s)}>
                                                            <div className="font-bold">{s.name}</div>
                                                            <div className="text-[10px] text-muted-foreground">{s.department} | {s.batchYear}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Child Contact</label>
                                            <Input {...form.register("studentContact")} placeholder="Phone number" className="bg-background h-11 border-border" />
                                        </div>
                                    </div>
                                )}

                                <Button type="button" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs mt-4 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" onClick={() => { if (canGoToStep2()) setShowConfirmModal(true); }}>
                                    Next Phase →
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                    <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Target Account:</p>
                                    <p className="text-sm font-medium opacity-90">{form.getValues('email')}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number <span className="text-destructive">*</span></label>
                                    <div className="flex gap-2">
                                        <Input type="tel" placeholder="9876543210" maxLength={10} value={form.watch('phoneNumber')} onChange={(e) => form.setValue('phoneNumber', e.target.value.replace(/\D/g, ''))} className="flex-1 h-11 bg-muted/50 border-border" disabled={phoneVerified} />
                                        {!phoneVerified && (
                                            <Button type="button" variant="outline" disabled={phoneOTPLoading || phoneCountdown > 0} onClick={handleSendPhoneOTP} className="h-11 border-border font-bold text-[10px] uppercase px-4 bg-background hover:bg-muted">
                                                {phoneCountdown > 0 ? `${phoneCountdown}s` : phoneOTPSent ? 'Resend' : 'Send'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {phoneOTPSent && !phoneVerified && (
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 text-center block">Verification Code</label>
                                        <div className="flex gap-2">
                                            <Input type="text" placeholder="••••••" maxLength={6} value={phoneOTPCode} onChange={(e) => setPhoneOTPCode(e.target.value.replace(/\D/g, ''))} className="flex-1 h-12 text-center text-xl tracking-[0.5em] font-black bg-muted/50 border-border" />
                                            <Button type="button" disabled={phoneOTPLoading || phoneOTPCode.length !== 6} onClick={handleVerifyPhoneOTP} className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
                                                {phoneOTPLoading ? '...' : 'Verify'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {phoneVerified && (
                                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">✓</div>
                                        <p className="text-xs font-bold uppercase tracking-wider">Account Identity Confirmed</p>
                                    </div>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 border-border font-bold uppercase text-[10px] tracking-widest hover:bg-muted transition-all">← Back</Button>
                                    <Button type="button" disabled={!phoneVerified} onClick={() => setStep(3)} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 transition-all">Continue →</Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Security Password <span className="text-destructive">*</span></label>
                                    <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} className="bg-muted/50 h-11 border-border focus:ring-primary" />
                                    {password && (
                                        <div className="space-y-2 px-1 py-1">
                                            <div className="flex gap-1.5">
                                                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i <= strength.score ? strength.color : "bg-muted")} />)}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className={strength.label === 'Weak' ? 'text-destructive' : strength.label === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}>{strength.label} Strength</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-muted/30 p-3 rounded-xl border border-border/50">
                                        <p className={cn("flex items-center gap-2", password?.length >= 8 ? 'text-emerald-500' : 'text-muted-foreground')}><span>{password?.length >= 8 ? '✓' : '○'}</span> 8+ Chars</p>
                                        <p className={cn("flex items-center gap-2", /[A-Z]/.test(password || '') ? 'text-emerald-500' : 'text-muted-foreground')}><span>{/[A-Z]/.test(password || '') ? '✓' : '○'}</span> Upper</p>
                                        <p className={cn("flex items-center gap-2", /[a-z]/.test(password || '') ? 'text-emerald-500' : 'text-muted-foreground')}><span>{/[a-z]/.test(password || '') ? '✓' : '○'}</span> Lower</p>
                                        <p className={cn("flex items-center gap-2", /[0-9]/.test(password || '') ? 'text-emerald-500' : 'text-muted-foreground')}><span>{/[0-9]/.test(password || '') ? '✓' : '○'}</span> Number</p>
                                    </div>
                                    {form.formState.errors.password && <p className="text-xs font-medium text-destructive ml-1">{form.formState.errors.password.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Repeat Password <span className="text-destructive">*</span></label>
                                    <Input id="confirmPassword" type="password" placeholder="••••••••" {...form.register("confirmPassword")} className="bg-muted/50 h-11 border-border focus:ring-primary" />
                                    {form.formState.errors.confirmPassword && <p className="text-xs font-medium text-destructive ml-1">{form.formState.errors.confirmPassword.message}</p>}
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-border font-bold uppercase text-[10px] tracking-widest hover:bg-muted active:scale-[0.98] transition-all">← Back</Button>
                                    <Button type="submit" disabled={isLoading} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all">
                                        {isLoading ? "Processing..." : "Complete Portal Entry"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-border/50 py-6 bg-muted/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Member already? <Link href="/login" className="text-primary hover:text-primary/80 transition-colors ml-1 underline decoration-2 underline-offset-4">Sign In</Link>
                    </p>
                </CardFooter>
            </Card>

            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="sm:max-w-md !bg-white dark:!bg-[#0a0f1c] text-foreground p-0 overflow-hidden rounded-2xl shadow-2xl border border-border z-[9999]">
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Identity Confirmation</DialogTitle>
                            <DialogDescription className="pt-3 text-sm font-medium leading-relaxed opacity-80">
                                Please review your data carefully. Portal identity cannot be modified after initial creation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center text-white shrink-0 text-xl">⚠️</div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-destructive leading-tight">Permanent Entry Warning: Record editing is restricted post-deployment.</p>
                        </div>
                    </div>
                    <DialogFooter className="bg-muted/30 p-4 flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1 h-11 border-border font-bold uppercase text-[10px] tracking-widest bg-background hover:bg-muted">Retract</Button>
                        <Button onClick={() => { setStep(2); setShowConfirmModal(false); }} className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Authorize</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// aria-label placeholder
