import { MetadataRoute } from 'next';

// Define the structure since we can't easily share the mongoose models here in Edge
interface Company { _id: string; updatedAt?: string; }

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
        const companiesRes = await fetch(`${backendUrl}/companies/public`, { 
            next: { revalidate: 3600 },
            headers: { 'Accept': 'application/json' }
        });
        
        let companyRoutes: MetadataRoute.Sitemap = [];
        if (companiesRes.ok && companiesRes.headers.get('content-type')?.includes('application/json')) {
            try {
                const data = await companiesRes.json();
                const companies: Company[] = data.data?.companies || [];
                companyRoutes = companies.map((company) => ({
                    url: `${baseUrl}/companies/${company._id}`,
                    lastModified: company.updatedAt || new Date().toISOString(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                }));
            } catch (e) {
                console.error("Failed to parse companies JSON:", e);
            }
        }
        return [...staticRoutes, ...companyRoutes];
    } catch (error) {
        console.error("Sitemap generation caught top-level error:", error);
        // Fallback to static routes if dynamic fetching fails
        return staticRoutes; 
    }
}
