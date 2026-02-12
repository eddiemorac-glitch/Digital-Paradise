import React, { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Event as EventData } from '../../types/event';
import { EVENT_TYPE_CONFIG, getEventTypeFromCategory } from '../../types/event-type-config';
import { getEventMarkerHTML } from '../../hooks/map/useEventMarkers';

import { useLanguageStore } from '../../store/languageStore';

interface SingleEventMarkerProps {
    event: EventData;
    lat: number;
    lng: number;
    isHero: boolean;
    zoom: number;
    onSelect: (event: EventData) => void;
    onHover: (id: string | null) => void;
}

export const SingleEventMarker = React.memo(({
    event,
    lat,
    lng,
    isHero,
    zoom,
    onSelect,
    onHover
}: SingleEventMarkerProps) => {
    const { t } = useLanguageStore();

    // Memoize the icon creation so it doesn't run on every render unless visual props change
    const icon = useMemo(() => {
        const category = event.category || 'other';
        const eventType = event.type || getEventTypeFromCategory(category);
        const config = EVENT_TYPE_CONFIG[eventType as keyof typeof EVENT_TYPE_CONFIG] || EVENT_TYPE_CONFIG.social;

        const color = (event as any).computedColor || config.color;
        const isUrgent = (event as any).isUrgent || false;

        return L.divIcon({
            html: getEventMarkerHTML(event, color, isHero, zoom, t, isUrgent),
            className: 'custom-div-icon event-marker-system',
            iconSize: [0, 0],
            iconAnchor: [0, 0],
            popupAnchor: [0, -20]
        });
    }, [event, isHero, zoom, t]);

    return (
        <Marker
            position={[lat, lng]}
            icon={icon}
            zIndexOffset={isHero ? 1000 : 0} // Hero always on top
            eventHandlers={{
                click: () => onSelect(event),
                mouseover: () => onHover(event.id),
                mouseout: () => onHover(null)
            }}
        />
    );
}, (prev, next) => {
    // Custom comparison function for React.memo
    if (prev.isHero !== next.isHero) return false;

    // Check Zoom LOD thresholds
    const prevLOD = prev.zoom < 14 ? 0 : prev.zoom < 15 ? 1 : 2;
    const nextLOD = next.zoom < 14 ? 0 : next.zoom < 15 ? 1 : 2;
    if (prevLOD !== nextLOD) return false;

    if (prev.event !== next.event) return false;

    return true;
});

SingleEventMarker.displayName = 'SingleEventMarker';
