import { useMemo } from 'react';
import { EventData } from '../../types/map';
import { NEON_ARTS } from '../../assets/map-icons';
import { AVATAR_SVG_CONTENT } from '../../assets/avatar-svgs';
import { EVENT_TYPE_CONFIG, getEventTypeFromCategory } from '../../types/event-type-config';


interface UseEventMarkersProps {
    allEvents: EventData[];
    showEvents: boolean;
    zoom: number;
    hoveredEventId: string | null;
    onSelectEvent: (event: EventData) => void;
    onHoverEvent: (id: string | null) => void;
}

export const getEventMarkerHTML = (
    event: EventData,
    color: string,
    isHero: boolean,
    zoom: number,
    isUrgent: boolean = false
): string => {
    const category = (event.category || event.type || 'other').toUpperCase();

    // Phase 22: Use Avatar if available, otherwise fallback to Neon Art
    let art = '';
    if (event.avatarId && AVATAR_SVG_CONTENT[event.avatarId]) {
        art = AVATAR_SVG_CONTENT[event.avatarId](color);
    } else {
        art = NEON_ARTS[category] ? NEON_ARTS[category](color) : NEON_ARTS.OTHER(color);
    }

    const adTier = (event.adTier || 'BRONZE').toUpperCase();
    const adSize = (event.adSize || 'SMALL').toUpperCase();

    const isGold = adTier === 'GOLD';
    const isSilver = adTier === 'SILVER';

    const tierScale = isGold ? 1.6 : isSilver ? 1.3 : 1.0;
    const sizeMultiplier = adSize === 'LARGE' ? 1.5 : adSize === 'MEDIUM' ? 1.25 : 1.0;
    const zoomScale = Math.max(0.7, Math.pow(1.15, zoom - 15)) * sizeMultiplier * tierScale;

    // Deterministic Animation Seed from ID
    const seed = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const floatDuration = (3 + (seed % 20) / 10) + 's';
    const pulseDuration = (2 + (seed % 10) / 5) + 's';

    // TDT: Only render complex 3D elements if zoom is high enough to see them
    const isHighLOD = zoom >= 14;

    if (isHighLOD) {
        const tierRank = adTier === 'GOLD' ? 3 : adTier === 'SILVER' ? 2 : 1;
        const rankSegments = Array(tierRank).fill(0).map((_, i) => `<div class="rank-segment segment-${i + 1}"></div>`).join('');

        return `
        <div class="event-scene ${isHero ? 'is-hero' : ''} ${isUrgent ? 'is-urgent' : ''} tier-${adTier.toLowerCase()} size-${adSize.toLowerCase()}" 
             style="--color: ${color}; --zoom-scale: ${zoomScale}; --pulse-duration: ${pulseDuration}">
            
            <div class="billboard-3d-wrap" style="
                animation: b-float ${floatDuration} infinite ease-in-out;
                transform: scale(${zoomScale}) ${isGold ? 'rotateX(-15deg)' : ''}; 
            ">
                ${isGold ? '<div class="gold-halo"></div>' : ''}
                <div class="billboard-content glass-banner" style="${isGold ? 'border-width: 3px;' : ''}">
                    <div class="scanner-line"></div>
                    <div class="corner-tl"></div>
                    <div class="corner-br"></div>
                    
                    <div class="tier-rank-indicator">
                        ${rankSegments}
                    </div>

                    <div class="billboard-art">${art}</div>
                    <div class="billboard-text">
                        <span class="text-label">${event.title}</span>
                        <div class="secondary-info">
                            <span class="category-tag">${category}</span>
                            ${event.date ? `<span class="date-tag">${event.date}</span>` : ''}
                        </div>
                        ${isGold ? '<span class="premium-tag">Evento VIP</span>' : ''}
                    </div>
                </div>
            </div>

            <div class="tactical-beam"></div>
            
            <div class="ground-anchor">
                <div class="event-pulse-core" style="animation-duration: var(--pulse-duration)">
                    ${isGold ? '<div class="p-aura"></div>' : ''}
                    <div class="p-ring"></div>
                    <div class="p-dot"></div>
                </div>
            </div>
            
            ${isGold ? `
            <div class="firefly-swarm">
                <div class="firefly-p"></div>
                <div class="firefly-p"></div>
                <div class="firefly-p"></div>
            </div>
            ` : ''}
        </div>
        `;
    }

    // Flat 2D Structure for Low LOD (Performance Optimization)
    return `
        <div class="event-marker-wrap lod-low" style="--color: ${color}; transform: scale(${zoomScale * 0.8})">
            <div class="event-pulse-core">
                 <div class="p-dot"></div>
            </div>
        </div>`;
};


export const useEventMarkers = ({
    allEvents,
    showEvents,
    zoom,
    hoveredEventId,
}: Omit<UseEventMarkersProps, 'onSelectEvent' | 'onHoverEvent'>) => {
    // LOD Filter & Taxonomy Processing
    const processedEvents = useMemo(() => {
        if (!showEvents) return [];

        return allEvents.filter(event => {
            const adTier = event.adTier || 'BRONZE';
            const priority = event.priority || 0;

            // Relaxed LOD Strategy
            if (zoom < 11) {
                return adTier === 'GOLD' || priority > 90;
            }
            if (zoom < 13) {
                return adTier !== 'BRONZE' || priority > 60;
            }
            return true;
        }).map(event => {
            const category = event.category || 'other';
            const eventType = event.type || getEventTypeFromCategory(category);
            const config = EVENT_TYPE_CONFIG[eventType as keyof typeof EVENT_TYPE_CONFIG] || EVENT_TYPE_CONFIG.social;

            const isHero = event.id === hoveredEventId;

            // Urgency Check (within 2 hours)
            let isUrgent = false;
            if (event.time) {
                try {
                    const [hours, minutes] = event.time.split(':').map(Number);
                    const now = new Date();
                    const eventTime = new Date();
                    eventTime.setHours(hours, minutes, 0, 0);
                    const diffMs = eventTime.getTime() - now.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    isUrgent = diffHours > 0 && diffHours <= 2;
                } catch { /* ignore */ }
            }

            return {
                ...event,
                computedColor: config.color,
                isHero,
                isUrgent
            };
        });
    }, [allEvents, showEvents, zoom, hoveredEventId]);

    return processedEvents;
};
