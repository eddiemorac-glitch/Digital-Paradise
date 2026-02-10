import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, LayerGroup, useMap } from 'react-leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Types
import {
    LiveMapProps,
    EventData,
    MerchantData
} from '../types/map';

// Hooks
import { useTacticalMap } from '../hooks/map/useTacticalMap';

// Modular Map Hooks
import { useMerchantMarkers } from '../hooks/map/useMerchantMarkers';
import { useMissionMarkers } from '../hooks/map/useMissionMarkers';
import { useEventMarkers } from '../hooks/map/useEventMarkers';

// Sub-components
// Sub-components
import { MissionHUD, EventOverlay, MerchantCard, LayerControlPanel, TropicalParticles, MapFilterBar, MapToolsFAB, MapToolsOverlay } from './map';
import { SignalIntercept } from './hud/SignalIntercept';
import { EventLayer } from './map/EventLayer';
import { MapErrorBoundary } from './map/MapErrorBoundary';
import { useDroneLayer } from '../hooks/map/useDroneLayer';
import { DroneMarker } from './map/DroneMarker';
// getEventMarkerHTML moved to EventLayer

const PUERTO_VIEJO_CENTER: [number, number] = [9.6558, -82.7538];

// Fix default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// --- SUB-COMPONENTS (Defined outside to prevent re-creation and Leaflet conflicts) ---

// 1. MapController to handle imperative initialization logic inside MapContainer
const MapController: React.FC<{
    onMapReady?: () => void,
    mapRef: React.MutableRefObject<L.Map | null>,
    setZoom: (z: number) => void,
    setCenter: (c: [number, number]) => void,
    triggerRefresh: () => void
}> = ({ onMapReady, mapRef, setZoom, setCenter, triggerRefresh }) => {
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
            triggerRefresh();
        };

        map.on('zoomend', onZoom);
        map.on('moveend', onMove);

        onMapReady?.();

        return () => {
            map.off('zoomend', onZoom);
            map.off('moveend', onMove);
            mapRef.current = null;
        };
    }, [map, onMapReady, setZoom, setCenter, mapRef, triggerRefresh]);

    return null;
};

// 2. Legacy Hooks Wrapper (Must be inside MapContainer)
const LegacyMapHooks: React.FC<{
    state: any,
    actions: any,
    missions: any[],
    activeMission: any,
    mapRef: React.MutableRefObject<L.Map | null>,
    userPos?: [number, number] | null,
    driverPos?: [number, number] | null
}> = ({ state, actions, missions, activeMission, mapRef, userPos, driverPos }) => {
    const markersGroupRef = useRef<L.LayerGroup | null>(null);
    const localesGroupRef = useRef<L.LayerGroup | null>(null);
    const pathsGroupRef = useRef<L.LayerGroup | null>(null);

    const onSelectMerchant = useCallback((m: any) => actions.selectEntity({ type: 'MERCHANT', data: m }), [actions]);
    const onClearMissionSelection = useCallback(() => actions.selectMission(null), [actions]);
    const onClearEntitySelection = useCallback(() => actions.selectEntity(null), [actions]);

    useMerchantMarkers({
        mapRef,
        localesGroupRef,
        merchants: state.merchants,
        showMerchants: state.layers.merchants,
        onSelectMerchant,
        onClearMissionSelection
    });

    useMissionMarkers({
        mapRef,
        markersGroupRef,
        pathsGroupRef,
        missions,
        activeMissionId: activeMission?.id || null,
        showPaths: state.layers.paths,
        onSelectMission: actions.selectMission,
        onClearEntitySelection,
        userPos,
        driverPos
    });

    return (
        <>
            <LayerGroup ref={markersGroupRef} />
            <LayerGroup ref={localesGroupRef} />
            <LayerGroup ref={pathsGroupRef} />
        </>
    );
};

// --- MAIN COMPONENT ---

