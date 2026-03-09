import { MetadataRoute } from 'next';

// Define the structure since we can't easily share the mongoose models here in Edge
interface Company { _id: string; updatedAt?: string; }
interface Challenge { _id: string; updatedAt?: string; }

interface CompaniesApiResponse {
    data?: {
        companies?: Company[];
    };
}

interface ChallengesApiResponse {
    data?: {
        challenges?: Challenge[];
    };
}

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
        let companiesRes: Response | null = null;
        try {
            companiesRes = await fetch(`${backendUrl}/companies/public`, { 
                next: { revalidate: 3600 },
                headers: { 'Accept': 'application/json' }
            });
        } catch (e) {
            console.error("Network error while fetching public companies:", e);
        }
        
        let companyRoutes: MetadataRoute.Sitemap = [];
        if (companiesRes && companiesRes.ok && companiesRes.headers.get('content-type')?.includes('application/json')) {
            try {
                const json: CompaniesApiResponse = await companiesRes.json();
                const companies: Company[] = json.data?.companies ?? [];
                companyRoutes = companies.map((company) => ({
                    url: `${baseUrl}/companies/${company._id}`,
                    lastModified: company.updatedAt || new Date().toISOString(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                }));
            } catch (e) {
                console.error(
                    `Failed to parse companies JSON from ${backendUrl}/companies/public (status: ${companiesRes.status}):`,
                    e
                );
            }
        }

        // Fetch Public Challenges
        let challengesRes: Response | null = null;
        try {
            challengesRes = await fetch(`${backendUrl}/challenges`, { 
                next: { revalidate: 3600 },
                headers: { 'Accept': 'application/json' }
            });
        } catch (e) {
            console.error("Network error while fetching challenges:", e);
        }
        
        let challengeRoutes: MetadataRoute.Sitemap = [];
        if (challengesRes && challengesRes.ok && challengesRes.headers.get('content-type')?.includes('application/json')) {
            try {
                const json: ChallengesApiResponse = await challengesRes.json();
                const challenges: Challenge[] = json.data?.challenges ?? [];
                challengeRoutes = challenges.map((challenge) => ({
                    url: `${baseUrl}/challenges/${challenge._id}`,
                    lastModified: challenge.updatedAt || new Date().toISOString(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.7,
                }));
            } catch (e) {
                console.error(
                    `Failed to parse challenges JSON from ${backendUrl}/challenges (status: ${challengesRes.status}):`,
                    e
                );
            }
        }

        return [...staticRoutes, ...companyRoutes, ...challengeRoutes];
    } catch (error) {
        console.error("Sitemap generation caught top-level error:", error);
        // Fallback to static routes if dynamic fetching fails
        return staticRoutes; 
    }
}

