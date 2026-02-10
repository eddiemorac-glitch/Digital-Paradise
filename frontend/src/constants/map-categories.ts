import { EventCategory } from '../types/map';

export const CATEGORIES: { id: EventCategory; label: string; icon: string }[] = [
    { id: 'CONCERT', label: 'Conciertos', icon: '🎸' },
    { id: 'FESTIVAL', label: 'Festivales', icon: '🎡' },
    { id: 'NIGHTLIFE', label: 'Fiesta', icon: '✨' },
    { id: 'CULTURE', label: 'Cultura', icon: '🏛️' },
    { id: 'SPORT', label: 'Deporte', icon: '🏆' },
    { id: 'RESTAURANT', label: 'Comida', icon: '🍜' },
    { id: 'WORKSHOP', label: 'Talleres', icon: '🎨' },
    { id: 'SOLAR_PUNK', label: 'Eco', icon: '🌿' },
    { id: 'CHARITY', label: 'Solidarios', icon: '🤝' },
];
