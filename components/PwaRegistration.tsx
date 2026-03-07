'use client';

import { useEffect } from 'react';

export default function PwaRegistration() {
    useEffect(() => {
        // Check if the browser supports service workers
        if ('serviceWorker' in navigator && typeof window !== 'undefined') {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('[PWA] Service Worker registered with scope:', registration.scope);
                    })
                    .catch((error) => {
                        console.error('[PWA] Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    // This component doesn't render anything visible
    return null;
}
