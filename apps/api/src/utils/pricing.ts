/**
 * Advanced Fare Calculation System for Shared Rideshare Platform
 * Based on Real Indian Market Data (2024-2025)
 * 
 * PRICING FOUNDATION:
 * - Petrol: ₹94.72/litre (national average)
 * - Mileage: 15 km/litre (sedan average)
 * - Running Cost: ₹6.31/km (fuel only)
 * - Total Operating Cost: ₹8.5/km (fuel + maintenance + wear)
 * - Driver Margin: 35% → Final Rate: ₹11.50/km
 * - Base Fare: ₹35 (covers idle time, initial pickup)
 * - Detour Rate: ₹15/km (higher due to inefficiency)
 */

// ============================================================================
// CONSTANTS - Real Indian Market Data
// ============================================================================

export const PRICING_CONFIG = {
  // Base costs
  BASE_FARE: 35,                    // ₹35 minimum charge
  MINIMUM_FARE: 40,                 // ₹40 absolute minimum (covers ~3-4 km)
  
  // Distance-based rates
  RATE_PER_KM: 11.5,                // ₹11.50/km (includes 35% margin)
  DETOUR_RATE_PER_KM: 15,           // ₹15/km for route deviations
  
  // Driver repositioning (distance to pickup)
  PICKUP_DISTANCE_RATE: 5,          // ₹5/km for driver to reach pickup
  FREE_PICKUP_DISTANCE: 2,          // First 2 km free for driver
  
  // Time-based charges
  WAIT_TIME_FREE_MINUTES: 5,        // 5 minutes free waiting
  WAIT_TIME_PER_MINUTE: 2,          // ₹2/minute after free period
  
  // Peak hour multiplier
  PEAK_HOUR_MULTIPLIER: 1.3,        // 30% surge during peak hours
  PEAK_HOURS: [
    { start: 7, end: 10 },          // Morning: 7 AM - 10 AM
    { start: 17, end: 21 },         // Evening: 5 PM - 9 PM
  ],
  
  // Platform fee
  PLATFORM_FEE_PERCENT: 0.15,       // 15% platform commission
  
  // GST
  GST_PERCENT: 0.05,                // 5% GST on rideshare services
} as const;

// ============================================================================
// INTERFACES
// ============================================================================

export interface RiderSegment {
  riderId: string;
  riderName: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  dropOrder: number;              // 1 = first to drop, 2 = second, etc.
}

export interface RouteSegment {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distance: number;
  ridersPresent: string[];        // IDs of riders in car during this segment
  segmentType: 'solo' | 'shared' | 'detour';
  createdByRider?: string;        // Which rider caused this segment
}

export interface FareBreakdown {
  riderId: string;
  baseFare: number;
  soloDistance: number;
  soloCost: number;
  sharedDistance: number;
  sharedCost: number;
  detourDistance: number;
  detourCost: number;
  pickupDistanceCost: number;
  waitTimeCost: number;
  subtotal: number;
  peakMultiplier: number;
  gst: number;
  totalFare: number;
  farePerKm: number;
  breakdown: string;              // Human-readable explanation
}

