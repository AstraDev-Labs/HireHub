import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return {
        rules: {
            userAgent: '*',
            allow: [
                '/',
                '/companies',
                '/challenges',
                '/about',
                '/contact',
            ],
            disallow: [
                '/admin/',       // Private admin panels
                '/api/',         // Backend API routes
                '/profile/',     // Private user profiles
                '/dashboard/',   // Private user dashboards
                '/messages/',    // Private messaging
                '/resume-builder/', // Private tool
                '/students/',    // Faculty/Company restricted page
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
