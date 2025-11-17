import { apiClient } from './client';

export interface SendOTPRequest {
  email: string;
  name: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  name?: string;
  role?: 'student' | 'faculty';
}

export interface AuthResponse {
  success: boolean;
  token: string;
  isNewUser?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isDriver: boolean;
  };
}

export const authAPI = {
  sendOTP: async (email: string, name: string) => {
    const response = await apiClient.post('/api/auth/send-otp', { email, name });
    return response.data;
  },

  verifyOTP: async (email: string, otp: string, name?: string, role?: 'student' | 'faculty') => {
    const response = await apiClient.post<AuthResponse>('/api/auth/verify-otp', { 
      email, 
      otp, 
      name, 
      role 
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/profile');
    return response.data;
  },
};
