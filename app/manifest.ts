import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'VUI Studify',
        short_name: 'VUI Studify',
        description: 'AI-Powered Study Platform',
        start_url: '/',
        display: 'standalone',
        background_color: '#050510',
        theme_color: '#1a5c2a',
        icons: [
            {
                src: '/logo-favicon.png?v=2',
                sizes: 'any',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/logo-favicon.png?v=2',
                sizes: 'any',
                type: 'image/png',
                purpose: 'any',
            },
        ],
    };
}
