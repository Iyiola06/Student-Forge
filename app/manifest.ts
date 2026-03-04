import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'StudyForge \u2014 AI-Powered Study Platform',
        short_name: 'StudyForge',
        description: 'Master any subject with AI-generated quizzes, flashcards, essay grading, and gamified study sessions.',
        start_url: '/',
        display: 'standalone',
        background_color: '#101022',
        theme_color: '#ea580c',
        icons: [
            {
                src: '/images/logo.png',
                sizes: '192x192 512x512',
                type: 'image/png',
            },
        ],
    };
}
