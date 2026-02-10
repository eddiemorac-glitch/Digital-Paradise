// Shared SVG logic for avatars to be used in both React and Leaflet (HTML strings)
export const AVATAR_SVG_CONTENT: Record<string, (color: string) => string> = {
    jaguar: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8 2 4 6 4 10C4 13 6 15 8 16L6 20H18L16 16C18 15 20 13 20 10C20 6 16 2 12 2Z" />
            <path d="M9 10C9 10 10 11 12 11C14 11 15 10 15 10" />
            <circle cx="9" cy="8" r="1" fill="currentColor" />
            <circle cx="15" cy="8" r="1" fill="currentColor" />
        </svg>`,
    toucan: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 10C3 6.686 5.686 4 9 4H14C17.866 4 21 7.134 21 11C21 14.866 17.866 18 14 18H9C5.686 18 3 15.314 3 12V10Z" />
            <path d="M14 8C14 8 16 9 16 11" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
        </svg>`,
    sloth: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 16C4 16 6 20 12 20C18 20 20 16 20 16" />
            <path d="M8 8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
        </svg>`,
    turtle: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4L12 20" />
            <path d="M4 12L20 12" />
            <circle cx="12" cy="12" r="6" />
            <path d="M18 18L16 16" />
            <path d="M6 6L8 8" />
            <path d="M18 6L16 8" />
            <path d="M6 18L8 16" />
        </svg>`,
    monkey: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="10" r="4" />
            <path d="M12 14v4" />
            <path d="M8 18h8" />
            <path d="M4 8C4 8 2 9 2 11C2 13 4 14 4 14" />
            <path d="M20 8C20 8 22 9 22 11C22 13 20 14 20 14" />
        </svg>`,
    dolphin: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-4 10-4 10 4 10 4-3 4-10 4-10-4-10-4z" />
            <circle cx="12" cy="12" r="3" />
        </svg>`,
    radar: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 12L19 12" />
        </svg>`,
    shield: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>`,
    eye: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>`,
    node: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>`,
    core: (c) => `
        <svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
        </svg>`
};
