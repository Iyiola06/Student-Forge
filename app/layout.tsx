import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css'; // Global styles
import PushNotificationProvider from '@/components/PushNotificationProvider';
import { UploadProgressProvider } from '@/components/providers/UploadProgressProvider';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://student-forge.vercel.app'),
  title: {
    default: 'StudyForge — AI-Powered Study Platform',
    template: '%s | StudyForge',
  },
  description: 'Master any subject with AI-generated quizzes, flashcards, essay grading, and gamified study sessions. Built for students preparing for WAEC, JAMB, and university exams.',
  keywords: ['study', 'AI tutor', 'flashcards', 'quiz generator', 'essay grading', 'WAEC', 'JAMB', 'exam prep', 'Nigeria education', 'StudyForge'],
  authors: [{ name: 'StudyForge Team' }],
  openGraph: {
    title: 'StudyForge — AI-Powered Study Platform',
    description: 'Master any subject with AI-generated quizzes, flashcards, essay grading, and gamified study sessions.',
    url: '/',
    siteName: 'StudyForge',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/images/logo.png', width: 512, height: 512, alt: 'StudyForge Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyForge — AI-Powered Study Platform',
    description: 'Master any subject with AI-generated quizzes, flashcards, and gamified study sessions.',
    images: ['/images/logo.png'],
  },
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('theme');
                  var isDark = localTheme === 'dark' || (!localTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="font-display antialiased main-bg">
        <PushNotificationProvider />
        <UploadProgressProvider>
          {children}
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </UploadProgressProvider>
      </body>
    </html>
  );
}
