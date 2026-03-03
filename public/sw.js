self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const title = data.title || 'Study Reminder';
    const options = {
        body: data.body || 'Time for your daily study session!',
        icon: '/logo.png', // Fallback to a logo if available
        badge: '/logo.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
