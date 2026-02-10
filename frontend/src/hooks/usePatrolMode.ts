import { useEffect, useState, RefObject } from 'react';
import L from 'leaflet';

export interface PatrolTarget {
    name: string;
    pos: [number, number];
    zoom: number;
}

interface UsePatrolModeProps {
    mapRef: RefObject<L.Map | null>;
    isPatrolling: boolean;
    dynamicTargets?: PatrolTarget[];
}

interface UsePatrolModeReturn {
    patrolIndex: number;
    currentTarget: PatrolTarget | null;
}

const DEFAULT_HOTSPOTS: PatrolTarget[] = [
    { name: 'CAHUITA', pos: [9.73, -82.84], zoom: 15 },
    { name: 'PUERTO VIEJO', pos: [9.658, -82.753], zoom: 16 },
    { name: 'MANZANILLO', pos: [9.63, -82.66], zoom: 15.5 },
];

export const usePatrolMode = ({
    mapRef,
    isPatrolling,
    dynamicTargets = []
}: UsePatrolModeProps): UsePatrolModeReturn => {
    const [patrolIndex, setPatrolIndex] = useState(0);
    const targets = dynamicTargets.length > 0 ? dynamicTargets : DEFAULT_HOTSPOTS;

    useEffect(() => {
        if (!isPatrolling || !mapRef.current || targets.length === 0) return;

        const cyclePatrol = () => {
            setPatrolIndex(prev => {
                const next = (prev + 1) % targets.length;
                const spot = targets[next];
                mapRef.current?.flyTo(spot.pos, spot.zoom, {
                    duration: 5,
                    easeLinearity: 0.1
                });
                return next;
            });
        };

        const timer = setInterval(cyclePatrol, 12000);

        // Start first one immediately
        const firstSpot = targets[patrolIndex % targets.length];
        mapRef.current.flyTo(firstSpot.pos, firstSpot.zoom, { duration: 5 });

        return () => clearInterval(timer);
    }, [isPatrolling, targets]); // patrolIndex intentionally excluded — cyclePatrol uses functional updater

    return {
        patrolIndex,
        currentTarget: targets[patrolIndex % targets.length] || null
    };
};
