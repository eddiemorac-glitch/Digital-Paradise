/**
 * Checks if a merchant is currently open based on their opening hours structure.
 * Mimics backend logic for consistency.
 */
export const isMerchantOpen = (openingHours: any): boolean => {
    if (!openingHours) return true; // Default to open if no schedule set

    // Costa Rica is UTC-6
    const now = new Date();
    // Adjust for UTC-6 (Costa Rica doesn't have DST)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const crTime = new Date(utc + (3600000 * -6));

    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const currentDay = days[crTime.getDay()];
    const schedule = openingHours[currentDay];

    if (!schedule || schedule.closed) return false;

    const currentTimeStr = `${String(crTime.getHours()).padStart(2, '0')}:${String(crTime.getMinutes()).padStart(2, '0')}`;

    return currentTimeStr >= schedule.open && currentTimeStr <= schedule.close;
};

/**
 * Returns a detailed availability status for the merchant.
 */
export const getMerchantAvailability = (merchant: any) => {
    if (!merchant.isActive) return { available: false, reason: 'OFFLINE' };
    if (merchant.operationalSettings?.isBusy) return { available: false, reason: 'BUSY' };
    if (!isMerchantOpen(merchant.openingHours)) return { available: false, reason: 'CLOSED' };
    return { available: true };
};
