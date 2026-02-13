import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
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
// Modular Map Hooks
import { useEventMarkers } from '../hooks/map/useEventMarkers';

// Sub-components
// Sub-components
import { MissionHUD, EventOverlay, MerchantCard, LayerControlPanel, MapFilterBar, MapToolsFAB, MapToolsOverlay } from './map';
import { MapController } from './map/MapController';
import { LegacyMapHooks } from './map/LegacyMapHooks';
import { AtmosphericEffects } from './map/AtmosphericEffects';
import { MapIndicators } from './map/MapIndicators';
import { SignalIntercept } from './hud/SignalIntercept';
import { EventLayer } from './map/EventLayer';
import { MapErrorBoundary } from './map/MapErrorBoundary';
// useDroneLayer moved to sub-component
import { DroneLayer } from './map/DroneLayer';
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

    // Phase 24: Drone Layer (Moved to sub-component)

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
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

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

                {/* Phase 24: Kinetic Logistics (Drones) - Optimized Layer */}
                <DroneLayer />
            </MapContainer>

            {/* LEGACY CATEGORY FILTERS (Hide on Mobile) */}
            <MapFilterBar
                activeCategories={state.activeCategories}
                onToggleCategory={actions.toggleCategory}
            />

            {/* SCENETIC OVERLAYS */}
            <AtmosphericEffects
                weatherLayer={state.layers.weather}
                scanlinesLayer={state.layers.scanlines}
                sceneticEffect={state.sceneticEffect}
                isLightningActive={state.isLightningActive}
                atmosphere={state.atmosphere}
                canvasRef={state.canvasRef}
            />

            {/* INDICATORS */}
            <MapIndicators
                timeOfDay={state.atmosphere.timeOfDay}
                displayName={state.atmosphere.displayName}
                isIdle={state.isIdle}
                urgentEventsCount={state.urgentEvents.length}
                isLoading={state.isLoading}
            />

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

