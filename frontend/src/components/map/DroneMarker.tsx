import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Drone } from '../../types/drones';

// Custom Drone Icon
const getDroneIcon = (bearing: number, status: string) => L.divIcon({
    className: 'custom-drone-icon',
    html: `
        <div class="relative w-8 h-8 flex items-center justify-center transition-transform duration-300" style="transform: rotate(${bearing}deg);">
            <!-- Drone Body -->
            <svg viewBox="0 0 24 24" fill="none" stroke="${status === 'DELIVERING' ? '#00ecff' : '#ffaa00'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_5px_rgba(0,236,255,0.8)]">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <!-- Propellers (Animated via CSS) -->
            <div class="absolute -top-1 -left-1 w-3 h-3 border border-white/50 rounded-full animate-[spin_0.2s_linear_infinite]"></div>
            <div class="absolute -top-1 -right-1 w-3 h-3 border border-white/50 rounded-full animate-[spin_0.2s_linear_infinite]"></div>
            <div class="absolute -bottom-1 -left-1 w-3 h-3 border border-white/50 rounded-full animate-[spin_0.2s_linear_infinite]"></div>
            <div class="absolute -bottom-1 -right-1 w-3 h-3 border border-white/50 rounded-full animate-[spin_0.2s_linear_infinite]"></div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

interface DroneMarkerProps {
    drone: Drone;
}

import { useLanguageStore } from '../../store/languageStore';

export const DroneMarker: React.FC<DroneMarkerProps> = ({ drone }) => {
    const { t } = useLanguageStore();

    return (
        <Marker
            position={drone.location}
            icon={getDroneIcon(drone.bearing, drone.status)}
            zIndexOffset={1000} // Fly above everything
        >
            <Popup className="glass-popup">
                <div className="p-2 min-w-[150px]">
                    <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-1">
                        {drone.callsign}
                    </h3>
                    <div className="text-[10px] text-white/70 font-mono space-y-1">
                        <div className="flex justify-between">
                            <span>{t('status_label')}:</span>
                            <span className={drone.status === 'IDLE' ? 'text-yellow-400' : 'text-green-400'}>
                                {drone.status === 'IDLE' ? t('idle') || 'IDLE' : drone.status}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>{t('battery')}:</span>
                            <span className={drone.batteryLevel < 20 ? 'text-red-500' : 'text-cyan-300'}>{drone.batteryLevel}%</span>
                        </div>
                        {drone.missionId && (
                            <div className="pt-1 border-t border-white/10 mt-1">
                                {t('mission_label')}: {drone.missionId.split('-')[0].toUpperCase()}...
                            </div>
                        )}
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};
