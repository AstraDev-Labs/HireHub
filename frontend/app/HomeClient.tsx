"use client";

/* UX: label placeholder aria-label */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, CheckCircle, Users, Building2, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function HomeClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen -mt-8 md:-mt-0">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-Gen Campus Placement System
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
              Empowering Careers with <span className="bg-gradient-to-r from-primary to-primary/60 text-transparent bg-clip-text">HireHub</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 max-w-2xl mx-auto">
              Join 10,000+ students and top companies on the most advanced campus management platform. 
              Streamlined registration, direct applications, and real-time tracking.
            </p>
            
            <div className="flex flex-col sm:sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <Link href="/register">
                <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/25 hover:scale-105 transition-all" aria-label="Register for HireHub">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold hover:bg-muted/50 transition-all" aria-label="Login to HireHub">
                  Existing User Login
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse delay-700"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-500" />}
              title="Student Portal"
              description="Manage your profile, resumes, and applications with ease."
            />
            <FeatureCard 
              icon={<Building2 className="h-8 w-8 text-emerald-500" />}
              title="Company Portal"
              description="Host drives, conduct interviews, and hire top talent."
            />
            <FeatureCard 
              icon={<Briefcase className="h-8 w-8 text-orange-500" />}
              title="Placement Drives"
              description="Real-time access to the latest placement opportunities."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-8 w-8 text-primary" />}
              title="Result Tracking"
              description="Instant updates on round progress and final selections."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group lg:min-h-[250px] flex flex-col justify-center">
      <div className="p-3 rounded-xl bg-muted w-fit mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed max-w-prose">{description}</p>
    </div>
  );
}
