import { apiClient } from './client';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface CreateRideRequestData {
  pickup: Location;
  dropoff: Location;
}

export const rideAPI = {
  createRideRequest: async (data: CreateRideRequestData) => {
    const response = await apiClient.post('/api/rides/request', data);
    return response.data;
  },

  getMyRides: async () => {
    const response = await apiClient.get('/api/rides/my-rides');
    return response.data;
  },

  cancelRide: async (rideRequestId: string) => {
    const response = await apiClient.post('/api/rides/cancel', { rideRequestId });
    return response.data;
  },
};
