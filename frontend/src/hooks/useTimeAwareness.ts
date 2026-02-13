import { useState, useEffect, useMemo } from 'react';

export type TimeOfDay = 'SUNRISE' | 'DAY' | 'GOLDEN' | 'NIGHT' | 'STEALTH';

interface TimeAwarenessState {
    timeOfDay: TimeOfDay;
    hour: number;
    atmosphereClass: string;
    neonIntensity: number;
    ambientHue: number;
    displayName: string;
}

const getTimeOfDay = (_hour: number): TimeOfDay => {
    // FORCE SUNNY/DAY MODE AS REQUESTED BY USER
    return 'DAY';
    // if (hour >= 6 && hour < 10) return 'SUNRISE';
    // if (hour >= 10 && hour < 16) return 'DAY';
    // if (hour >= 16 && hour < 19) return 'GOLDEN';
    // if (hour >= 19 && hour < 22) return 'NIGHT';
    // return 'STEALTH';
};

const TIME_CONFIG: Record<TimeOfDay, { class: string; neon: number; hue: number; nameKey: string }> = {
    SUNRISE: { class: 'atmosphere-sunrise', neon: 0.6, hue: 30, nameKey: 'time_sunrise' },
    DAY: { class: 'atmosphere-day', neon: 0.4, hue: 0, nameKey: 'time_day' },
    GOLDEN: { class: 'atmosphere-golden', neon: 0.8, hue: 25, nameKey: 'time_golden' },
    NIGHT: { class: 'atmosphere-night', neon: 1.0, hue: 240, nameKey: 'time_night' },
    STEALTH: { class: 'atmosphere-stealth', neon: 0.7, hue: 200, nameKey: 'time_stealth' }
};

export const useTimeAwareness = (): TimeAwarenessState => {
    const [hour, setHour] = useState(() => new Date().getHours());

    useEffect(() => {
        // Update every minute
        const interval = setInterval(() => {
            setHour(new Date().getHours());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const state = useMemo((): TimeAwarenessState => {
        const timeOfDay = getTimeOfDay(hour);
        const config = TIME_CONFIG[timeOfDay];

        return {
            timeOfDay,
            hour,
            atmosphereClass: config.class,
            neonIntensity: config.neon,
            ambientHue: config.hue,
            displayName: config.nameKey
        };
    }, [hour]);

    return state;
};
