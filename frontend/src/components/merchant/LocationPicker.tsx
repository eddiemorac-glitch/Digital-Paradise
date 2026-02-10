import React, { useMemo, useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
}

const LocationMarker = ({ position, onPositionChange }: { position: L.LatLng, onPositionChange: (lat: number, lng: number) => void }) => {
    const markerRef = useRef<L.Marker>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    onPositionChange(lat, lng);
                }
            },
        }),
        [onPositionChange],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
};

const MapController = ({ center }: { center: L.LatLng }) => {
    const map = useMapEvents({});
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export const LocationPicker = ({ latitude, longitude, onLocationChange }: LocationPickerProps) => {
    // Default to Puerto Viejo if 0/0
    const initialLat = latitude || 9.6558;
    const initialLng = longitude || -82.7538;

    const [position, setPosition] = useState<L.LatLng>(new L.LatLng(initialLat, initialLng));

    useEffect(() => {
        if (latitude && longitude) {
            setPosition(new L.LatLng(latitude, longitude));
        }
    }, [latitude, longitude]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] ml-2 flex items-center gap-2">
                    <MapPin size={12} />
                    Ubicación Exacta
                </label>
                <div className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                    {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                </div>
            </div>

            <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
                <MapContainer
                    center={position}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                    style={{ zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <LocationMarker
                        position={position}
                        onPositionChange={onLocationChange}
                    />
                    <MapController center={position} />
                </MapContainer>

                <div className="absolute bottom-4 left-4 z-[400] bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/10 max-w-[200px]">
                    <p className="text-[9px] text-white/60 leading-tight">
                        Arrastra el marcador para ajustar la ubicación exacta de tu negocio.
                    </p>
                </div>
            </div>
        </div>
    );
};
