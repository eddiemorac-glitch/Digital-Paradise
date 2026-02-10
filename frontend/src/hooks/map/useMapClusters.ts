import { useRef, useState, useEffect, useMemo } from 'react';
import Supercluster from 'supercluster';
import { GeoJsonProperties } from 'geojson';
import { EventData } from '../../types/map';
import { devLog } from '../../utils/devLog';


interface UseMapClustersProps {
    events: EventData[];
    bounds: [number, number, number, number] | null; // West, South, East, North
    zoom: number;
    enabled: boolean;
}

export const useMapClusters = ({
    events,
    bounds,
    zoom,
    enabled
}: UseMapClustersProps) => {
    const clusterRef = useRef<Supercluster<GeoJsonProperties, GeoJsonProperties>>(
        new Supercluster({
            radius: 40,
            maxZoom: 16,
        })
    );

    // State to force re-render when clusters change
    const [clusters, setClusters] = useState<(Supercluster.ClusterFeature<GeoJsonProperties> | Supercluster.PointFeature<GeoJsonProperties>)[]>([]);

    // 1. Memoize points creation to prevent re-calculation on every render
    const points = useMemo(() => {
        if (!events || events.length === 0) return [];

        return events.map(event => {
            const lat = Number(event.latitude || (event as any).lat);
            const lng = Number(event.longitude || (event as any).lng);

            if (isNaN(lat) || isNaN(lng)) return null;

            return {
                type: 'Feature' as const,
                properties: {
                    cluster: false,
                    eventId: event.id,
                    category: event.category || 'other',
                    tier: event.adTier || 'BRONZE',
                    // Pass full event data for rendering
                    eventData: event
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [lng, lat]
                }
            };
        }).filter((p): p is NonNullable<typeof p> => p !== null) as Supercluster.PointFeature<GeoJsonProperties>[];
    }, [events]);

    // 2. Sync data and get clusters in a single effect
    useEffect(() => {
        if (!enabled || points.length === 0) {
            setClusters([]);
            return;
        }

        clusterRef.current.load(points);

        if (bounds) {
            try {
                const validBounds = bounds.map(b => Number(b)) as [number, number, number, number];
                const features = clusterRef.current.getClusters(validBounds, Math.round(zoom));
                setClusters(features);
            } catch (error) {
                devLog('Error calculating clusters:', error);
            }
        }
    }, [points, enabled, bounds, zoom]);


    return {
        clusters,
        supercluster: clusterRef.current
    };
};
