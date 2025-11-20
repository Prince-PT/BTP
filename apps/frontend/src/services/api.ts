import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  requestOtp: async (email: string, role: 'user' | 'driver' = 'user') => {
    const { data } = await api.post('/auth/request-otp', { email, role });
    return data;
  },

  verifyOtp: async (email: string, otp: string, role: 'user' | 'driver' = 'user') => {
    const { data } = await api.post('/auth/verify-otp', { email, otp, role });
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },
};

// Rides API
export const ridesApi = {
  // Get available ride requests for drivers
  getAvailableRequests: async (params?: {
    lat?: number;
    lng?: number;
    radius?: number;
  }) => {
    const { data } = await api.get('/rides/available', { params });
    return data;
  },

  // Accept a ride request (driver only)
  acceptRide: async (rideId: string) => {
    const { data } = await api.post(`/rides/${rideId}/accept`);
    return data;
  },

  createRide: async (rideData: {
    originLat: number;
    originLng: number;
    originAddress?: string;
    destLat: number;
    destLng: number;
    destAddress?: string;
    departTime: string;
    seatsNeeded: number;
    isShared?: boolean;
    capacity?: number;
  }) => {
    const { data } = await api.post('/rides', rideData);
    return data;
  },

  getRide: async (id: string) => {
    const { data } = await api.get(`/rides/${id}`);
    return data;
  },

  joinRide: async (
    id: string,
    memberData: {
      pickupLat: number;
      pickupLng: number;
      pickupAddress?: string;
      dropLat: number;
      dropLng: number;
      dropAddress?: string;
    }
  ) => {
    const { data } = await api.post(`/rides/${id}/join`, memberData);
    return data;
  },

  confirmPayment: async (id: string, paymentToken: string) => {
    const { data } = await api.post(`/rides/${id}/confirm-payment`, { paymentToken });
    return data;
  },

  getUserRides: async (userId: string) => {
    const { data } = await api.get(`/rides/user/${userId}`);
    return data;
  },

  updateRideStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/rides/${id}/status`, { status });
    return data;
  },

  // Get available shared rides
  getSharedRides: async (params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    radius?: number;
  }) => {
    const { data } = await api.get('/rides/shared/available', { params });
    return data;
  },

  // Complete/drop off a ride member (driver only)
  completeMember: async (rideId: string, memberId: string) => {
    const { data } = await api.post(`/rides/${rideId}/members/${memberId}/complete`);
    return data;
  },
};

// Driver API
export const driverApi = {
  register: async (driverData: {
    email: string;
    name: string;
    phone: string;
    vehicle: string;
    vehicleModel?: string;
    vehicleColor?: string;
    licensePlate?: string;
    licenseId?: string;
  }) => {
    const { data } = await api.post('/driver/register', driverData);
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/driver/profile');
    return data;
  },

  updateProfile: async (updates: any) => {
    const { data } = await api.patch('/driver/profile', updates);
    return data;
  },

  updateLocation: async (location: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  }) => {
    const { data } = await api.post('/driver/location', location);
    return data;
  },

  updateAvailability: async (isAvailable: boolean) => {
    const { data } = await api.patch('/driver/availability', { isAvailable });
    return data;
  },

  getRides: async (status?: string) => {
    const { data } = await api.get('/driver/rides', { params: { status } });
    return data;
  },
};

export default api;
