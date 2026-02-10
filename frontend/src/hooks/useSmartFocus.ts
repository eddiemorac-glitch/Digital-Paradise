import { useState, useEffect, useCallback, RefObject, useMemo } from 'react';
import L from 'leaflet';
import { EventData, MissionData } from '../types/map';

interface SmartFocusState {
    suggestedCenter: [number, number] | null;
    urgentEvents: EventData[];
    hotZones: { center: [number, number]; count: number; radius: number }[];
    isIdle: boolean;
    shouldAutoPatrol: boolean;
}

interface UseSmartFocusProps {
    mapRef: RefObject<L.Map | null>;
    events: EventData[];
    missions: MissionData[];
    activeMissionId: string | null;
}

const IDLE_THRESHOLD_MS = 30000; // 30 seconds
const URGENT_THRESHOLD_HOURS = 2;

export const useSmartFocus = ({
    mapRef,
    events,
    missions,
    activeMissionId
}: UseSmartFocusProps): SmartFocusState => {
    const [isIdle, setIsIdle] = useState(false);
    const [lastInteraction, setLastInteraction] = useState(Date.now());

    // Track user interaction
    const handleInteraction = useCallback(() => {
        setLastInteraction(Date.now());
        setIsIdle(false);
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        map.on('move', handleInteraction);
        map.on('zoom', handleInteraction);
        map.on('click', handleInteraction);

        return () => {
            map.off('move', handleInteraction);
            map.off('zoom', handleInteraction);
            map.off('click', handleInteraction);
        };
    }, [mapRef, handleInteraction]);

    // Idle detection
    useEffect(() => {
        const interval = setInterval(() => {
            if (Date.now() - lastInteraction > IDLE_THRESHOLD_MS) {
                setIsIdle(true);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [lastInteraction]);

    // Calculate urgent events (events happening within 2 hours)
    const urgentEvents = useMemo(() => {
        return events.filter(event => {
            if (!event.time) return false;
            try {
                const [hours, minutes] = event.time.split(':').map(Number);
                const now = new Date();
                const eventTime = new Date();
                eventTime.setHours(hours, minutes, 0, 0);

                const diffMs = eventTime.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                return diffHours > 0 && diffHours <= URGENT_THRESHOLD_HOURS;
            } catch {
                return false;
            }
        });
    }, [events]);

    // Calculate hot zones (clusters with 3+ events) - Optimized to O(n) using grid bucketing
    const hotZones = useMemo(() => {
        const GRID_SIZE = 0.01; // ~1km
        const grid = new Map<string, EventData[]>();

        events.forEach(event => {
            const lat = Number(event.latitude || event.lat);
            const lng = Number(event.longitude || event.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const gridX = Math.floor(lat / GRID_SIZE);
            const gridY = Math.floor(lng / GRID_SIZE);
            const key = `${gridX},${gridY}`;

            if (!grid.has(key)) grid.set(key, []);
            grid.get(key)!.push(event);
        });

        const zones: SmartFocusState['hotZones'] = [];
        grid.forEach((items, key) => {
            if (items.length >= 3) {
                const [gridX, gridY] = key.split(',').map(Number);
                zones.push({
                    center: [(gridX + 0.5) * GRID_SIZE, (gridY + 0.5) * GRID_SIZE],
                    count: items.length,
                    radius: 500
                });
            }
        });

        return zones;
    }, [events]);

    // Calculate suggested center based on active mission
    let suggestedCenter: [number, number] | null = null;
    if (activeMissionId) {
        const mission = missions.find(m => m.id === activeMissionId);
        if (mission) {
            const lat = mission.destinationLat;
            const lng = mission.destinationLng;
            if (lat && lng) {
                suggestedCenter = [lat, lng];
            }
        }
    }

    return {
        suggestedCenter,
        urgentEvents,
        hotZones,
        isIdle,
        shouldAutoPatrol: isIdle && missions.length === 0
    };
};
