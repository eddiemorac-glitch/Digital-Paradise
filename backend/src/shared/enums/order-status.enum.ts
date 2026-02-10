export enum OrderStatus {
    PENDING = 'PENDING',        // Created, not yet accepted
    CONFIRMED = 'CONFIRMED',    // Accepted by Merchant
    PREPARING = 'PREPARING',    // Kitchen is working
    READY = 'READY',            // Ready for pickup/driver
    ON_WAY = 'ON_WAY',          // Driver has it
    DELIVERED = 'DELIVERED',    // Done
    CANCELLED = 'CANCELLED',    // Sadness
}
