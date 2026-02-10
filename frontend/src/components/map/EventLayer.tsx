import React, { useState, useEffect } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import { EventData } from '../../types/map';
import { useMapClusters } from '../../hooks/map/useMapClusters';
import { SingleEventMarker } from './SingleEventMarker';

interface EventLayerProps {
    events: EventData[];
    zoom: number;
    onSelectEvent: (event: EventData) => void;
    hoveredEventId: string | null;
    setHoveredEventId: (id: string | null) => void;
}

export const EventLayer: React.FC<EventLayerProps> = ({
    events,
    zoom,
    onSelectEvent,
    hoveredEventId,
    setHoveredEventId
}) => {
    const map = useMap();
    const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);

    // Update bounds on move
    useEffect(() => {
        const updateBounds = () => {
            const b = map.getBounds();
            setBounds([
                b.getWest(),
                b.getSouth(),
                b.getEast(),
                b.getNorth()
            ]);
        };

        map.on('moveend', updateBounds);
        updateBounds(); // Init

        return () => {
            map.off('moveend', updateBounds);
        };
    }, [map]);

    const { clusters, supercluster } = useMapClusters({
        events,
        bounds,
        zoom,
        enabled: true
    });

    const handleClusterClick = (clusterId: number, lat: number, lng: number) => {
        const expansionZoom = Math.min(
            supercluster?.getClusterExpansionZoom(clusterId) || 18,
            18
        );
        map.setView([lat, lng], expansionZoom, { animate: true });
    };

    return (
        <>
            {clusters.map(cluster => {
                const [lng, lat] = cluster.geometry.coordinates;
                const properties = cluster.properties as any;
                const { cluster: isCluster, point_count: pointCount } = properties;

                if (isCluster) {
                    const size = pointCount < 10 ? 40 : pointCount < 50 ? 60 : 80;
                    return (
                        <Marker
                            key={`cluster-${cluster.id}`}
                            position={[lat, lng]}
                            icon={L.divIcon({
                                html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px;">
                                        <div class="cluster-core">
                                            <span>${pointCount}</span>
                                            <div class="cluster-ring"></div>
                                        </div>
                                       </div>`,
                                className: 'custom-cluster-icon',
                                iconSize: [size, size]
                            })}
                            eventHandlers={{
                                click: () => handleClusterClick(cluster.id as number, lat, lng)
                            }}
                        />
                    );
                }

                // Leaf Render (Individual Event)
                // Cast properties to any because Supercluster types are generic
                const eventProp = (cluster.properties as any).eventData as EventData;

                // Safety check
                if (!eventProp) return null;

                const isHero = eventProp.id === hoveredEventId;



                return (
                    <SingleEventMarker
                        key={`event-${eventProp.id}`}
                        event={eventProp}
                        lat={lat}
                        lng={lng}
                        isHero={isHero}
                        zoom={zoom}
                        onSelect={onSelectEvent}
                        onHover={setHoveredEventId}
                    />
                );
            })}

            {/* Styles moved to LiveMap.css (P3) */}
        </>
    );
};
