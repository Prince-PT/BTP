'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { getCurrentLocation } from '@/lib/utils/helpers';

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([26.9389, 75.9239]); // LNMIIT default

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Get user's current location
    getCurrentLocation()
      .then(({ lat, lng }) => {
        setCurrentLocation([lat, lng]);
      })
      .catch((error) => {
        console.error('Failed to get location:', error);
      });
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campus Rideshare</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {user.role === 'student' ? '🎓 Student' : '👨‍🏫 Faculty'}
              </span>
              {user.isDriver && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  🚗 Driver
                </span>
              )}
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Campus Map</h2>
                <p className="text-sm text-gray-600">LNMIIT Campus, Jaipur</p>
              </div>
              <div className="p-4">
                <Map
                  center={currentLocation}
                  zoom={15}
                  markers={[
                    {
                      position: currentLocation,
                      popup: 'You are here',
                      icon: 'default',
                    },
                  ]}
                  className="h-[500px]"
                />
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/ride/request')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  🚖 Book a Ride
                </button>

                {user.isDriver ? (
                  <button
                    onClick={() => router.push('/driver/dashboard')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    🚗 Driver Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/driver/register')}
                    className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                  >
                    🚗 Become a Driver
                  </button>
                )}

                <button
                  onClick={() => router.push('/rides/history')}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  📋 Ride History
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Your Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Total Rides</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Active Rides</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                {user.isDriver && (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-100">Driver Rating</span>
                    <span className="text-2xl font-bold">⭐ 0.0</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Campus Only</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    This service is exclusively for LNMIIT campus users. Share rides safely within the campus community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-2">Your rides will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}
