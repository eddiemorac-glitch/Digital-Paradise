
import React, { memo } from 'react';
import { useDroneLayer } from '../../hooks/map/useDroneLayer';
import { DroneMarker } from './DroneMarker';

export const DroneLayer: React.FC = memo(() => {
    const drones = useDroneLayer();

    return (
        <>
            {drones.map(drone => (
                <DroneMarker key={drone.id} drone={drone} />
            ))}
        </>
    );
});
