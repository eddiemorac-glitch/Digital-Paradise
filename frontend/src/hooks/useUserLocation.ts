import { useState, useCallback, RefObject, useEffect } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

interface UseUserLocationReturn {
    userPos: [number, number] | null;
    isLocating: boolean;
    locateUser: (continuous?: boolean) => void;
    error: string | null;
}

export const useUserLocation = (mapRef: RefObject<L.Map | null>): UseUserLocationReturn => {
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    // Permission Check
    const checkPermissions = async () => {
        try {
            if (navigator.permissions && navigator.permissions.query) {
                const status = await navigator.permissions.query({ name: 'geolocation' as any });
                if (status.state === 'denied') {
                    toast.error('Acceso a ubicación denegado. Por favor, habilítalo en la configuración de su navegador.', {
                        duration: 5000,
                        position: 'top-center'
                    });
                    return false;
                }
            }
            return true;
        } catch (e) {
            return true; // Fallback to traditional error handling
        }
    };

    const handleSuccess = useCallback((position: GeolocationPosition, fly: boolean = true) => {
        const { latitude, longitude } = position.coords;
        const newPos: [number, number] = [latitude, longitude];
        setUserPos(newPos);
        setIsLocating(false);

        if (fly && mapRef.current) {
            mapRef.current.flyTo(newPos, 16, {
                duration: 2,
                easeLinearity: 0.25
            });
        }
    }, [mapRef]);

    const handleError = useCallback((err: GeolocationPositionError) => {
        console.error('Geolocation error:', err);
        let msg = 'No se pudo determinar la ubicación';
        if (err.code === 1) msg = 'Permiso de ubicación denegado';
        if (err.code === 3) msg = 'Tiempo de espera agotado';

        setError(msg);
        setIsLocating(false);
        toast.error(msg);
    }, []);

    const locateUser = useCallback(async (continuous: boolean = false) => {
        if (!mapRef.current || !navigator.geolocation) {
            setError('Geolocalización no soportada o mapa no listo');
            return;
        }

        const hasPermission = await checkPermissions();
        if (!hasPermission) return;

        setIsLocating(true);
        setError(null);

        // Clear existing watch if any
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }

        if (continuous) {
            const id = navigator.geolocation.watchPosition(
                (pos) => handleSuccess(pos, false), // Don't fly every time it updates
                handleError,
                { enableHighAccuracy: true, maximumAge: 0 }
            );
            setWatchId(id);
        } else {
            navigator.geolocation.getCurrentPosition(
                (pos) => handleSuccess(pos, true),
                handleError,
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, [mapRef, watchId, handleSuccess, handleError]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [watchId]);

    return { userPos, isLocating, locateUser, error };
};
