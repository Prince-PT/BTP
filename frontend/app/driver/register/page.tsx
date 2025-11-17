'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

export default function DriverRegisterPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleNumber: '',
    vehicleModel: '',
    seatingCapacity: 4,
    licenseNumber: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user?.isDriver) {
      toast('You are already a driver!', { icon: 'ℹ️' });
      router.push('/driver/dashboard');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'seatingCapacity' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleType || !formData.vehicleNumber || !formData.licenseNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/api/drivers/register', formData);
      toast.success('✅ Driver registration successful!');
      
      // If backend returns new token with updated isDriver status, use it
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Refresh user data to update context
        await refreshUser();
      } else {
        // Fallback: just refresh user data
        await refreshUser();
      }
      
      setTimeout(() => {
        router.push('/driver/dashboard');
      }, 1500);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">🚗 Become a Driver</h1>
              <p className="text-sm text-gray-400 mt-1">Join our community of campus drivers</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">🎉 Start Earning Today!</h2>
            <p className="text-purple-100">
              Share rides with fellow students and faculty members while earning extra income. 
              Safe, convenient, and exclusively for LNMIIT campus.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select vehicle type</option>
                  <option value="bike">🏍️ Bike/Scooter</option>
                  <option value="car">🚗 Car</option>
                  <option value="auto">🛺 Auto</option>
                </select>
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="RJ14AB1234"
                  required
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                />
              </div>

              {/* Vehicle Model */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Model (Optional)
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  placeholder="e.g., Honda Activa, Maruti Swift"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Seating Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Seating Capacity <span className="text-red-500">*</span>
                </label>
                <select
                  name="seatingCapacity"
                  value={formData.seatingCapacity}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={1}>1 passenger (Bike/Scooter)</option>
                  <option value={2}>2 passengers</option>
                  <option value={3}>3 passengers</option>
                  <option value={4}>4 passengers</option>
                  <option value={5}>5 passengers</option>
                  <option value={6}>6 passengers</option>
                  <option value={7}>7 passengers</option>
                </select>
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Driving License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="RJ1420200012345"
                  required
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                />
              </div>

              {/* Terms & Conditions */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-400">Important Information</h3>
                    <ul className="mt-2 text-sm text-blue-200/80 space-y-1">
                      <li>• Valid driving license required</li>
                      <li>• Vehicle must be in good condition</li>
                      <li>• Must be a verified LNMIIT member</li>
                      <li>• Safety and punctuality are mandatory</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering...
                  </span>
                ) : (
                  '🚗 Register as Driver'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-white font-semibold mb-2">Earn Extra</h3>
            <p className="text-sm text-gray-400">Make money during your daily commute</p>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <h3 className="text-white font-semibold mb-2">Go Green</h3>
            <p className="text-sm text-gray-400">Reduce carbon footprint by sharing rides</p>
          </div>
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <h3 className="text-white font-semibold mb-2">Build Community</h3>
            <p className="text-sm text-gray-400">Connect with campus members</p>
          </div>
        </div>
      </main>
    </div>
  );
}
