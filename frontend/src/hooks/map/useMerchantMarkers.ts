import { useEffect } from 'react';
import L from 'leaflet';
import { MerchantData } from '../../types/map';
import { AVATAR_SVG_CONTENT } from '../../assets/avatar-svgs';
import { getMerchantAvailability } from '../../utils/merchant';

interface UseMerchantMarkersProps {
    mapRef: React.RefObject<L.Map | null>;
    localesGroupRef: React.RefObject<L.LayerGroup | null>;
    merchants: MerchantData[];
    showMerchants: boolean;
    onSelectMerchant: (merchant: MerchantData) => void;
    onClearMissionSelection: () => void;
}

export const useMerchantMarkers = ({
    mapRef,
    localesGroupRef,
    merchants,
    showMerchants,
    onSelectMerchant,
    onClearMissionSelection
}: UseMerchantMarkersProps) => {
    useEffect(() => {
        if (!mapRef.current || !localesGroupRef.current) return;

        const group = localesGroupRef.current;
        group.clearLayers();

        if (!showMerchants) return;

        merchants.forEach(merchant => {
            const availability = getMerchantAvailability(merchant);
            const isFood = merchant.category?.toLowerCase().includes('food') ||
                merchant.category?.toLowerCase().includes('restaurante');
            const baseColor = isFood ? '#00ff66' : '#ff00ee';
            const color = availability.available ? baseColor : '#666666';

            const lat = Number(merchant.latitude);
            const lng = Number(merchant.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
                const glowStyle = availability.available ? `box-shadow: 0 0 20px ${color}` : '';
                const opacityStyle = availability.available ? 'opacity: 1' : 'opacity: 0.5; filter: grayscale(1)';

                let innerHtml = `<div class="merchant-dot" style="background: ${color}; ${glowStyle}; ${opacityStyle}"></div>`;

                if (merchant.avatarId && AVATAR_SVG_CONTENT[merchant.avatarId]) {
                    innerHtml = `<div class="merchant-avatar" style="color: ${color}; ${opacityStyle}">${AVATAR_SVG_CONTENT[merchant.avatarId](baseColor)}</div>`;
                }

                const mIcon = L.divIcon({
                    html: `<div class="merchant-marker-wrap" style="${opacityStyle}">${innerHtml}</div>`,
                    className: 'custom-div-icon',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                L.marker([lat, lng], { icon: mIcon })
                    .addTo(group)
                    .on('click', () => {
                        onSelectMerchant(merchant);
                        onClearMissionSelection();
                    });
            }
        });

    }, [mapRef, localesGroupRef, merchants, showMerchants, onSelectMerchant, onClearMissionSelection]);
};
