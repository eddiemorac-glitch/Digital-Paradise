
import { ReactNode } from 'react';
import {
    Music,
    Utensils,
    Palmtree,
    Flame,
    Waves,
    Palette,
    Users,
    Tent
} from 'lucide-react';
import { EventType } from './event';

export type { EventType };

/**
 * Maps a backend category to a frontend visual EventType
 */
export const getEventTypeFromCategory = (category: string): EventType => {
    const lowCat = category?.toLowerCase() || 'other';
    switch (lowCat) {
        case 'concert': return 'concert';
        case 'festival': return 'festival';
        case 'restaurant': return 'gastronomy';
        case 'sport': return 'adventure';
        case 'nightlife': return 'fire';
        case 'culture': return 'art';
        case 'workshop': return 'art';
        case 'solar_punk': return 'eco';
        case 'charity': return 'social';
        case 'eco': return 'eco';
        case 'social': return 'social';
        case 'art': return 'art';
        default: return 'social';
    }
};

export interface EventTypeConfig {
    label: string;
    color: string;
    icon: ReactNode;
}

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
    social: {
        label: 'Social',
        color: '#F472B6', // pink-400
        icon: <Users size={20} />
    },
    concert: {
        label: 'Concierto',
        color: '#A78BFA', // violet-400
        icon: <Music size={20} />
    },
    gastronomy: {
        label: 'Gastronomía',
        color: '#FBBF24', // amber-400
        icon: <Utensils size={20} />
    },
    adventure: {
        label: 'Aventura',
        color: '#34D399', // emerald-400
        icon: <Tent size={20} />
    },
    festival: {
        label: 'Festival',
        color: '#FB923C', // orange-400
        icon: <Tent size={20} />
    },
    fire: {
        label: 'Nightlife',
        color: '#F87171', // red-400
        icon: <Flame size={20} />
    },
    reggae: {
        label: 'Reggae',
        color: '#FCD34D', // amber-300 (Rasta yellow)
        icon: <Music size={20} />
    },
    surf: {
        label: 'Surf',
        color: '#60A5FA', // blue-400
        icon: <Waves size={20} />
    },
    art: {
        label: 'Arte',
        color: '#C084FC', // purple-400
        icon: <Palette size={20} />
    },
    eco: {
        label: 'Eco',
        color: '#84CC16', // lime-500
        icon: <Palmtree size={20} />
    }
};
