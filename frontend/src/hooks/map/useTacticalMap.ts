import { useState, useMemo, useCallback, useEffect, RefObject } from 'react';
import L from 'leaflet';
import {
    EventData,
    MerchantData,
    MissionData,
    SelectedEntity,
    TacticalState,
    TacticalMode,
    SceneticEffect,
    MapLayers,
    EventGeoJSON,
    EventGeoJSONFeature
} from '../../types/map';

// Modular Map Hooks
import { useSmartFocus } from '../useSmartFocus';
import { usePatrolMode, PatrolTarget } from '../usePatrolMode';
import { useUserLocation } from '../useUserLocation';
import { useTimeAwareness } from '../useTimeAwareness';
import { useRainEngine } from '../useRainEngine';

// Utils
import { playTacticalSound } from '../../utils/tacticalSound';
import { devLog } from '../../utils/devLog';

// API
import { eventsApi } from '../../api/events';

interface UseTacticalMapProps {
    mapRef: RefObject<L.Map | null>;
    centerRef: RefObject<[number, number]>;
    missions: MissionData[];
    allEvents: EventData[];
    merchants: MerchantData[]; // Used in TacticalRadar eventually, passed through state
    initialLayers: MapLayers;
}

export const useTacticalMap = ({
    mapRef,
    centerRef,
    missions,
    allEvents: _allEvents, // Ignored as we fetch viewport-specific events
    merchants,
    initialLayers
}: UseTacticalMapProps) => {
    // 1. Core Orchestration State
    const [state, setState] = useState<TacticalState>({
        mode: 'PATROL',
        isPatrolling: true,
        isLocating: false,
        searchQuery: '',
        sceneticEffect: 'NONE',
        selectedEntity: null,
        selectedMissionId: null,
        activeCategories: null,
        isFixedMissionCamera: false
    });

    const [layers, setLayers] = useState<MapLayers>(initialLayers);
    const [dynamicEvents, setDynamicEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [viewKey, setViewKey] = useState(0);
    const triggerRefresh = useCallback(() => setViewKey(prev => prev + 1), []);

    // 2. Data Synchronization (Viewport Aware)
    useEffect(() => {
        if (!mapRef.current) return;
        const controller = new AbortController();

        const fetchEvents = async () => {
            if (!mapRef.current) return;
            const map = mapRef.current;

            // Ensure map has a size and projection ready
            if (!map.getContainer().clientHeight || !map.getBounds() || !map.getBounds().isValid()) {
                setTimeout(fetchEvents, 200); // Retry soon
                return;
            }

            try {
                const bounds = map.getBounds();
                const geojson = await eventsApi.getInBounds(
                    bounds.getSouth(),
                    bounds.getNorth(),
                    bounds.getWest(),
                    bounds.getEast()
                ) as EventGeoJSON;

                if (controller.signal.aborted) return;

                const fetchedEvents: EventData[] = geojson.features.map((f: EventGeoJSONFeature) => ({
                    description: '',
                    date: '',
                    category: 'other',
                    adTier: 'BRONZE',
                    adSize: 'SMALL',
                    attendees: 0,
                    isEcoFriendly: false,
                    ...f.properties,
                    id: f.properties.id,
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0]
                })) as EventData[];

                setDynamicEvents(fetchedEvents);
            } catch (err) {
                if (!controller.signal.aborted) {
                    devLog("Tactical Orchestrator: Failed to fetch viewport events:", err);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        setIsLoading(true);
        // Standard debounced sync. 
        // We rely on the initial onMapReady call from MapController + triggerRefresh.
        const delay = viewKey === 0 ? 500 : 1000;
        const timeoutId = setTimeout(fetchEvents, delay);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [mapRef, state.mode, viewKey]); // REMOVED dynamicEvents.length === 0 to break loop

    // 3. Intelligence Sub-Systems
    const filteredEvents = useMemo(() => {
        let base = [...dynamicEvents];

        // Filter by category if active
        if (state.activeCategories && state.activeCategories.length > 0) {
            base = base.filter(e =>
                state.activeCategories!.includes((e.category || e.type || 'other').toLowerCase())
            );
        }

        if (!state.searchQuery) return base;
        const q = state.searchQuery.toLowerCase();
        return base.filter(e =>
            e.title?.toLowerCase().includes(q) ||
            e.category?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q)
        );
    }, [dynamicEvents, state.searchQuery, state.activeCategories]);


    const filteredMerchants = useMemo(() => {
        if (!state.searchQuery) return merchants;
        const q = state.searchQuery.toLowerCase();
        return merchants.filter(m =>
            m.name?.toLowerCase().includes(q) ||
            m.category?.toLowerCase().includes(q)
        );
    }, [merchants, state.searchQuery]);

    const { urgentEvents, hotZones, isIdle, shouldAutoPatrol } = useSmartFocus({
        mapRef,
        events: filteredEvents,
        missions,
        activeMissionId: state.selectedMissionId
    });

    const patrolTargets = useMemo((): PatrolTarget[] => {
        const targets: PatrolTarget[] = [];
        hotZones.slice(0, 3).forEach((hz, i) => {
            targets.push({ name: `ZONA CALIENTE ${i + 1}`, pos: hz.center, zoom: 16 });
        });
        urgentEvents.slice(0, 2).forEach(ev => {
            const lat = Number(ev.latitude || ev.lat);
            const lng = Number(ev.longitude || ev.lng);
            if (!isNaN(lat)) {
                targets.push({ name: `EVENTO PROXIMO: ${ev.title}`, pos: [lat, lng], zoom: 17 });
            }
        });
        return targets;
    }, [hotZones, urgentEvents]);

    // 3. Mode Orchestration
    const { patrolIndex, currentTarget } = usePatrolMode({
        mapRef,
        isPatrolling: state.isPatrolling,
        dynamicTargets: patrolTargets
    });

    const { userPos, isLocating: isLocatingInternal, locateUser } = useUserLocation(mapRef);

    // Sync Locate state
    useEffect(() => {
        setState(prev => ({ ...prev, isLocating: isLocatingInternal }));
    }, [isLocatingInternal]);

    // 4. Atmospheric & Weather Systems
    const atmosphere = useTimeAwareness();

    const { canvasRef, isLightningActive } = useRainEngine({
        sceneticEffect: state.sceneticEffect,
        layers,
        centerRef
    });

    const [userWantsPatrol, setUserWantsPatrol] = useState(true);

    // 5. Actions / API
    const setMode = useCallback((mode: TacticalMode) => {
        setState(prev => ({ ...prev, mode }));
        playTacticalSound('CLICK');
    }, []);

    const togglePatrol = useCallback(() => {
        setUserWantsPatrol(prev => !prev);
        setState(prev => {
            const nextPatrol = !prev.isPatrolling;
            return {
                ...prev,
                isPatrolling: nextPatrol,
                mode: nextPatrol ? 'PATROL' : 'IDLE'
            };
        });
        playTacticalSound('CLICK');
    }, []);

    const selectEntity = useCallback((entity: SelectedEntity | null) => {
        setState(prev => {
            const nextMode = entity ? 'FOCUS' : (userWantsPatrol ? 'PATROL' : 'IDLE');
            return {
                ...prev,
                selectedEntity: entity,
                mode: nextMode,
                isPatrolling: entity ? false : userWantsPatrol
            };
        });

        if (entity) {
            playTacticalSound('FOCUS');
            const data = entity.data as any;
            const lat = Number(data.latitude || data.lat || data.destinationLat);
            const lng = Number(data.longitude || data.lng || data.destinationLng);
            if (!isNaN(lat)) {
                mapRef.current?.flyTo([lat, lng], 17, { duration: 1.5 });
            }
        }
    }, [mapRef, userWantsPatrol]);

    const selectMission = useCallback((missionId: string | null) => {
        setState(prev => ({
            ...prev,
            selectedMissionId: missionId,
            mode: missionId ? 'MISSION' : 'IDLE',
            isPatrolling: missionId ? false : userWantsPatrol
        }));
        if (missionId) playTacticalSound('CLICK');
    }, [userWantsPatrol]);

    const setSearchQuery = useCallback((query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const setSceneticEffect = useCallback((effect: SceneticEffect | ((prev: SceneticEffect) => SceneticEffect)) => {
        setState(prev => ({
            ...prev,
            sceneticEffect: typeof effect === 'function' ? effect(prev.sceneticEffect) : effect
        }));
        playTacticalSound('CLICK');
    }, []);

    const toggleCategory = useCallback((category: string) => {
        const cat = category.toLowerCase();
        setState(prev => {
            const current = prev.activeCategories || [];
            const next = current.includes(cat)
                ? current.filter(c => c !== cat)
                : [...current, cat];

            return {
                ...prev,
                activeCategories: next.length === 0 ? null : next
            };
        });
        playTacticalSound('CLICK');
    }, []);

    // 6. Automatic Transitions
    useEffect(() => {
        if (shouldAutoPatrol && !state.isPatrolling && state.mode === 'IDLE' && userWantsPatrol) {
            setState(prev => ({ ...prev, isPatrolling: true, mode: 'PATROL' }));
        } else if (!shouldAutoPatrol && state.isPatrolling && missions.length > 0) {
            setState(prev => ({ ...prev, isPatrolling: false, mode: 'MISSION' }));
        }
    }, [shouldAutoPatrol, state.isPatrolling, state.mode, missions.length, userWantsPatrol]);

    return {
        state: {
            ...state,
            urgentEvents,
            hotZones,
            isIdle,
            patrolIndex,
            currentTarget,
            atmosphere,
            layers,
            canvasRef,
            isLightningActive,
            merchants: filteredMerchants,
            events: filteredEvents,
            isLoading,
            userPos
        },
        actions: {
            setMode,
            togglePatrol,
            selectEntity,
            selectMission,
            setSearchQuery,
            setSceneticEffect,
            toggleCategory,
            setLayers,
            locateUser,
            triggerRefresh,
            toggleFixedMissionCamera: () => {
                setState(prev => ({ ...prev, isFixedMissionCamera: !prev.isFixedMissionCamera }));
                playTacticalSound('CLICK');
            }
        }
    };
};
