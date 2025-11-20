/**
 * Haversine formula to calculate distance between two points on Earth
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Calculate route distance with an additional stop
 * This is a simplified version using straight-line distances
 * For production, consider using a routing API like OpenRouteService
 */
export const calculateRouteDistanceWithStop = (
  originLat: number,
  originLng: number,
  stopLat: number,
  stopLng: number,
  destLat: number,
  destLng: number
): number => {
  const distance1 = calculateDistance(originLat, originLng, stopLat, stopLng);
  const distance2 = calculateDistance(stopLat, stopLng, destLat, destLng);
  return distance1 + distance2;
};

/**
 * Calculate bounding box for geo queries
 */
export const getBoundingBox = (
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } => {
  const latDelta = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos(toRad(lat)));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
};

/**
 * Calculate price for a ride segment (in INR - Indian Rupees)
 * 
 * Indian rideshare pricing structure:
 * - Base fare: ₹30 (minimum charge)
 * - Per km rate: ₹10/km for regular distance
 * - Offset rate: ₹15/km for additional detour
 * - Peak hours multiplier: 1.5x (6-10 AM, 5-10 PM)
 * - Minimum fare: ₹30
 * - Per rider charge for multi-passenger bookings
 */
export const calculatePrice = (
  distanceKm: number,
  offsetKm: number = 0,
  numberOfRiders: number = 1
): number => {
  // Indian rideshare pricing (in INR)
  const BASE_FARE = 30;           // ₹30 base fare
  const RATE_PER_KM = 10;         // ₹10 per km
  const OFFSET_RATE_PER_KM = 15;  // ₹15 per km for offset/detour
  const MINIMUM_FARE = 30;        // ₹30 minimum
  
  // Calculate base cost
  const distanceCost = distanceKm * RATE_PER_KM;
  const offsetCost = offsetKm * OFFSET_RATE_PER_KM;
  
  // Total fare = base + distance + offset
  let totalFare = BASE_FARE + distanceCost + offsetCost;
  
  // Apply minimum fare
  totalFare = Math.max(totalFare, MINIMUM_FARE);
  
  // For multiple riders in the SAME booking, charge per person
  // This is fair as each person takes a seat
  const farePerRider = totalFare * numberOfRiders;
  
  // Round to nearest rupee
  return Math.round(farePerRider);
};

/**
 * Calculate shared ride pricing (in INR)
 * When multiple people share a ride, they split the cost
 */
export const calculateSharedPrice = (
  soloDistanceKm: number,
  sharedDistanceKm: number,
  totalSharers: number,
  offsetKm: number = 0
): number => {
  const BASE_FARE = 30;
  const RATE_PER_KM = 10;
  const OFFSET_RATE_PER_KM = 15;
  
  // Solo distance: full price for this rider
  const soloCost = soloDistanceKm * RATE_PER_KM;
  
  // Shared distance: split among all riders
  const sharedCost = (sharedDistanceKm * RATE_PER_KM) / totalSharers;
  
  // Offset: rider pays half of the detour cost
  const offsetCost = offsetKm * OFFSET_RATE_PER_KM * 0.5;
  
  // Total = base + solo + shared + offset
  const totalFare = BASE_FARE + soloCost + sharedCost + offsetCost;
  
  // Round to nearest rupee
  return Math.round(Math.max(totalFare, 30)); // Minimum ₹30
};

/**
 * Check if a point is within a bounding box
 */
export const isPointInBox = (
  lat: number,
  lng: number,
  box: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean => {
  return (
    lat >= box.minLat &&
    lat <= box.maxLat &&
    lng >= box.minLng &&
    lng <= box.maxLng
  );
};

// Re-export pricing functions for backwards compatibility
export {
  calculateSingleRideFare,
  calculateFaresForAllRiders,
  buildRouteSegments,
  calculatePickupDistanceCost,
  isPeakHour,
  PRICING_CONFIG,
  type RiderSegment,
  type FareBreakdown,
  type DriverEarnings,
} from './pricing';
