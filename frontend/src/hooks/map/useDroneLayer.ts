import { useEffect, useState, useRef } from 'react';
import { Drone, DroneUpdate } from '../../types/drones';
import { socketService } from '../../api/socket';

export const useDroneLayer = () => {
    const [drones, setDrones] = useState<Record<string, Drone>>({});
    const animationFrameRef = useRef<number>(0);

    // Interpolation State
    const targetPositions = useRef<Record<string, { lat: number, lng: number, startLat: number, startLng: number, startTime: number }>>({});

    useEffect(() => {
        const handleDroneUpdate = (update: DroneUpdate) => {
            setDrones(prev => {
                const current = prev[update.droneId];

                // Setup Intepolation Target
                targetPositions.current[update.droneId] = {
                    lat: update.lat,
                    lng: update.lng,
                    startLat: current?.location[0] || update.lat,
                    startLng: current?.location[1] || update.lng,
                    startTime: performance.now()
                };

                return {
                    ...prev,
                    [update.droneId]: {
                        ...current,
                        id: update.droneId,
                        location: [update.lat, update.lng], // Will be overridden by animation loop
                        bearing: update.bearing || current?.bearing || 0,
                        status: update.status || current?.status || 'IDLE',
                        batteryLevel: current?.batteryLevel || 100,
                        callsign: current?.callsign || `DRONE-${update.droneId.slice(-4).toUpperCase()}`
                    }
                };
            });
        };

        // Listen to socket (assuming we expose a generic entity update or specific drone channel)
        // For now, let's hook into 'driver_location_updated' as a proxy for drones
        socketService.onDriverLocationUpdated?.((data: any) => {
            handleDroneUpdate({
                droneId: data.missionId, // Using mission ID as temporary drone ID
                lat: data.lat,
                lng: data.lng,
                status: 'MOVING'
            });
        });

        // Animation Loop for Smooth Movement
        const animate = (time: number) => {
            setDrones(prev => {
                const nextState = { ...prev };
                let hasChanges = false;

                Object.keys(targetPositions.current).forEach(id => {
                    const target = targetPositions.current[id];
                    const elapsed = time - target.startTime;
                    const DURATION = 2000; // 2s interpolation buffer

                    if (elapsed < DURATION) {
                        const t = elapsed / DURATION;
                        // Linear Lerp
                        const newLat = target.startLat + (target.lat - target.startLat) * t;
                        const newLng = target.startLng + (target.lng - target.startLng) * t;

                        if (nextState[id]) {
                            nextState[id] = {
                                ...nextState[id],
                                location: [newLat, newLng]
                            };
                            hasChanges = true;
                        }
                    } else {
                        // Snap to target if finished
                        if (nextState[id] && (nextState[id].location[0] !== target.lat || nextState[id].location[1] !== target.lng)) {
                            nextState[id] = {
                                ...nextState[id],
                                location: [target.lat, target.lng]
                            };
                            hasChanges = true;
                        }
                    }
                });

                return hasChanges ? nextState : prev;
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

    }, []);

    return Object.values(drones);
};
