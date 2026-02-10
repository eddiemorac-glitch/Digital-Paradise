import { useEffect } from 'react';
import L from 'leaflet';
import { MissionData } from '../../types/map';

interface UseMissionMarkersProps {
    mapRef: React.RefObject<L.Map | null>;
    markersGroupRef: React.RefObject<L.LayerGroup | null>;
    pathsGroupRef: React.RefObject<L.LayerGroup | null>;
    missions: MissionData[];
    activeMissionId: string | null;
    showPaths: boolean;
    onSelectMission: (id: string | null) => void;
    onClearEntitySelection: () => void;
    userPos?: [number, number] | null;
    driverPos?: [number, number] | null; // Phase 9: Real-time driver injection
}

export const useMissionMarkers = ({
    mapRef,
    markersGroupRef,
    pathsGroupRef,
    missions,
    activeMissionId,
    showPaths,
    onSelectMission,
    onClearEntitySelection,
    userPos,
    driverPos
}: UseMissionMarkersProps) => {
    useEffect(() => {
        if (!mapRef.current || !markersGroupRef.current || !pathsGroupRef.current) return;

        const markersGroup = markersGroupRef.current;
        const pathsGroup = pathsGroupRef.current;

        markersGroup.clearLayers();
        pathsGroup.clearLayers();

        let activeAnimationId: number | null = null;

        missions.forEach(mission => {
            const isSelected = mission.id === activeMissionId;
            const mLat = Number(mission.merchant?.latitude ?? mission.originLat ?? 0);
            const mLng = Number(mission.merchant?.longitude ?? mission.originLng ?? 0);
            const dLat = Number(mission.destinationLat ?? 0);
            const dLng = Number(mission.destinationLng ?? 0);

            const isOriginValid = typeof mLat === 'number' && !isNaN(mLat) && mLat !== 0 && Math.abs(mLat) <= 90 &&
                typeof mLng === 'number' && !isNaN(mLng) && mLng !== 0 && Math.abs(mLng) <= 180;
            const isDestValid = typeof dLat === 'number' && !isNaN(dLat) && dLat !== 0 && Math.abs(dLat) <= 90 &&
                typeof dLng === 'number' && !isNaN(dLng) && dLng !== 0 && Math.abs(dLng) <= 180;

            if (isOriginValid) {
                const pIcon = L.divIcon({
                    html: `
                        <div class="marker-container origin-marker">
                            <div class="marker-pulse" style="background: #00ecff; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
                                <div style="width: 6px; height: 6px; background: white; border-radius: 1px;"></div>
                            </div>
                        </div>`,
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                const m = L.marker([mLat, mLng], { icon: pIcon }).addTo(markersGroup);
                m.on('click', () => {
                    onSelectMission(mission.id);
                    onClearEntitySelection();
                });
            }

            // --- Phase 9: DRIVER / COURIER MARKER ---
            const currentDriverPos = driverPos || (isSelected ? userPos : null); // Fallback to userPos for internal courier view
            if (currentDriverPos && mission.status === 'ON_WAY') {
                const bikeIcon = L.divIcon({
                    html: `
                        <div class="marker-container courier-marker">
                             <div class="pulse-aura" style="position: absolute; width: 40px; height: 40px; background: rgba(0, 236, 255, 0.2); border-radius: 50%; animation: aura-pulse 2s infinite;"></div>
                             <div class="courier-bike" style="background: #00ecff; width: 28px; height: 28px; border-radius: 12px; border: 2.5px solid #0a0f18; display: flex; align-items: center; justify-content: center; position: relative; z-index: 2; box-shadow: 0 0 15px rgba(0, 236, 255, 0.6);">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="18.5" cy="17.5" r="3.5"></circle>
                                    <circle cx="5.5" cy="17.5" r="3.5"></circle>
                                    <circle cx="15" cy="5" r="1"></circle>
                                    <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
                                </svg>
                             </div>
                             <div class="courier-label" style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #00ecff; color: #0a0f18; padding: 2px 8px; border-radius: 6px; font-size: 8px; font-weight: 900; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px;">Tu Repartidor</div>
                        </div>`,
                    className: 'custom-div-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                });

                L.marker(currentDriverPos as [number, number], { icon: bikeIcon, zIndexOffset: 1000 }).addTo(markersGroup);
            }

            if (isDestValid) {
                // Destination Geofence Circle (Visual only)
                if (mission.status === 'ON_WAY') {
                    L.circle([dLat, dLng], {
                        radius: 50,
                        color: '#ffaa00',
                        fillColor: '#ffaa00',
                        fillOpacity: 0.1,
                        weight: 1,
                        dashArray: '5, 5',
                        className: 'arrival-geofence'
                    }).addTo(pathsGroup);
                }

                const dIcon = L.divIcon({
                    html: `
                        <div class="marker-container destination-marker">
                            <div class="marker-bounce" style="background: #ffaa00; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
                                <div style="width: 4px; height: 4px; border-left: 3px solid transparent; border-right: 3px solid transparent; border-bottom: 5px solid white;"></div>
                            </div>
                        </div>`,
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                const m = L.marker([dLat, dLng], { icon: dIcon }).addTo(markersGroup);
                m.on('click', () => {
                    onSelectMission(mission.id);
                    onClearEntitySelection();
                });
            }

            if (isOriginValid && isDestValid && showPaths) {
                // Tactical Decision: Where does the line start?
                let startPos: [number, number] = [mLat, mLng];

                const isDriverPosValid = Array.isArray(currentDriverPos) &&
                    currentDriverPos.length === 2 &&
                    typeof currentDriverPos[0] === 'number' &&
                    typeof currentDriverPos[1] === 'number' &&
                    !isNaN(currentDriverPos[0]) &&
                    !isNaN(currentDriverPos[1]) &&
                    currentDriverPos[0] !== 0 && Math.abs(currentDriverPos[0]) <= 90 &&
                    currentDriverPos[1] !== 0 && Math.abs(currentDriverPos[1]) <= 180;

                if (isSelected && isDriverPosValid) {
                    startPos = [currentDriverPos![0], currentDriverPos![1]];
                }

                const endPos: [number, number] = (isSelected && mission.status === 'READY') ? [mLat, mLng] : [dLat, dLng];

                // FINAL GUARD: Prevent NaN passing to Leaflet
                if (isNaN(startPos[0]) || isNaN(startPos[1]) || isNaN(endPos[0]) || isNaN(endPos[1])) {
                    return;
                }

                // Background shadow line for depth
                L.polyline([startPos, endPos], {
                    color: '#000',
                    weight: isSelected ? 6 : 4,
                    opacity: 0.1,
                }).addTo(pathsGroup);

                const path = L.polyline([startPos, endPos], {
                    color: isSelected ? '#00ecff' : '#ffffff',
                    weight: isSelected ? 3 : 1.5,
                    opacity: isSelected ? 0.8 : 0.2,
                    lineJoin: 'round',
                    dashArray: isSelected ? '1, 12' : '5, 10',
                    className: isSelected ? 'path-active-glow animate-pulse' : ''
                }).addTo(pathsGroup);

                if (isSelected) {
                    let offset = 0;
                    const animate = () => {
                        offset--;
                        path.setStyle({ dashOffset: offset.toString() });
                        activeAnimationId = requestAnimationFrame(animate);
                    };
                    animate();
                }
            }
        });

        return () => {
            if (activeAnimationId) cancelAnimationFrame(activeAnimationId);
        };

    }, [mapRef, markersGroupRef, pathsGroupRef, missions, activeMissionId, showPaths, onSelectMission, onClearEntitySelection, userPos, driverPos]);
};
