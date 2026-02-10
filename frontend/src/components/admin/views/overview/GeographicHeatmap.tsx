import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeographicHeatmapProps {
    data?: any[];
}

export const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({ data }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Initialize map
        mapInstance.current = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            dragging: false, // Static map for aesthetic
            scrollWheelZoom: false
        }).setView([9.9333, -84.0833], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            opacity: 0.5,
            className: 'map-tiles' // CSS filter can be applied here or via class
        }).addTo(mapInstance.current);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstance.current || !data) return;

        // Clear existing circles (simplified: just add new ones for now, or use a layerGroup)
        const circlesLayer = L.layerGroup().addTo(mapInstance.current);

        data.forEach(point => {
            const lat = Number(point.lat);
            const lng = Number(point.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                L.circle([lat, lng], {
                    radius: 500,
                    fillColor: '#00ecff',
                    color: '#00ecff',
                    fillOpacity: 0.4,
                    weight: 0
                }).addTo(circlesLayer);
            }
        });

        return () => {
            circlesLayer.remove();
        };
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-[3.5rem] border-white/5 col-span-1 lg:col-span-2 overflow-hidden h-[500px] relative"
        >
            <div className="absolute top-8 left-8 z-[1000] pointer-events-none">
                <h3 className="text-xl font-black uppercase tracking-tight italic drop-shadow-lg">Densidad Geográfica</h3>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest drop-shadow-lg">Distribución de demanda en tiempo real</p>
            </div>

            <div className="absolute inset-0 z-0">
                <div ref={mapRef} style={{ height: '100%', width: '100%', filter: 'grayscale(1) invert(1) opacity(0.5)' }} />
            </div>

            {/* Gradient Overlay for Map Integration */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0f18] via-transparent to-transparent opacity-60" />
        </motion.div>
    );
};
