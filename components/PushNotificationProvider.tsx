'use client';

import { useEffect } from 'react';

export default function PushNotificationProvider() {
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            // Register service worker if it isn't already
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered globally with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return null;
}
