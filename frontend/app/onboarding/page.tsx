"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const [role, setRole] = useState('');
    const [department, setDepartment] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [studentName, setStudentName] = useState('');
    const [studentContact, setStudentContact] = useState('');
    const [fullName, setFullName] = useState('');
    const [batchYear, setBatchYear] = useState('');

    useEffect(() => {
        if (user?.fullName && !fullName) {
            setFullName(user.fullName);
        }
    }, [user]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [allCompanies, setAllCompanies] = useState<any[]>([]);
    const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

    useEffect(() => {
        if (role === 'COMPANY' && allCompanies.length === 0) {
            api.get('/companies').then(res => setAllCompanies(res.data.data?.companies || [])).catch(e => console.error(e));
        }
    }, [role]);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStudentName(value);
        setShowDropdown(true);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        if (!value) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/students/search?query=${value}`);
                setSearchResults(res.data.data?.students || []);
            } catch (err) {
                console.error("Search error", err);
            }
        }, 300);
    };

    const handleCompanySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCompanyName(value);
        setShowCompanyDropdown(true);

        if (!value) {
            setCompanySearchResults([]);
            return;
        }

        const filtered = allCompanies.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
        setCompanySearchResults(filtered);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!role) {
            toast.error("Please select a role to continue.");
            return;
        }

        if ((role === 'STUDENT' || role === 'STAFF') && !department) {
            toast.error("Please select your department.");
            return;
        }

        if (role === 'STUDENT' && (!batchYear || !fullName)) {
            toast.error("Please provide your full name and batch year.");
            return;
        }

        if (role === 'STAFF' && !fullName) {
            toast.error("Please provide your full name.");
            return;
        }

        if (role === 'COMPANY' && !fullName) {
            toast.error("Please provide your full name.");
            return;
        }

        if (role === 'PARENT' && (!studentName || !studentContact)) {
            toast.error("Please provide your child's details.");
            return;
        }

        setIsLoading(true);
        try {
            await api.patch('/users/onboard', {
                role,
                department: role === 'STUDENT' || role === 'STAFF' ? department : undefined,
                batchYear: role === 'STUDENT' ? parseInt(batchYear) : undefined,
                fullName: (role === 'STUDENT' || role === 'STAFF' || role === 'COMPANY') ? fullName : undefined,
                phoneNumber,
                companyName: role === 'COMPANY' ? companyName : undefined,
                studentName: role === 'PARENT' ? studentName : undefined,
                studentContact: role === 'PARENT' ? studentContact : undefined,
            });
            
            toast.success("Profile setup complete!");
            await refreshUser(); // This should fetch the updated user with role and approvalStatus
            router.push('/pending-approval');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to complete onboarding.");
        } finally {
            setIsLoading(false);
        }
    };
    let generatedUsername = '';
    if (fullName && (role === 'STUDENT' || role === 'STAFF')) {
        // Helper to format name: moves initials (single letters or dotted letters) to the end
        const formatName = (name: string) => {
            let parts = name.trim().split(/\s+/);
            let initials: string[] = [];
            let nameWords: string[] = [];
            
            for (let p of parts) {
                let cleanP = p.replace(/\./g, '');
                if (cleanP.length === 1 || p.includes('.')) {
                    let subInitials = p.split('.').filter(x => x.length > 0);
                    initials.push(...subInitials);
                } else {
                    nameWords.push(cleanP);
                }
            }
            return [...nameWords, ...initials].map(x => x.toUpperCase()).join('-');
        };

        const namePart = formatName(fullName);
        const deptMatch = department ? department.match(/\(([^)]+)\)/) : null;
        const deptStr = department ? (deptMatch ? deptMatch[1].toUpperCase() : department.toUpperCase().replace(/\s+/g, '-')) : 'DEPT';
        
        if (role === 'STUDENT') {
            generatedUsername = `${namePart}-${deptStr}-${batchYear || 'YEAR'}`;
        } else if (role === 'STAFF') {
            generatedUsername = `${namePart}-${deptStr}-STAFF`;
        }
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-0">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                    <CardDescription>
                        Welcome, {user.fullName}! Please select your role to continue setting up your HireHub account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="role">I am a...</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STUDENT">Student</SelectItem>
                                    <SelectItem value="COMPANY">Company Recruiter</SelectItem>
                                    <SelectItem value="STAFF">College Staff / Faculty</SelectItem>
                                    <SelectItem value="PARENT">Parent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        placeholder="Enter your phone number" 
                                        value={phoneNumber} 
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required 
                                    />
                                </div>

                                {(role === 'STUDENT' || role === 'STAFF') && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name (including initials)</Label>
                                            <Input 
                                                id="fullName" 
                                                placeholder="e.g. John Doe" 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)}
                                                required 
                                            />
                                            <p className="text-xs text-gray-500">This will be used to generate your username.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                        <Select value={department} onValueChange={setDepartment} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select your department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Computer Science and Engineering (CSE)">Computer Science and Engineering (CSE)</SelectItem>
                                                <SelectItem value="Information Technology (IT)">Information Technology (IT)</SelectItem>
                                                <SelectItem value="Electronics and Communication Engineering (ECE)">Electronics and Communication Engineering (ECE)</SelectItem>
                                                <SelectItem value="Electrical and Electronics Engineering (EEE)">Electrical and Electronics Engineering (EEE)</SelectItem>
                                                <SelectItem value="Mechanical Engineering (MECH)">Mechanical Engineering (MECH)</SelectItem>
                                                <SelectItem value="Civil Engineering (CIVIL)">Civil Engineering (CIVIL)</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {role === 'STUDENT' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="batchYear">Batch Year</Label>
                                            <Select value={batchYear} onValueChange={setBatchYear} required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select your graduating year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="2024">2024</SelectItem>
                                                    <SelectItem value="2025">2025</SelectItem>
                                                    <SelectItem value="2026">2026</SelectItem>
                                                    <SelectItem value="2027">2027</SelectItem>
                                                    <SelectItem value="2028">2028</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {generatedUsername && (
                                        <div className="p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-200 mt-4 animate-in fade-in">
                                            <strong>Preview Generated Username:</strong><br />
                                            <span className="font-mono text-base">{generatedUsername}</span>
                                        </div>
                                    )}
                                    </>
                                )}

                                {role === 'COMPANY' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Recruiter Name</Label>
                                            <Input 
                                                id="fullName" 
                                                placeholder="e.g. Jane Doe" 
                                                value={fullName} 
                                                onChange={(e) => setFullName(e.target.value)}
                                                required 
                                            />
                                        </div>
                                        <div className="space-y-2 relative">
                                            <Label htmlFor="companyName">Company Name</Label>
                                        <Input 
                                            id="companyName" 
                                            placeholder="e.g. Google, Amazon (Type to search)" 
                                            value={companyName} 
                                            onChange={handleCompanySearchChange}
                                            onFocus={() => {
                                                if (companyName) {
                                                    const filtered = allCompanies.filter(c => c.name.toLowerCase().includes(companyName.toLowerCase()));
                                                    setCompanySearchResults(filtered);
                                                }
                                                setShowCompanyDropdown(true);
                                            }}
                                            onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                                            required 
                                        />
                                        {showCompanyDropdown && companySearchResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border max-h-60 overflow-auto">
                                                {companySearchResults.map((comp) => (
                                                    <div
                                                        key={comp._id}
                                                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                                        onClick={() => {
                                                            setCompanyName(comp.name);
                                                            setShowCompanyDropdown(false);
                                                        }}
                                                    >
                                                        {comp.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        </div>
                                    </>
                                )}

                                {role === 'PARENT' && (
                                    <>
                                        <div className="space-y-2 relative">
                                            <Label htmlFor="studentName">Child's Full Name</Label>
                                            <Input 
                                                id="studentName" 
                                                placeholder="e.g. John Doe (Type to search)" 
                                                value={studentName} 
                                                onChange={handleSearchChange}
                                                onFocus={() => {
                                                    if (searchResults.length > 0) setShowDropdown(true);
                                                }}
                                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                                autoComplete="off"
                                                required 
                                            />
                                            {showDropdown && searchResults.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                                    {searchResults.map((student) => (
                                                        <div 
                                                            key={student.id} 
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                            onClick={() => {
                                                                setStudentName(student.name);
                                                                setStudentContact(student.phone || student.email || '');
                                                                setShowDropdown(false);
                                                            }}
                                                        >
                                                            <div className="font-medium text-gray-900">{student.name}</div>
                                                            <div className="text-xs text-gray-500">{student.department} • {student.email}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="studentContact">Child's Phone Number or Email</Label>
                                            <Input 
                                                id="studentContact" 
                                                placeholder="Enter contact details" 
                                                value={studentContact} 
                                                onChange={(e) => setStudentContact(e.target.value)}
                                                required 
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={!role || isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Profile...</>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
