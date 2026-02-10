export const NEON_ARTS: Record<string, (c: string) => string> = {
    CONCERT: (c) => `<svg viewBox="0 0 100 100"><path d="M50 10 Q70 45 50 90 Q30 45 50 10" fill="none" stroke="${c}" stroke-width="3" /><path d="M50 30 Q65 55 50 80 Q35 55 50 30" fill="${c}" opacity="0.4"/></svg>`,
    FESTIVAL: (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="10 5"/><path d="M30 50 L70 50 M50 30 L50 70" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>`,
    WORKSHOP: (c) => `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" fill="none" stroke="${c}" stroke-width="3"/><path d="M25 50 H75 M50 25 V75" stroke="${c}" stroke-width="1.5"/></svg>`,
    SPORT: (c) => `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="${c}" stroke-width="3"/><path d="M20 20 L80 80 M80 20 L20 80" stroke="${c}" stroke-width="2"/></svg>`,
    RESTAURANT: (c) => `<svg viewBox="0 0 100 100"><path d="M40 20 V80 M60 20 V80 M30 30 Q50 10 70 30" fill="none" stroke="${c}" stroke-width="3"/></svg>`,
    NIGHTLIFE: (c) => `<svg viewBox="0 0 100 100"><path d="M30 70 Q50 30 70 70" fill="none" stroke="${c}" stroke-width="3"/><circle cx="50" cy="30" r="10" fill="${c}"/></svg>`,
    CULTURE: (c) => `<svg viewBox="0 0 100 100"><path d="M50 20 L80 80 H20 Z" fill="none" stroke="${c}" stroke-width="3"/><circle cx="50" cy="50" r="10" fill="${c}"/></svg>`,
    SOLAR_PUNK: (c) => `<svg viewBox="0 0 100 100"><path d="M50 20 Q70 40 50 80 Q30 40 50 20" fill="none" stroke="${c}" stroke-width="3"/><path d="M50 40 L65 30 M50 55 L70 45" stroke="${c}" stroke-width="2"/></svg>`,
    CHARITY: (c) => `<svg viewBox="0 0 100 100"><path d="M50 80 L20 50 A20 20 0 0 1 50 20 A20 20 0 0 1 80 50 Z" fill="none" stroke="${c}" stroke-width="3"/></svg>`,
    OTHER: (c) => `<svg viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" fill="none" stroke="${c}" stroke-width="3" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="5" fill="${c}"/></svg>`
};
