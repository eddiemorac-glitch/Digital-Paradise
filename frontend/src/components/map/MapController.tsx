import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapControllerProps {
    onMapReady?: () => void;
    mapRef: React.MutableRefObject<L.Map | null>;
    setZoom: (z: number) => void;
    setCenter: (c: [number, number]) => void;
    triggerRefresh: () => void;
}

export const MapController: React.FC<MapControllerProps> = ({
    onMapReady,
    mapRef,
    setZoom,
    setCenter,
    triggerRefresh
}) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        mapRef.current = map;

        // Force invalidate size to fix initialization issues in hidden containers
        map.invalidateSize();

        // Add custom panes
        if (!map.getPane('weatherPane')) {
            map.createPane('weatherPane');
            map.getPane('weatherPane')!.style.zIndex = '600';
            map.getPane('weatherPane')!.style.pointerEvents = 'none';
        }

        // Setup handlers
        const onZoom = () => setZoom(map.getZoom());
        const onMove = () => {
            const c = map.getCenter();
            setCenter([c.lat, c.lng]);
            triggerRefresh(); // Debounce might be managed by triggerRefresh implementation or parent
        };

        map.on('zoomend', onZoom);
        map.on('moveend', onMove);

        // TRIGGER INITIAL SYNC: Mandatory for marker visibility on first load
        // Use a small timeout to ensure the map container is stable
        const initialSyncTimeout = setTimeout(() => {
            triggerRefresh();
        }, 1000);

        onMapReady?.();

        return () => {
            clearTimeout(initialSyncTimeout);
            map.off('zoomend', onZoom);
            map.off('moveend', onMove);
            mapRef.current = null;
        };
    }, [map, onMapReady, setZoom, setCenter, mapRef, triggerRefresh]);

    return null;
};
