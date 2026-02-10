/**
 * Delivery Pricing Engine for Costa Rica Market
 * 
 * Calculates courier earnings based on actual distance traveled,
 * surge conditions, and tips. All amounts in CRC (Costa Rican Colón).
 */
import { VehicleType } from '../enums/vehicle-type.enum';

// ==================== PRICING CONSTANTS ====================
export const PRICING = {
    BASE_COURIER_FEE: 500,        // ₡500 base per delivery
    PER_KM_RATE: 300,             // ₡300 per km
    MIN_COURIER_PAYMENT: 800,     // minimum ₡800 per delivery
    MAX_COURIER_PAYMENT: 5000,    // cap at ₡5,000
    SURGE_POOL_THRESHOLD: 5,      // missions in pool triggers surge
    SURGE_MULTIPLIER: 1.25,       // 25% surge pricing
    PLATFORM_DELIVERY_CUT: 0.10,  // Platform keeps 10% of delivery fee
} as const;

// Speed estimates by vehicle (km/h average in Caribbean Costa Rica)
const VEHICLE_SPEEDS: Record<string, number> = {
    [VehicleType.WALKING]: 5,
    [VehicleType.BICYCLE]: 12,
    [VehicleType.MOTORCYCLE]: 25,
    [VehicleType.CAR]: 20,
    [VehicleType.VAN]: 18,
};

const DEFAULT_SPEED = 20; // km/h fallback

// ==================== CORE FUNCTIONS ====================

/**
 * Calculate courier earnings for a delivery based on distance.
 * Formula: BASE + (distance × PER_KM) × surgeMultiplier + tip
 * Clamped between MIN and MAX thresholds.
 */
export function calculateCourierEarnings(
    distanceKm: number,
    isSurge: boolean = false,
    courierTip: number = 0,
): number {
    const surgeMultiplier = isSurge ? PRICING.SURGE_MULTIPLIER : 1.0;
    const baseEarnings = PRICING.BASE_COURIER_FEE + (distanceKm * PRICING.PER_KM_RATE);
    const withSurge = baseEarnings * surgeMultiplier;

    // Clamp to min/max (before tip)
    const clamped = Math.min(
        PRICING.MAX_COURIER_PAYMENT,
        Math.max(PRICING.MIN_COURIER_PAYMENT, withSurge)
    );

    // Tip is always 100% to courier, never clamped
    return Math.round(clamped + courierTip);
}

/**
 * Calculate the delivery fee charged to the customer.
 * The delivery fee is the courier earnings + platform cut.
 */
export function calculateDeliveryFee(
    distanceKm: number,
    isSurge: boolean = false,
): number {
    const courierPart = calculateCourierEarnings(distanceKm, isSurge, 0);
    // Fee = courier earnings / (1 - platform cut)
    const fee = courierPart / (1 - PRICING.PLATFORM_DELIVERY_CUT);
    return Math.round(fee);
}

/**
 * Estimate delivery time in minutes based on distance and vehicle type.
 * Includes a fixed 5-minute pickup buffer.
 */
export function calculateEstimatedMinutes(
    distanceKm: number,
    vehicleType?: VehicleType | string,
): number {
    const speed = VEHICLE_SPEEDS[vehicleType || ''] || DEFAULT_SPEED;
    const travelMinutes = (distanceKm / speed) * 60;
    const pickupBuffer = 5; // 5 min to park + collect food
    return Math.max(10, Math.round(travelMinutes + pickupBuffer));
}

/**
 * Determine if surge pricing applies based on available mission count.
 */
export function isSurgePricing(availableMissionCount: number): boolean {
    return availableMissionCount >= PRICING.SURGE_POOL_THRESHOLD;
}

/**
 * Calculate the platform's cut from a delivery fee.
 */
export function calculatePlatformDeliveryCut(deliveryFee: number): number {
    return Math.round(deliveryFee * PRICING.PLATFORM_DELIVERY_CUT);
}
