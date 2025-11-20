import { calculateDistance, calculatePrice, getBoundingBox } from '../../src/utils/geo';

describe('Geo Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York to Los Angeles (approx 3944 km)
      const distance = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Times Square to Central Park (approx 2-3 km)
      const distance = calculateDistance(40.7589, -73.9851, 40.7829, -73.9654);
      expect(distance).toBeGreaterThan(2);
      expect(distance).toBeLessThan(4);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate base fare correctly', () => {
      const price = calculatePrice(10, 0, 1);
      // Base fare (2.50) + 10km * 1.20 = 14.50
      expect(price).toBe(14.5);
    });

    it('should add offset charges', () => {
      const price = calculatePrice(10, 2, 1);
      // Base fare (2.50) + 10km * 1.20 + 2km * 2.00 = 18.50
      expect(price).toBe(18.5);
    });

    it('should split fare among riders', () => {
      const price = calculatePrice(10, 0, 2);
      // (2.50 + 10 * 1.20) / 2 = 7.25
      expect(price).toBe(7.25);
    });

    it('should handle zero distance', () => {
      const price = calculatePrice(0, 0, 1);
      expect(price).toBe(2.5); // Just base fare
    });
  });

  describe('getBoundingBox', () => {
    it('should create bounding box with correct dimensions', () => {
      const box = getBoundingBox(40.7128, -74.006, 10);
      
      expect(box.minLat).toBeLessThan(40.7128);
      expect(box.maxLat).toBeGreaterThan(40.7128);
      expect(box.minLng).toBeLessThan(-74.006);
      expect(box.maxLng).toBeGreaterThan(-74.006);
    });

    it('should handle equator location', () => {
      const box = getBoundingBox(0, 0, 10);
      
      expect(box.minLat).toBeLessThan(0);
      expect(box.maxLat).toBeGreaterThan(0);
      expect(box.minLng).toBeLessThan(0);
      expect(box.maxLng).toBeGreaterThan(0);
    });
  });
});
