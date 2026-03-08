import { Metadata, ResolvingMetadata } from 'next';
import api from '@/lib/api'; // Note: Server components can't use an axios instance with interceptors easily if it relies on localStorage/cookies directly in the config.

// Using standard fetch since this runs on the server before the client loads.
async function getCompany(id: string) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${backendUrl}/companies/${id}`, { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data.company;
    } catch (error) {
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: { id: string } },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const company = await getCompany(params.id);

    if (!company) {
        return { title: 'Company Not Found' };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${company.name} Careers & Placements`,
        description: `Apply for roles at ${company.name}. Offering ${company.packageLpa} LPA for ${company.jobRoles.join(', ')}.`,
        openGraph: {
            title: `Careers at ${company.name} | HireHub`,
            description: `Recruitment drive for ${company.name}. Open roles: ${company.jobRoles.join(', ')}. Package: ${company.packageLpa} LPA.`,
            images: [...previousImages], // Add specific company logo URL here later if available
        },
    };
}

export default async function CompanyLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
    const company = await getCompany(params.id);

    if (!company) {
        return <>{children}</>;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Structured Data for the specific company
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: company.name,
        description: company.description,
        url: company.website,
        email: company.email,
        sameAs: company.website ? [company.website] : []
    };

    // If hiring is open, we can also add a JobPosting schema overview
    const jobPostingSchema = company.hiringStatus === 'OPEN' ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: `Software Roles at ${company.name}`,
        description: company.description || `Hiring multiple roles including ${company.jobRoles.join(', ')}`,
        datePosted: new Date().toISOString().split('T')[0], // Approximation unless we track exact date
        validThrough: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        employmentType: 'FULL_TIME',
        hiringOrganization: {
            '@type': 'Organization',
            name: company.name,
            sameAs: company.website
        },
        jobLocation: company.location.map((loc: string) => ({
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: loc,
            }
        })),
        baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'INR',
            value: {
                '@type': 'QuantitativeValue',
                value: company.packageLpa * 100000,
                unitText: 'YEAR'
            }
        }
    } : null;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {jobPostingSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
                />
            )}
            {children}
        </>
    );
}
