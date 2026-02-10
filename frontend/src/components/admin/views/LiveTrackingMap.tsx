import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socketService } from '../../../api/socket';
import { Truck, Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet + Repackagers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DriverLocation {
    missionId: string;
    lat: number;
    lng: number;
    status?: string;
    timestamp: string;
    metersToDestination?: number;
    tripState?: 'ON_WAY' | 'NEAR_DESTINATION' | 'ARRIVED' | 'DELIVERED';
}

const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
};

export const LiveTrackingMap: React.FC = () => {
    const [drivers, setDrivers] = useState<Record<string, DriverLocation>>({});
    const [focusedDriver, setFocusedDriver] = useState<string | null>(null);

    useEffect(() => {
        socketService.connect();

        socketService.onDriverLocationUpdated((data: any) => {
            setDrivers(prev => ({
                ...prev,
                [data.missionId]: {
                    ...data,
                    // Handle both backend naming variations
                    metersToDestination: data.metersToDestination || data.metersRemaining,
                    tripState: data.tripState || (data.status === 'READY' ? 'ON_WAY' : data.status)
                }
            }));
        });
    }, []);

    const activeDrivers = Object.values(drivers);

    return (
        <div className="relative w-full h-[600px] rounded-[3rem] overflow-hidden border border-white/10 glass shadow-2xl">
            <MapContainer
                center={[9.9333, -84.0833]}
                zoom={13}
                style={{ height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {activeDrivers.map((driver) => {
                    const isNear = driver.tripState === 'NEAR_DESTINATION' || (driver.metersToDestination && driver.metersToDestination < 300);
                    const isArrived = driver.tripState === 'ARRIVED';

                    return (
                        <Marker
                            key={driver.missionId}
                            position={[driver.lat, driver.lng]}
                        >
                            <Popup className="glass-popup">
                                <div className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isNear ? 'bg-yellow-400' : isArrived ? 'bg-green-500' : 'bg-primary'}`} />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Misión #{driver.missionId.slice(-6)}</p>
                                    </div>
                                    <p className="text-[12px] text-white font-bold">
                                        {isArrived ? '📍 EN DESTINO' : isNear ? '🚀 LLEGANDO' : '🚚 EN CAMINO'}
                                    </p>
                                    {driver.metersToDestination && (
                                        <p className="text-[10px] text-primary/80 font-black mt-1">
                                            {driver.metersToDestination}m restantes
                                        </p>
                                    )}
                                    <p className="text-[8px] text-white/40 font-bold uppercase mt-2 italic">Actualizado: {new Date(driver.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {focusedDriver && drivers[focusedDriver] && (
                    <RecenterMap lat={drivers[focusedDriver].lat} lng={drivers[focusedDriver].lng} />
                )}
            </MapContainer>

            {/* Overlay: Operational HUD */}
            <div className="absolute top-8 left-8 z-[1000] flex flex-col gap-3">
                <div className="glass p-5 rounded-[2rem] border-white/10 backdrop-blur-3xl shadow-2xl w-72">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Navigation className="text-primary animate-pulse" size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest italic text-white leading-none">COMMAND CENTER</h3>
                            <p className="text-[9px] text-primary font-black uppercase tracking-tighter mt-1">LOGISTICS STABILIZATION v2.0</p>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 border-t border-white/5 pt-4">
                        <div className="flex-1">
                            <p className="text-[8px] text-white/40 font-black uppercase">Drivers</p>
                            <p className="text-xl font-black italic text-white">{activeDrivers.length}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex-1">
                            <p className="text-[8px] text-white/40 font-black uppercase">POD Pending</p>
                            <p className="text-xl font-black italic text-yellow-400">
                                {activeDrivers.filter(d => d.tripState === 'ARRIVED').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Driver List Controls */}
            <div className="absolute top-8 right-8 z-[1000] flex flex-col gap-2 max-h-[80%] overflow-y-auto pr-2 scrollbar-none">
                {activeDrivers.map(d => {
                    const isArrived = d.tripState === 'ARRIVED';
                    const isNear = d.tripState === 'NEAR_DESTINATION';

                    return (
                        <button
                            key={d.missionId}
                            onClick={() => setFocusedDriver(d.missionId)}
                            className={`glass p-4 rounded-2xl border transition-all flex items-center gap-4 group ${focusedDriver === d.missionId ? 'border-primary bg-primary/10 w-64' : 'border-white/5 hover:bg-white/5 w-56'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${focusedDriver === d.missionId ? 'bg-primary text-black' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'} ${isArrived ? 'shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''}`}>
                                <Truck size={18} className={isArrived ? 'text-green-500' : ''} />
                            </div>
                            <div className="text-left flex-1">
                                <div className="flex justify-between items-start">
                                    <p className={`text-xs font-black uppercase tracking-tight ${focusedDriver === d.missionId ? 'text-white' : 'text-white/60'}`}>#{d.missionId.slice(-6)}</p>
                                    {d.metersToDestination && (
                                        <p className="text-[8px] font-black text-primary">{d.metersToDestination}m</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isArrived ? 'bg-green-500' : isNear ? 'bg-yellow-400' : 'bg-primary'}`} />
                                    <p className="text-[9px] text-white/40 font-black uppercase">
                                        {isArrived ? 'ARRIVED (POD)' : isNear ? 'LLEGANDO' : 'EN CAMINO'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
