/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate if point C is approximately between points A and B
 * Returns true if C is within a reasonable detour threshold
 */
export function isPointBetween(
  pointA: { lat: number; lng: number },
  pointB: { lat: number; lng: number },
  pointC: { lat: number; lng: number },
  maxDetourPercent: number = 20 // Maximum 20% detour allowed
): boolean {
  const directDistance = calculateDistance(
    pointA.lat,
    pointA.lng,
    pointB.lat,
    pointB.lng
  );

  const viaPointDistance =
    calculateDistance(pointA.lat, pointA.lng, pointC.lat, pointC.lng) +
    calculateDistance(pointC.lat, pointC.lng, pointB.lat, pointB.lng);

  const detourPercent = ((viaPointDistance - directDistance) / directDistance) * 100;

  return detourPercent <= maxDetourPercent;
}

/**
 * Calculate estimated time of arrival (ETA) in minutes
 * Average speed in LNMIIT campus: ~20 km/h
 */
export function calculateETA(distanceInKm: number): number {
  const averageSpeed = 20; // km/h for campus
  const hours = distanceInKm / averageSpeed;
  const minutes = Math.ceil(hours * 60);
  return minutes;
}

/**
 * Calculate total route distance through multiple waypoints
 */
export function calculateRouteDistance(
  waypoints: Array<{ lat: number; lng: number }>
): number {
  if (waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      waypoints[i].lat,
      waypoints[i].lng,
      waypoints[i + 1].lat,
      waypoints[i + 1].lng
    );
  }

  return Math.round(totalDistance * 100) / 100;
}
