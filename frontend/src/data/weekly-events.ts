import { Event } from '../types/event';

export const WEEKLY_EVENTS: Event[] = [
    {
        id: 'weekly-1',
        title: 'Noche de Salsa & Reggae',
        description: 'La mejor música en vivo frente al mar. Disfruta de ritmos caribeños y cocteles tropicales.',
        date: 'Cada Viernes',
        time: '20:00',
        location: { type: 'Point', coordinates: [-82.7538, 9.6558] },
        locationName: 'Playa Puerto Viejo',
        venue: 'Salsa Brava',
        category: 'nightlife',
        type: 'fire',
        adTier: 'GOLD',
        adSize: 'LARGE',
        attendees: 150,
        isEcoFriendly: true,
        bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1000'
    },
    {
        id: 'weekly-2',
        title: 'Mercadito Artesanal',
        description: 'Artesanías locales, comida orgánica y diseño independiente del Caribe Sur.',
        date: 'Sábados',
        time: '09:00',
        location: { type: 'Point', coordinates: [-82.7558, 9.6578] },
        locationName: 'Centro de Puerto Viejo',
        venue: 'Plaza Central',
        category: 'culture',
        type: 'art',
        adTier: 'SILVER',
        adSize: 'MEDIUM',
        attendees: 80,
        isEcoFriendly: true,
        bannerUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=1000'
    },
    {
        id: 'weekly-3',
        title: 'Yoga al Amanecer',
        description: 'Conecta con la naturaleza en una sesión revitalizante frente a las olas de Playa Cocles.',
        date: 'Lunes a Jueves',
        time: '06:30',
        location: { type: 'Point', coordinates: [-82.7338, 9.6458] },
        locationName: 'Playa Cocles',
        venue: 'Jungle Retreat',
        category: 'workshop',
        type: 'social',
        adTier: 'BRONZE',
        adSize: 'SMALL',
        attendees: 12,
        isEcoFriendly: true,
        bannerUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1000'
    }
];
