import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface MapLocationPickerProps {
    initialPosition?: [number, number];
    onPositionChange: (lat: number, lng: number) => void;
    zoom?: number;
}

const PUERTO_VIEJO_CENTER: [number, number] = [9.6560, -82.7534];

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
    initialPosition,
    onPositionChange,
    zoom = 14
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [position, setPosition] = useState<[number, number]>(initialPosition || PUERTO_VIEJO_CENTER);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Initialize map
        const map = L.map(containerRef.current, {
            center: position,
            zoom,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        // Custom pin icon
        const pinIcon = L.divIcon({
            html: `
                <div class="relative flex items-center justify-center">
                    <div class="absolute w-8 h-8 bg-primary/30 rounded-full animate-ping"></div>
                    <div class="relative w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </div>
                </div>
            `,
            className: 'custom-pin-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        // Add draggable marker
        const marker = L.marker(position, {
            icon: pinIcon,
            draggable: true
        }).addTo(map);

        marker.on('dragend', () => {
            const pos = marker.getLatLng();
            setPosition([pos.lat, pos.lng]);
            onPositionChange(pos.lat, pos.lng);
        });

        // Click to move marker
        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            setPosition([e.latlng.lat, e.latlng.lng]);
            onPositionChange(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update marker when position changes externally
    useEffect(() => {
        if (markerRef.current && initialPosition) {
            markerRef.current.setLatLng(initialPosition);
            mapRef.current?.setView(initialPosition);
        }
    }, [initialPosition]);

    const handleUseMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setPosition(newPos);
                    markerRef.current?.setLatLng(newPos);
                    mapRef.current?.setView(newPos, 16);
                    onPositionChange(pos.coords.latitude, pos.coords.longitude);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                }
            );
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) return;

        try {
            // Use Nominatim for geocoding (free, no API key needed)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1`
            );
            const results = await response.json();

            if (results.length > 0) {
                const { lat, lon } = results[0];
                const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
                setPosition(newPos);
                markerRef.current?.setLatLng(newPos);
                mapRef.current?.setView(newPos, 16);
                onPositionChange(parseFloat(lat), parseFloat(lon));
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder="Buscar ubicación..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-primary/50"
                    />
                </form>
                <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-primary text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                    <Navigation size={12} />
                    Mi ubicación
                </button>
            </div>

            <div
                ref={containerRef}
                className="h-48 rounded-2xl overflow-hidden border border-white/10 relative"
                style={{ background: '#0a0f18' }}
            />

            <motion.div
                key={`${position[0]}-${position[1]}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5"
            >
                <MapPin size={14} className="text-primary" />
                <div className="flex-1 text-[10px] font-mono text-white/60">
                    <span className="text-white/40">Lat:</span> {position[0].toFixed(6)},
                    <span className="text-white/40 ml-2">Lng:</span> {position[1].toFixed(6)}
                </div>
            </motion.div>

            <p className="text-[10px] text-white/30 text-center">
                Haz clic en el mapa o arrastra el pin para ajustar la ubicación
            </p>
        </div>
    );
};
