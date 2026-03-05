import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Vui Studify \u2014 AI-Powered Study Platform',
        short_name: 'Vui Studify',
        description: 'Master any subject with AI-generated quizzes, flashcards, essay grading, and gamified study sessions.',
        start_url: '/',
        display: 'standalone',
        background_color: '#101022',
        theme_color: '#ea580c',
        icons: [
            {
                src: '/logo-favicon.png',
                sizes: '192x192 512x512',
                type: 'image/png',
            },
        ],
    };
}
