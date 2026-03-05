import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://student.sulvatech.com';

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
