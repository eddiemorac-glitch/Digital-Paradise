import { useEffect } from 'react';
import { toast } from 'sonner';

export const VersionCheck = () => {
    useEffect(() => {
        const checkVersion = async () => {
            try {
                // Bypass cache for version check
                const response = await fetch('/version.json?t=' + new Date().getTime(), {
                    cache: 'no-store'
                });
                const data = await response.json();
                const latestVersion = data.version;
                const currentVersion = localStorage.getItem('app_version');

                if (currentVersion && currentVersion !== latestVersion) {
                    toast.info('Actualizando aplicación...', { duration: 5000 });

                    // Nuke Service Worker caches
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // Update version and reload
                    localStorage.setItem('app_version', latestVersion);

                    // Force hard reload
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else if (!currentVersion) {
                    // First time, just set it
                    localStorage.setItem('app_version', latestVersion);
                }
            } catch (error) {
                console.error('Failed to check version', error);
            }
        };

        checkVersion();

        // Check on visibility change (when user comes back to tab)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
            }
        });

    }, []);

    return null;
};