export interface DriverEarnings {
  totalRevenue: number;
  platformFee: number;
  gst: number;
  netEarnings: number;
  totalDistance: number;
  avgFarePerKm: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Haversine formula - Calculate distance between two coordinates
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if a time falls within peak hours
 */
export function isPeakHour(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return PRICING_CONFIG.PEAK_HOURS.some(
    (peak) => hour >= peak.start && hour < peak.end
  );
}

/**
 * Calculate driver's distance to pickup location
 */
export function calculatePickupDistanceCost(
  driverLat: number,
  driverLng: number,
  pickupLat: number,
  pickupLng: number
): { distance: number; cost: number } {
  const distance = calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
  
  // Free for first 2 km
  const chargeableDistance = Math.max(0, distance - PRICING_CONFIG.FREE_PICKUP_DISTANCE);
  const cost = chargeableDistance * PRICING_CONFIG.PICKUP_DISTANCE_RATE;
  
  return { distance, cost: Math.round(cost) };
}

// ============================================================================
// ROUTE OPTIMIZATION
// ============================================================================

/**
 * Build optimal route considering all riders and their drop order
 * This simulates the actual path the driver will take
 */
export function buildRouteSegments(
  originLat: number,
  originLng: number,
  riders: RiderSegment[]
): RouteSegment[] {
  const segments: RouteSegment[] = [];
  
  // Sort riders by drop order
  const sortedRiders = [...riders].sort((a, b) => a.dropOrder - b.dropOrder);
  
  let currentLat = originLat;
  let currentLng = originLng;
  let activeRiders: string[] = [];
  
  // Track which riders have been picked up
  const pickedUpRiders = new Set<string>();
  
  // We need to visit each pickup, then each drop in order
  // For simplicity, assume all pickups happen first, then drops
  // (In reality, this could be more complex with interleaved pickups/drops)
  
  // Phase 1: Pick up all riders
  for (const rider of sortedRiders) {
    if (!pickedUpRiders.has(rider.riderId)) {
      const distance = calculateDistance(
        currentLat,
        currentLng,
        rider.pickupLat,
        rider.pickupLng
      );
      
      // This is a detour to pick up this rider
      segments.push({
        fromLat: currentLat,
        fromLng: currentLng,
        toLat: rider.pickupLat,
        toLng: rider.pickupLng,
        distance,
        ridersPresent: [...activeRiders],
        segmentType: activeRiders.length === 0 ? 'solo' : 'detour',
        createdByRider: rider.riderId,
      });
      
      activeRiders.push(rider.riderId);
      pickedUpRiders.add(rider.riderId);
      currentLat = rider.pickupLat;
      currentLng = rider.pickupLng;
    }
  }
  
  // Phase 2: Drop off riders in order
  for (const rider of sortedRiders) {
    const distance = calculateDistance(
      currentLat,
      currentLng,
      rider.dropLat,
      rider.dropLng
    );
    
    segments.push({
      fromLat: currentLat,
      fromLng: currentLng,
      toLat: rider.dropLat,
      toLng: rider.dropLng,
      distance,
      ridersPresent: [...activeRiders],
      segmentType: activeRiders.length > 1 ? 'shared' : 'solo',
      createdByRider: rider.riderId,
    });
    
    // Remove this rider from active list
    activeRiders = activeRiders.filter(id => id !== rider.riderId);
    currentLat = rider.dropLat;
    currentLng = rider.dropLng;
  }
  
  return segments;
}

// ============================================================================
// FARE CALCULATION - CORE LOGIC
// ============================================================================

/**
 * Calculate fare for each rider based on actual route segments
 * 
 * LOGIC:
 * 1. Solo segments: Rider pays full cost (₹11.50/km)
 * 2. Shared segments: Cost split equally among all riders in car
 * 3. Detour segments: Rider who caused detour pays 70%, others split 30%
 * 4. Add base fare, pickup distance, peak multiplier, GST
 */
export function calculateFaresForAllRiders(
  riders: RiderSegment[],
  routeSegments: RouteSegment[],
  driverLat?: number,
  driverLng?: number,
  departureTime: Date = new Date()
): Map<string, FareBreakdown> {
  const fares = new Map<string, FareBreakdown>();
  
  // Initialize fare breakdown for each rider
  riders.forEach(rider => {
    fares.set(rider.riderId, {
      riderId: rider.riderId,
      baseFare: PRICING_CONFIG.BASE_FARE,
      soloDistance: 0,
      soloCost: 0,
      sharedDistance: 0,
      sharedCost: 0,
      detourDistance: 0,
      detourCost: 0,
      pickupDistanceCost: 0,
      waitTimeCost: 0,
      subtotal: 0,
      peakMultiplier: 1,
      gst: 0,
      totalFare: 0,
      farePerKm: 0,
      breakdown: '',
    });
  });
  
  // Calculate pickup distance cost for the first rider (who initiated the ride)
  if (driverLat && driverLng && riders.length > 0) {
    const firstRider = riders[0];
    const pickupCost = calculatePickupDistanceCost(
      driverLat,
      driverLng,
      firstRider.pickupLat,
      firstRider.pickupLng
    );
    
    const fareData = fares.get(firstRider.riderId)!;
    fareData.pickupDistanceCost = pickupCost.cost;
  }
  
  // Process each route segment
  for (const segment of routeSegments) {
    const numRiders = segment.ridersPresent.length;
    
    if (numRiders === 0) continue; // Skip empty segments
    
    if (segment.segmentType === 'solo') {
      // Solo segment: One rider pays full cost
      const riderId = segment.ridersPresent[0];
      const fareData = fares.get(riderId)!;
      
      fareData.soloDistance += segment.distance;
      fareData.soloCost += segment.distance * PRICING_CONFIG.RATE_PER_KM;
      
    } else if (segment.segmentType === 'shared') {
      // Shared segment: Split cost equally
      const costPerRider = (segment.distance * PRICING_CONFIG.RATE_PER_KM) / numRiders;
      
      segment.ridersPresent.forEach(riderId => {
        const fareData = fares.get(riderId)!;
        fareData.sharedDistance += segment.distance;
        fareData.sharedCost += costPerRider;
      });
      
    } else if (segment.segmentType === 'detour') {
      // Detour: Rider who caused it pays 70%, others split 30%
      const totalCost = segment.distance * PRICING_CONFIG.DETOUR_RATE_PER_KM;
      const creatorPays = totalCost * 0.7;
      const othersShare = totalCost * 0.3;
      const otherRiders = segment.ridersPresent.filter(id => id !== segment.createdByRider);
      const perOtherRider = otherRiders.length > 0 ? othersShare / otherRiders.length : 0;
      
      // Creator pays 70%
      if (segment.createdByRider) {
        const fareData = fares.get(segment.createdByRider)!;
        fareData.detourDistance += segment.distance;
        fareData.detourCost += creatorPays;
      }
      
      // Others split 30%
      otherRiders.forEach(riderId => {
        const fareData = fares.get(riderId)!;
        fareData.detourDistance += segment.distance * 0.3;
        fareData.detourCost += perOtherRider;
      });
    }
  }
  
  // Apply peak hour multiplier, GST, and finalize
  const isPeak = isPeakHour(departureTime);
  const peakMultiplier = isPeak ? PRICING_CONFIG.PEAK_HOUR_MULTIPLIER : 1;
  
  fares.forEach((fareData, riderId) => {
    // Subtotal before multipliers
    fareData.subtotal = 
      fareData.baseFare +
      fareData.soloCost +
      fareData.sharedCost +
      fareData.detourCost +
      fareData.pickupDistanceCost +
      fareData.waitTimeCost;
    
    // Apply peak multiplier
    fareData.peakMultiplier = peakMultiplier;
    const afterPeak = fareData.subtotal * peakMultiplier;
    
    // Calculate GST
    fareData.gst = afterPeak * PRICING_CONFIG.GST_PERCENT;
    
    // Total fare
    fareData.totalFare = Math.round(afterPeak + fareData.gst);
    
    // Ensure minimum fare
    fareData.totalFare = Math.max(fareData.totalFare, PRICING_CONFIG.MINIMUM_FARE);
    
    // Calculate effective fare per km
    const totalDistance = fareData.soloDistance + fareData.sharedDistance + fareData.detourDistance;
    fareData.farePerKm = totalDistance > 0 ? fareData.totalFare / totalDistance : 0;
    
    // Generate breakdown explanation
    fareData.breakdown = generateFareBreakdown(fareData, isPeak);
  });
  
  return fares;
}

/**
 * Generate human-readable fare breakdown
 */
function generateFareBreakdown(fare: FareBreakdown, isPeak: boolean): string {
  const lines: string[] = [];
  
  lines.push(`Base Fare: ₹${fare.baseFare}`);
  
  if (fare.soloDistance > 0) {
    lines.push(`Solo Travel (${fare.soloDistance.toFixed(1)} km): ₹${Math.round(fare.soloCost)}`);
  }
  
  if (fare.sharedDistance > 0) {
    lines.push(`Shared Travel (${fare.sharedDistance.toFixed(1)} km): ₹${Math.round(fare.sharedCost)}`);
  }
  
  if (fare.detourDistance > 0) {
    lines.push(`Detour (${fare.detourDistance.toFixed(1)} km): ₹${Math.round(fare.detourCost)}`);
  }
  
  if (fare.pickupDistanceCost > 0) {
    lines.push(`Driver Pickup Distance: ₹${fare.pickupDistanceCost}`);
  }
  
  if (fare.waitTimeCost > 0) {
    lines.push(`Wait Time: ₹${fare.waitTimeCost}`);
  }
  
  lines.push(`Subtotal: ₹${Math.round(fare.subtotal)}`);
  
  if (isPeak) {
    lines.push(`Peak Hour Surge (${((fare.peakMultiplier - 1) * 100).toFixed(0)}%): ₹${Math.round(fare.subtotal * (fare.peakMultiplier - 1))}`);
  }
  
  lines.push(`GST (5%): ₹${Math.round(fare.gst)}`);
  lines.push(`Total: ₹${fare.totalFare}`);
  
  return lines.join('\n');
}

// ============================================================================
// DRIVER EARNINGS CALCULATION
// ============================================================================

/**
 * Calculate total driver earnings after platform fee and GST
 */
export function calculateDriverEarnings(
  riderFares: Map<string, FareBreakdown>,
  totalDistance: number
): DriverEarnings {
  let totalRevenue = 0;
  
  riderFares.forEach(fare => {
    totalRevenue += fare.totalFare;
  });
  
  const platformFee = totalRevenue * PRICING_CONFIG.PLATFORM_FEE_PERCENT;
  const gstTotal = totalRevenue * PRICING_CONFIG.GST_PERCENT;
  const netEarnings = totalRevenue - platformFee - gstTotal;
  
  return {
    totalRevenue: Math.round(totalRevenue),
    platformFee: Math.round(platformFee),
    gst: Math.round(gstTotal),
    netEarnings: Math.round(netEarnings),
    totalDistance,
    avgFarePerKm: totalDistance > 0 ? totalRevenue / totalDistance : 0,
  };
}

// ============================================================================
// SIMPLIFIED API FOR SINGLE RIDE
// ============================================================================

/**
 * Calculate fare for a single rider (non-shared ride)
 */
export function calculateSingleRideFare(
  pickupLat: number,
  pickupLng: number,
  dropLat: number,
  dropLng: number,
  seatsNeeded: number = 1,
  driverLat?: number,
  driverLng?: number,
  departureTime: Date = new Date()
): { totalFare: number; breakdown: FareBreakdown } {
  const distance = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
  
  // Calculate base components
  let baseFare = PRICING_CONFIG.BASE_FARE;
  let distanceCost = distance * PRICING_CONFIG.RATE_PER_KM;
  let pickupDistanceCost = 0;
  
  if (driverLat && driverLng) {
    const pickupCost = calculatePickupDistanceCost(driverLat, driverLng, pickupLat, pickupLng);
    pickupDistanceCost = pickupCost.cost;
  }
  
  // Subtotal for one person
  let subtotal = baseFare + distanceCost + pickupDistanceCost;
  
  // Apply peak multiplier
  const isPeak = isPeakHour(departureTime);
  const peakMultiplier = isPeak ? PRICING_CONFIG.PEAK_HOUR_MULTIPLIER : 1;
  subtotal *= peakMultiplier;
  
  // GST
  const gst = subtotal * PRICING_CONFIG.GST_PERCENT;
  
  // Total for one person
  let farePerPerson = Math.round(subtotal + gst);
  farePerPerson = Math.max(farePerPerson, PRICING_CONFIG.MINIMUM_FARE);
  
  // Multiply by number of seats
  const totalFare = farePerPerson * seatsNeeded;
  
  const breakdown: FareBreakdown = {
    riderId: 'single',
    baseFare: baseFare * seatsNeeded,
    soloDistance: distance,
    soloCost: distanceCost * seatsNeeded,
    sharedDistance: 0,
    sharedCost: 0,
    detourDistance: 0,
    detourCost: 0,
    pickupDistanceCost: pickupDistanceCost * seatsNeeded,
    waitTimeCost: 0,
    subtotal: subtotal * seatsNeeded,
    peakMultiplier,
    gst: gst * seatsNeeded,
    totalFare,
    farePerKm: totalFare / distance,
    breakdown: generateFareBreakdown({
      riderId: 'single',
      baseFare: baseFare * seatsNeeded,
      soloDistance: distance,
      soloCost: distanceCost * seatsNeeded,
      sharedDistance: 0,
      sharedCost: 0,
      detourDistance: 0,
      detourCost: 0,
      pickupDistanceCost: pickupDistanceCost * seatsNeeded,
      waitTimeCost: 0,
      subtotal: subtotal * seatsNeeded,
      peakMultiplier,
      gst: gst * seatsNeeded,
      totalFare,
      farePerKm: 0,
      breakdown: '',
    }, isPeak) + (seatsNeeded > 1 ? `\n\n(${seatsNeeded} passengers × ₹${farePerPerson}/person)` : ''),
  };
  
  return { totalFare, breakdown };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateDistance,
  calculatePickupDistanceCost,
  isPeakHour,
  buildRouteSegments,
  calculateFaresForAllRiders,
  calculateDriverEarnings,
  calculateSingleRideFare,
  PRICING_CONFIG,
};
