// SVG filter definitions for LiveMap effects

export const MapFilters = () => (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true" focusable="false">
        <defs>
            {/* Organic Glow Filter */}
            <filter id="organic-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>

            {/* Heat Distortion/Turbulence Filter (For Special Events) */}
            <filter id="heat-distortion">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.1" numOctaves="2" result="noise">
                    <animate attributeName="baseFrequency" values="0.01 0.1; 0.02 0.2; 0.01 0.1" dur="5s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
            </filter>

            {/* Chromatic Aberration (Subtle Tactical feel) */}
            <filter id="chromatic-aberration">
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
                <feOffset in="r" dx="1" dy="0" result="r-offset" />
                <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
                <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
                <feOffset in="b" dx="-1" dy="0" result="b-offset" />
                <feBlend in="r-offset" in2="g" mode="screen" result="rg" />
                <feBlend in="rg" in2="b-offset" mode="screen" />
            </filter>
        </defs>
    </svg>
);