const LiveMapComponent: React.FC<LiveMapProps> = ({
    missions = [],
    events = [],
    merchants = [],
    focusedEvent = null,
    driverPos = null, // Phase 9
    onUpdateStatus,
    onConfirmDelivery,
    onChatOpen,
    onMapReady
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const centerRef = useRef<[number, number]>(PUERTO_VIEJO_CENTER);

    const [zoom, setZoom] = useState(15);
    const [center, setCenter] = useState<[number, number]>(PUERTO_VIEJO_CENTER);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
    const [isToolsOpen, setIsToolsOpen] = useState(false);

    // 2. Tactical Orchestrator (The "Brain")
    const { state, actions } = useTacticalMap({
        mapRef,
        centerRef,
        missions,
        allEvents: events,
        merchants,
        initialLayers: {
            weather: true,
            scanlines: false,
            merchants: true,
            events: true,
            paths: true
        }
    });

    const activeMission = useMemo(() =>
        missions.find(m => m.id === state.selectedMissionId) || null,
        [missions, state.selectedMissionId]
    );

    const processedEvents = useEventMarkers({
        allEvents: state.events,
        showEvents: state.layers.events,
        zoom,
        hoveredEventId
    });

    // Phase 24: Drone Layer
    const drones = useDroneLayer();

    // Fit Bounds on Initial Mission Load or Auto-Follow
    useEffect(() => {
        if (!mapInitialized || !mapRef.current || missions.length === 0) return;

        if (state.isFixedMissionCamera && activeMission) {
            const lat = Number(activeMission.destinationLat);
            const lng = Number(activeMission.destinationLng);
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                mapRef.current.setView([lat, lng], 17, { animate: true });
                return;
            }
        }

        if (!focusedEvent) {
            const bounds: L.LatLngExpression[] = [];
            missions.forEach(m => {
                const lat = Number(m.merchant?.latitude ?? m.originLat);
                const lng = Number(m.merchant?.longitude ?? m.originLng);

                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    bounds.push([lat, lng]);
                }

                const dLat = Number(m.destinationLat);
                const dLng = Number(m.destinationLng);
                if (!isNaN(dLat) && !isNaN(dLng) && dLat !== 0 && dLng !== 0) {
                    bounds.push([dLat, dLng]);
                }
            });
            if (bounds.length > 0) {
                mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [100, 100], animate: true });
            }
        }
    }, [mapInitialized, missions.length, focusedEvent, state.isFixedMissionCamera, activeMission?.id]);

    // Phase 32: Auto-Track Courier Location
    useEffect(() => {
        if (mapInitialized && activeMission?.id && activeMission.status === 'ON_WAY') {
            actions.locateUser(true); // Trigger continuous tracking
        }
    }, [mapInitialized, activeMission?.id, activeMission?.status]); // Stable dependency on ID

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative h-full w-full bg-background overflow-hidden"
        >
            <MapContainer
                center={PUERTO_VIEJO_CENTER}
                zoom={15}
                minZoom={13}
                maxZoom={18}
                zoomControl={false}
                attributionControl={false}
                className="h-full w-full relative z-[10]"
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />

                <MapController
                    onMapReady={() => {
                        setMapInitialized(true);
                        onMapReady?.();
                    }}
                    mapRef={mapRef}
                    setZoom={setZoom}
                    setCenter={(c) => {
                        setCenter(c);
                        centerRef.current = c;
                    }}
                    triggerRefresh={actions.triggerRefresh}
                />

                <LegacyMapHooks
                    state={state}
                    actions={actions}
                    missions={missions}
                    activeMission={activeMission}
                    mapRef={mapRef}
                    userPos={state.userPos}
                    driverPos={driverPos}
                />

                {/* The New Event Clustering System Phase 21 */}
                {state.layers.events && processedEvents.length > 0 && (
                    <EventLayer
                        events={processedEvents}
                        zoom={zoom}
                        onSelectEvent={(data) => actions.selectEntity({ type: 'EVENT', data })}
                        hoveredEventId={hoveredEventId}
                        setHoveredEventId={setHoveredEventId}
                    />
                )}

                {/* Phase 24: Kinetic Logistics (Drones) */}
                {drones.map(drone => (
                    <DroneMarker key={drone.id} drone={drone} />
                ))}
            </MapContainer>

            {/* LEGACY CATEGORY FILTERS (Hide on Mobile) */}
            <MapFilterBar
                activeCategories={state.activeCategories}
                onToggleCategory={actions.toggleCategory}
            />

            {/* SCENETIC OVERLAYS */}
            {state.layers.weather && (
                <>
                    {state.sceneticEffect === 'RAIN' && (
                        <canvas
                            ref={state.canvasRef}
                            className="absolute inset-0 z-[400] pointer-events-none opacity-60"
                        />
                    )}
                    {state.sceneticEffect === 'SUN' && (
                        <div className="absolute top-0 right-0 w-full h-full bg-orange-500/5 blur-[120px] rounded-full pointer-events-none z-[400]" />
                    )}
                    <AnimatePresence>
                        {state.isLightningActive && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-[401] pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </>
            )}

            {state.layers.scanlines && (
                <div className="absolute inset-0 z-[1000] pointer-events-none overflow-hidden opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay">
                    <div className="absolute inset-0 scanlines" />
                </div>
            )}

            {/* ATMOSPHERIC OVERLAY */}
            <div
                className={`absolute inset-0 z-[399] pointer-events-none transition-all duration-1000 ${state.atmosphere.atmosphereClass}`}
                style={{ opacity: state.atmosphere.neonIntensity * 0.5 }}
            />

            {/* TROPICAL PARTICLES */}
            {state.layers.weather && (
                <TropicalParticles timeOfDay={state.atmosphere.timeOfDay as any} intensity={0.6} />
            )}

            {/* TIME INDICATOR */}
            <motion.div
                key={state.atmosphere.timeOfDay}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="time-indicator"
            >
                <div
                    className="time-indicator-dot"
                    style={{
                        background: state.atmosphere.timeOfDay === 'NIGHT' ? '#00ff66' :
                            state.atmosphere.timeOfDay === 'GOLDEN' ? '#ffaa00' :
                                state.atmosphere.timeOfDay === 'SUNRISE' ? '#ff8866' : '#66aaff'
                    }}
                />
                <span>{state.atmosphere.displayName}</span>
            </motion.div>

            {/* IDLE INDICATOR */}
            <AnimatePresence>
                {state.isIdle && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="idle-indicator"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span>Modo Exploración Activo</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* URGENT EVENTS COUNTER */}
            <AnimatePresence>
                {state.urgentEvents.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-16 right-2 md:top-4 md:right-4 z-[1002] px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-red-500/20 border border-red-500/40 backdrop-blur-sm"
                    >
                        <span className="text-[10px] md:text-xs font-black text-red-400 uppercase tracking-wider">
                            {state.urgentEvents.length} evento{state.urgentEvents.length > 1 ? 's' : ''} próximo{state.urgentEvents.length > 1 ? 's' : ''}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LOADING INDICATOR */}
            <AnimatePresence>
                {state.isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-20 md:top-4 left-1/2 -translate-x-1/2 z-[1002] px-4 py-2 rounded-2xl bg-primary/20 border border-primary/40 backdrop-blur-md flex items-center gap-3"
                    >
                        <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest whitespace-nowrap">Sincronizando Radar...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUDs and Cards */}
            <AnimatePresence>
                {activeMission && (
                    <MissionHUD
                        mission={activeMission}
                        onClose={() => actions.selectMission(null)}
                        onUpdateStatus={onUpdateStatus}
                        onConfirmDelivery={onConfirmDelivery}
                        onChatOpen={onChatOpen}
                        isFixed={state.isFixedMissionCamera}
                        onToggleFixed={actions.toggleFixedMissionCamera}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {state.selectedEntity?.type === 'EVENT' && (
                    <EventOverlay
                        event={state.selectedEntity.data as EventData}
                        center={center}
                        onClose={() => actions.selectEntity(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {state.selectedEntity?.type === 'MERCHANT' && (
                    <MerchantCard
                        merchant={state.selectedEntity.data as MerchantData}
                        onClose={() => actions.selectEntity(null)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Phase 23: Signal HUD */}
                <SignalIntercept />
            </AnimatePresence>

            {/* LEGACY LAYER CONTROLS (Hide on Mobile) */}
            <LayerControlPanel
                layers={state.layers}
                setLayers={actions.setLayers}
                isPatrolling={state.isPatrolling}
                setIsPatrolling={actions.togglePatrol}
                setSceneticEffect={actions.setSceneticEffect}
                onLocateMe={actions.locateUser}
                isLocating={state.isLocating}
                searchQuery={state.searchQuery}
                setSearchQuery={actions.setSearchQuery}
            />

            {/* NEW CONSOLIDATED MOBILE CONTROLS */}
            <MapToolsFAB
                isOpen={isToolsOpen}
                onClick={() => setIsToolsOpen(!isToolsOpen)}
            />

            <MapToolsOverlay
                isOpen={isToolsOpen}
                onClose={() => setIsToolsOpen(false)}
                layers={state.layers}
                setLayers={actions.setLayers}
                isPatrolling={state.isPatrolling}
                setIsPatrolling={actions.togglePatrol}
                onLocateMe={actions.locateUser}
                isLocating={state.isLocating}
                activeCategories={state.activeCategories}
                onToggleCategory={actions.toggleCategory}
                searchQuery={state.searchQuery}
                setSearchQuery={actions.setSearchQuery}
                setSceneticEffect={actions.setSceneticEffect}
            />
        </motion.div>
    );
};

export const LiveMap: React.FC<LiveMapProps> = (props) => (
    <MapErrorBoundary>
        <LiveMapComponent {...props} />
    </MapErrorBoundary>
);

