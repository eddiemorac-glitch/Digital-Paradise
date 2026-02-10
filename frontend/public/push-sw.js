/* eslint-disable no-undef */
// Phase 18: Operational Intelligence - Push Notification Service Worker

self.addEventListener('push', (event) => {
    if (event.data) {
        const payload = event.data.json();
        const options = {
            body: payload.body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [100, 50, 100],
            data: {
                url: payload.data?.actionLink || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(payload.title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
