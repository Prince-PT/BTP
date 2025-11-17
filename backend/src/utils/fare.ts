/**
 * Fare calculation utilities for campus ride-sharing
 * Pricing model:
 * - Base fare: ₹20 (convenience fee)
 * - Per km rate: ₹10/km
 * - Shared rides: Split proportionally based on distance
 */

export const FARE_CONFIG = {
  BASE_FARE: 20, // ₹20 convenience fee
  PER_KM_RATE: 10, // ₹10 per kilometer
  MIN_FARE: 30, // Minimum fare ₹30
};

/**
 * Calculate fare for a single passenger
 */
export function calculateBaseFare(distanceInKm: number): number {
  const fare = FARE_CONFIG.BASE_FARE + distanceInKm * FARE_CONFIG.PER_KM_RATE;
  return Math.max(fare, FARE_CONFIG.MIN_FARE);
}

/**
 * Calculate estimated fare for a passenger considering current passengers
 * If the ride is shared, estimate based on proportional sharing
 */
export function calculateEstimatedFare(
  passengerDistance: number,
  currentPassengerCount: number,
  totalRideDistance: number
): number {
  // Base calculation for this passenger's segment
  const baseFare = calculateBaseFare(passengerDistance);

  // If sharing with others, adjust based on overlap
  if (currentPassengerCount > 0 && totalRideDistance > 0) {
    // Calculate what portion of the total route this passenger uses
    const usageRatio = passengerDistance / totalRideDistance;
    
    // Convenience fee is always per person
    // Distance charge is split based on usage
    const sharedDistanceCost = (totalRideDistance * FARE_CONFIG.PER_KM_RATE * usageRatio);
    return Math.round(FARE_CONFIG.BASE_FARE + sharedDistanceCost);
  }

  return Math.round(baseFare);
}

/**
 * Recalculate fares for all passengers when route changes
 * Returns updated fare for each passenger based on their journey segment
 */
export function recalculateFaresForSharedRide(
  passengers: Array<{
    id: string;
    distance: number;
  }>,
  totalRideDistance: number
): Map<string, number> {
  const fareMap = new Map<string, number>();
  const totalPassengerCount = passengers.length;

  passengers.forEach((passenger) => {
    const fare = calculateEstimatedFare(
      passenger.distance,
      totalPassengerCount - 1,
      totalRideDistance
    );
    fareMap.set(passenger.id, fare);
  });

  return fareMap;
}

/**
 * Calculate detour cost for new passenger addition
 */
export function calculateDetourCost(
  originalDistance: number,
  newDistance: number
): number {
  const extraDistance = newDistance - originalDistance;
  if (extraDistance <= 0) return 0;

  return Math.round(extraDistance * FARE_CONFIG.PER_KM_RATE);
}
