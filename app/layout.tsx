import type { Metadata, Viewport } from 'next';
import { Lexend } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css'; // Global styles
import PushNotificationProvider from '@/components/PushNotificationProvider';
import { UploadProgressProvider } from '@/components/providers/UploadProgressProvider';
import PwaRegistration from '@/components/PwaRegistration';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#1a5c2a',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://student.sulvatech.com'),
  title: {
    default: 'VUI Studify',
    template: '%s | VUI Studify',
  },
  description: 'Master any subject with AI-generated quizzes, flashcards, essay grading, and gamified study sessions. Built for students preparing for WAEC, JAMB, and university exams.',
  keywords: ['study', 'AI tutor', 'flashcards', 'quiz generator', 'essay grading', 'WAEC', 'JAMB', 'exam prep', 'Nigeria education', 'VUI Studify'],
  authors: [{ name: 'VUI Studify Team' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VUI Studify',
  },
  openGraph: {
    title: 'VUI Studify',
    description: 'Master any subject with AI-generated quizzes, flashcards, essay grading, and gamified study sessions.',
    url: '/',
    siteName: 'VUI Studify',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/logo-dark.png', width: 512, height: 512, alt: 'VUI Studify Logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VUI Studify',
    description: 'Master any subject with AI-generated quizzes, flashcards, and gamified study sessions.',
    images: ['/logo-dark.png'],
  },
  icons: {
    icon: '/logo-favicon.png',
    apple: '/logo-favicon.png',
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
        <PwaRegistration />
        <PwaInstallPrompt />
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
