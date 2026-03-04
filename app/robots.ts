import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://student-forge.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/api/',
                '/settings/',
                '/gamifier/',
                '/generator/',
                '/history/',
                '/resources/',
                '/profile/'
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
