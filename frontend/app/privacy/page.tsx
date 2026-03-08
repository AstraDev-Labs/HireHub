import { Metadata } from 'next';
import { Shield, Lock, Eye, FileText, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Privacy Policy | HireHub - Campus Placement Management System',
    description: 'Privacy Policy for HireHub. Learn how we handle applicant data protection, SaaS privacy, and ensure data security in our campus recruitment software.',
    keywords: 'HireHub privacy, campus recruitment software privacy, applicant data protection, SaaS compliance, placement portal data security',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12 px-4 md:px-8">
            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Privacy Policy - HireHub",
                        "description": "HireHub Privacy Policy regarding student and recruiter data protection in our SaaS campus placement portal.",
                        "url": "https://hirehub.example.com/privacy",
                        "publisher": {
                            "@type": "Organization",
                            "name": "HireHub",
                            "logo": "https://hirehub.example.com/logo.png"
                        }
                    })
                }}
            />

            <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center text-primary hover:underline gap-2 font-medium">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground flex items-center gap-4">
                            <Shield className="w-12 h-12 text-primary" />
                            Privacy Policy
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Effective Date: March 8, 2026. Your trust is our priority. This document outlines how we protect and manage your data within our SaaS campus recruitment platform.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Lock, title: "Data Security", text: "Enterprise-grade encryption for all PII." },
                        { icon: Eye, title: "Transparency", text: "Clear disclosure of all data processing." },
                        { icon: FileText, title: "Compliance", text: "Adhering to GDPR and local data laws." }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                            <item.icon className="w-8 h-8 text-primary" />
                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <p className="text-muted-foreground text-sm uppercase tracking-wide font-medium">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold border-b border-primary/20 pb-2">1. Information We Collect</h2>
                        <p>
                            To provide an efficient <strong>campus recruitment management system</strong>, we collect information necessary for placement processing:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Student Data:</strong> Name, contact details, academic records, and resumes.</li>
                            <li><strong>Recruiter Information:</strong> Company details, job descriptions, and hiring preferences.</li>
                            <li><strong>System Logs:</strong> Device info and access logs (IP addresses are redacted for privacy).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold border-b border-primary/20 pb-2">2. How We Use Your Data</h2>
                        <p>
                            As a leading <strong>SaaS placement portal</strong>, your data is used exclusively for:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Facilitating recruitment drives and interview scheduling.</li>
                            <li>Generating placement statistics and reports for university staff.</li>
                            <li>Improving platform performance and security monitoring.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold border-b border-primary/20 pb-2">3. Data Retention & Protection</h2>
                        <p>
                            We implement strict <strong>applicant data protection</strong> protocols. Data is stored on secure cloud servers with restricted access. Personal data is retained only as long as necessary for the recruitment lifecycle or as required by institutional policy.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold border-b border-primary/20 pb-2">4. Support & Contact</h2>
                        <p>
                            If you have questions about our privacy practices or wish to exercise your data rights, please contact our support team:
                        </p>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border group-hover:border-primary/30 transition-colors">
                            <Mail className="h-5 w-5 text-primary" />
                            <span className="font-medium text-foreground">hirehubedu@gmail.com</span>
                        </div>
                    </section>
                </div>

                <div className="pt-12 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; 2026 HireHub. All rights reserved. <br className="md:hidden" />
                        Built for Educational Excellence and Data Integrity.
                    </p>
                </div>
            </div>
        </div>
    );
}
