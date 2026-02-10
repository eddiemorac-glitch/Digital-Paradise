import { useState, useCallback } from 'react';
import { useLocationStore } from '../store/locationStore';
import { toast } from 'sonner';

export const useLocation = () => {
    const { latitude, longitude, address, setLocation, setAddress } = useLocationStore();
    const [isDetecting, setIsDetecting] = useState(false);

    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Tu navegador no soporta geolocalización.');
            return;
        }

        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                // For a real production app, we would use a reverse geocoding API here
                // For now, we set a default descriptive address or keep it empty
                setLocation(lat, lng, address || 'Ubicación Detectada', true);
                setIsDetecting(false);
                toast.success('Ubicación detectada correctamente.');
            },
            (error) => {
                console.error('Error detecting location:', error);
                setIsDetecting(false);
                let msg = 'No pudimos detectar tu ubicación.';
                if (error.code === 1) msg = 'Permiso de ubicación denegado.';
                toast.error(msg);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    }, [setLocation, address]);

    return {
        latitude,
        longitude,
        address,
        isDetecting,
        detectLocation,
        setAddress
    };
};
