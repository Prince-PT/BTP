import { apiClient } from './client';

export interface RegisterDriverData {
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel?: string;
  seatingCapacity?: number;
}

export const driverAPI = {
  registerDriver: async (data: RegisterDriverData) => {
    const response = await apiClient.post('/api/drivers/register', data);
    return response.data;
  },

  updateAvailability: async (isAvailable: boolean) => {
    const response = await apiClient.post('/api/drivers/availability', { isAvailable });
    return response.data;
  },

  updateLocation: async (lat: number, lng: number) => {
    const response = await apiClient.post('/api/drivers/location', { lat, lng });
    return response.data;
  },

  getActiveRides: async () => {
    const response = await apiClient.get('/api/drivers/active-rides');
    return response.data;
  },

  acceptRideRequest: async (rideRequestId: string) => {
    const response = await apiClient.post('/api/rides/accept', { rideRequestId });
    return response.data;
  },

  rejectRideRequest: async (rideRequestId: string) => {
    const response = await apiClient.post('/api/rides/reject', { rideRequestId });
    return response.data;
  },

  markPickedUp: async (rideRequestId: string) => {
    const response = await apiClient.post('/api/rides/pickup', { rideRequestId });
    return response.data;
  },

  completeRide: async (rideRequestId: string) => {
    const response = await apiClient.post('/api/rides/complete', { rideRequestId });
    return response.data;
  },

  markPaymentComplete: async (rideRequestId: string) => {
    const response = await apiClient.post('/api/rides/payment', { rideRequestId });
    return response.data;
  },
};
