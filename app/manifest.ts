import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'VUI Studify \u2014 AI-Powered Study Platform',
        short_name: 'VUI Studify',
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
