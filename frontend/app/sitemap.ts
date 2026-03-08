import { MetadataRoute } from 'next';

// Define the structure since we can't easily share the mongoose models here in Edge
interface Company { _id: string; updatedAt?: string; }
interface Challenge { _id: string; updatedAt?: string; }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Static Routes
    const staticRoutes = [
        '',
        '/login',
        '/register',
        '/about',
        '/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        // Fetch Public Companies
        const companiesRes = await fetch(`${backendUrl}/companies/public`, { next: { revalidate: 3600 } });
        let companyRoutes: MetadataRoute.Sitemap = [];
        if (companiesRes.ok) {
            const data = await companiesRes.json();
            const companies: Company[] = data.data.companies || [];
            companyRoutes = companies.map((company) => ({
                url: `${baseUrl}/companies/${company._id}`,
                lastModified: company.updatedAt || new Date().toISOString(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }));
        }

        // Fetch Public Challenges
        const challengesRes = await fetch(`${backendUrl}/challenges`, { next: { revalidate: 3600 } });
        let challengeRoutes: MetadataRoute.Sitemap = [];
        if (challengesRes.ok) {
            const data = await challengesRes.json();
            const challenges: Challenge[] = data.data.challenges || [];
            challengeRoutes = challenges.map((challenge) => ({
                url: `${baseUrl}/challenges/${challenge._id}`,
                lastModified: challenge.updatedAt || new Date().toISOString(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
        }

        return [...staticRoutes, ...companyRoutes, ...challengeRoutes];
    } catch (error) {
        console.error("Sitemap generation failed:", error);
        // Fallback to static routes if dynamic fetching fails
        return staticRoutes; 
    }
}
