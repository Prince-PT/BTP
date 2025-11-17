'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { getCurrentLocation } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket/client';

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

interface IncomingRequest {
  rideRequestId: string;
  estimatedFare: number;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

export default function DriverDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([26.9389, 75.9239]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [activeRide] = useState<null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && !user.isDriver) {
      toast.error('You are not registered as a driver');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    getCurrentLocation()
      .then(({ lat, lng }) => {
        setCurrentLocation([lat, lng]);
      })
      .catch((error) => {
        console.error('Failed to get location:', error);
      });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (socket && user?.isDriver) {
      // Join driver room
      socket.emit('driver:join', { driverId: user.id });

      // Listen for new ride requests
      socket.on('ride:new-request', (data) => {
        toast.success('🚖 New ride request!', {
          duration: 5000,
          icon: '🔔',
        });
        setIncomingRequests((prev) => [...prev, data]);
      });

      // Listen for new passenger requests (shared ride)
      socket.on('ride:new-passenger-request', (data) => {
        toast('👥 New passenger wants to join your ride!', { icon: 'ℹ️' });
        setIncomingRequests((prev) => [...prev, data as IncomingRequest]);
      });

      return () => {
        socket.off('ride:new-request');
        socket.off('ride:new-passenger-request');
      };
    }
  }, [user]);

  // Update driver location periodically
  useEffect(() => {
    if (isAvailable && user?.isDriver) {
      const interval = setInterval(() => {
        getCurrentLocation()
          .then(({ lat, lng }) => {
            setCurrentLocation([lat, lng]);
            const socket = getSocket();
            if (socket) {
              socket.emit('driver:location:update', {
                driverId: user.id,
                location: { lat, lng },
              });
            }
          })
          .catch(console.error);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isAvailable, user]);

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    toast.success(isAvailable ? 'You are now offline' : 'You are now online and accepting rides!');
  };

  const handleAcceptRequest = async (request: IncomingRequest) => {
    try {
      // Call API to accept ride
      toast.success('Ride accepted!');
      setIncomingRequests((prev) => prev.filter((r) => r.rideRequestId !== request.rideRequestId));
      // TODO: Set active ride
    } catch {
      toast.error('Failed to accept ride');
    }
  };

  const handleRejectRequest = (request: IncomingRequest) => {
    setIncomingRequests((prev) => prev.filter((r) => r.rideRequestId !== request.rideRequestId));
    toast('Ride request declined', { icon: 'ℹ️' });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">🚗 Driver Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Availability Toggle */}
              <button
                onClick={toggleAvailability}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  isAvailable
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isAvailable ? '🟢 Online' : '⚫ Offline'}
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
            <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">📍 Your Location</h2>
                <p className="text-sm text-gray-400">
                  {isAvailable ? 'Sharing location with passengers' : 'Location not being shared'}
                </p>
              </div>
              <div className="p-4">
                <Map
                  center={currentLocation}
                  zoom={15}
                  markers={[
                    {
                      position: currentLocation,
                      popup: 'Your Location',
                      icon: 'default',
                    },
                  ]}
                  className="h-[500px] rounded-lg"
                />
              </div>
            </div>

            {/* Active Ride */}
            {activeRide && (
              <div className="mt-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-xl p-6 text-white">
                <h2 className="text-xl font-bold mb-4">🚖 Active Ride</h2>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <p className="text-sm text-blue-100 mb-1">Passenger</p>
                    <p className="font-semibold">John Doe</p>
                  </div>
                  <div className="flex space-x-4">
                    <button className="flex-1 bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                      📞 Call
                    </button>
                    <button className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                      ✓ Complete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Requests & Stats Section */}
          <div className="space-y-6">
            {/* Incoming Requests */}
            <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                <span>🔔 Incoming Requests</span>
                {incomingRequests.length > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    {incomingRequests.length}
                  </span>
                )}
              </h2>

              {!isAvailable && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">⚫</p>
                  <p className="text-sm">You&apos;re offline</p>
                  <p className="text-xs mt-1">Go online to receive ride requests</p>
                </div>
              )}

              {isAvailable && incomingRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">⏳</p>
                  <p className="text-sm">Waiting for requests...</p>
                  <p className="text-xs mt-1">You&apos;ll be notified when a passenger requests a ride</p>
                </div>
              )}

              <div className="space-y-3">
                {incomingRequests.map((request, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="mb-3">
                      <p className="text-white font-medium mb-1">New Ride Request</p>
                      <p className="text-sm text-gray-400">
                        Fare: <span className="text-green-400 font-semibold">₹{request.estimatedFare}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition"
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">📊 Today&apos;s Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-purple-100">Rides Completed</span>
                  <span className="text-2xl font-bold">0</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-purple-100">Earnings</span>
                  <span className="text-2xl font-bold">₹0</span>
                </div>
                <div className="flex items-center justify-between bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <span className="text-purple-100">Rating</span>
                  <span className="text-2xl font-bold">⭐ 0.0</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition border border-gray-700">
                  📋 View History
                </button>
                <button className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition border border-gray-700">
                  💰 Earnings Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
