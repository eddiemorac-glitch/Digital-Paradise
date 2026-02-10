import React, { useRef, useCallback } from 'react';
import { LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import { useMerchantMarkers } from '../../hooks/map/useMerchantMarkers';
import { useMissionMarkers } from '../../hooks/map/useMissionMarkers';

interface LegacyMapHooksProps {
    state: any;
    actions: any;
    missions: any[];
    activeMission: any;
    mapRef: React.MutableRefObject<L.Map | null>;
    userPos?: [number, number] | null;
    driverPos?: [number, number] | null;
}

export const LegacyMapHooks: React.FC<LegacyMapHooksProps> = ({
    state,
    actions,
    missions,
    activeMission,
    mapRef,
    userPos,
    driverPos
}) => {
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
        activeMissionId: activeMission?.id || null, // Ensure ID extraction logic matches parent
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
