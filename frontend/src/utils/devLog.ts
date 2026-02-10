/**
 * Centralized logging utility for Caribe Digital.
 * Only outputs to console in development mode.
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: any[]) => {
    if (isDev) {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
};

export const devError = (...args: any[]) => {
    if (isDev) {
        // eslint-disable-next-line no-console
        console.error(...args);
    }
};

export const devWarn = (...args: any[]) => {
    if (isDev) {
        // eslint-disable-next-line no-console
        console.warn(...args);
    }
};
