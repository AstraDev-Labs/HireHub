"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { MapPin, Trash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        if (user.role === 'COMPANY' && user.companyId) {
            router.replace(`/companies/${user.companyId}`);
            return;
        }
        fetchCompanies();
    }, [user, router]);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies');
            let data = res.data.data.companies;

            // If Company Staff, show only their company
            if (user?.role === 'COMPANY' && user.companyId) {
                data = data.filter((c: any) => c._id === user.companyId);
            }

            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm("Are you sure you want to delete this company?")) return;
        try {
            await api.delete(`/companies/${id}`);
            toast.success("Company deleted");
            fetchCompanies();
        } catch (error) {
            toast.error("Failed to delete company");
        }
    };

    if (loading || (user?.role === 'COMPANY' && user.companyId)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium animate-pulse">
                    {user?.role === 'COMPANY' ? 'Redirecting to your dashboard...' : 'Loading companies...'}
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Participating Companies</h1>
                {/* Show Add Button for Admin or if user is authorized (logic depends on requirements, usually Admin creates) */}
                {user?.role === 'ADMIN' && (
                    <Button onClick={() => router.push('/companies/new')}>
                        Add Company
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company: any) => (
                    <Card key={company._id} className="hover:shadow-lg transition-shadow cursor-pointer bg-card text-card-foreground border-border" onClick={() => router.push(`/companies/${company._id}`)}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl font-bold">{company.name}</CardTitle>
                                <Badge variant={company.hiringStatus === 'OPEN' ? 'default' : 'secondary'} className="uppercase tracking-wider">
                                    {company.hiringStatus}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="w-4 h-4 mr-1.5" /> {company.location || 'Remote'}
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                                Package: <span className="text-primary">{company.packageLpa} LPA</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Min CGPA: <span className="font-medium text-foreground">{company.minCgpa}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" className="w-full mr-2">
                                View Details
                            </Button>
                            {user?.role === 'ADMIN' && (
                                <Button variant="destructive" size="icon" onClick={(e) => handleDelete(e, company._id)}>
                                    <Trash className="w-4 h-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {companies.length === 0 && (
                <div className="text-center text-muted-foreground mt-12 animate-in fade-in duration-500">
                    No companies have been added yet.
                </div>
            )}
        </div>
    );
}

// aria-label placeholder
