'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { rideAPI, Location } from '@/lib/api/ride';
import { getCurrentLocation } from '@/lib/utils/helpers';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket/client';

const Map = dynamic(() => import('@/components/map/Map'), { ssr: false });

export default function RequestRidePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [step, setStep] = useState<'pickup' | 'dropoff' | 'confirm'>('pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([26.9389, 75.9239]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    getCurrentLocation()
      .then(({ lat, lng }) => {
        setMapCenter([lat, lng]);
        // Auto-set pickup to current location
        setPickup({ lat, lng, address: 'Current Location' });
      })
      .catch((error) => {
        console.error('Failed to get location:', error);
      });
  }, []);

  useEffect(() => {
    // Listen for ride acceptance
    const socket = getSocket();
    if (socket) {
      socket.on('ride:accepted', (data) => {
        toast.success('🎉 Driver accepted your ride!');
        router.push(`/ride/${data.rideId}`);
      });

      socket.on('ride:rejected', () => {
        toast.error('Driver rejected the ride. Searching for another driver...');
      });
    }

    return () => {
      if (socket) {
        socket.off('ride:accepted');
        socket.off('ride:rejected');
      }
    };
  }, [router]);

  const handleMapClick = (lat: number, lng: number) => {
    const location: Location = { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    
    if (step === 'pickup') {
      setPickup(location);
      toast.success('📍 Pickup location set! Click "Next" to set drop-off.');
    } else if (step === 'dropoff') {
      setDropoff(location);
      toast.success('🎯 Drop-off location set! Click "Next" to confirm.');
    } else if (step === 'confirm') {
      toast('You are in confirm mode. Click "Request Ride" button below.', { icon: 'ℹ️' });
    }
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimatedFare = pickup && dropoff 
    ? Math.round(calculateDistance(pickup, dropoff) * 10) // ₹10 per km
    : 0;

  const handleSubmit = async () => {
    if (!pickup || !dropoff) {
      toast.error('Please select both pickup and drop-off locations');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await rideAPI.createRideRequest({ pickup, dropoff });
      toast.success(response.message || 'Ride request sent!');
      
      if (response.isSharedRide) {
        toast('🚗 Joining a shared ride!', { icon: 'ℹ️' });
      }
      
      // Navigate to tracking page or dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to request ride');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const markers = [
    ...(pickup ? [{
      position: [pickup.lat, pickup.lng] as [number, number],
      popup: '📍 Pickup Location',
      icon: 'pickup' as const,
    }] : []),
    ...(dropoff ? [{
      position: [dropoff.lat, dropoff.lng] as [number, number],
      popup: '🎯 Drop-off Location',
      icon: 'dropoff' as const,
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">🚖 Request a Ride</h1>
                <p className="text-sm text-gray-400 mt-1">Choose your pickup and drop-off locations</p>
              </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {step === 'pickup' && '📍 Step 1: Select Pickup Location'}
                      {step === 'dropoff' && '🎯 Step 2: Select Drop-off Location'}
                      {step === 'confirm' && '✅ Step 3: Confirm & Request Ride'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {step === 'pickup' && 'Click on the map to set your pickup location'}
                      {step === 'dropoff' && 'Click on the map to set your drop-off location'}
                      {step === 'confirm' && 'Review your trip and click "Request Ride" button'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step === 'pickup' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>
                      1. Pickup
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step === 'dropoff' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>
                      2. Drop-off
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}>
                      3. Confirm
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <Map
                  center={mapCenter}
                  zoom={15}
                  markers={markers}
                  onMapClick={handleMapClick}
                  className="h-[500px] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Location Details */}
            <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">🗺️ Trip Details</h2>
              
              <div className="space-y-4">
                {/* Pickup */}
                <div className={`p-4 rounded-lg border ${
                  step === 'pickup' 
                    ? 'bg-blue-900/20 border-blue-600' 
                    : 'bg-gray-800 border-gray-700'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-gray-400">Pickup</span>
                    {pickup && step !== 'pickup' && (
                      <button
                        onClick={() => setStep('pickup')}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {pickup ? (
                    <p className="text-white font-medium">{pickup.address}</p>
                  ) : (
                    <p className="text-gray-500 text-sm">Click on map to set pickup</p>
                  )}
                </div>

                {/* Dropoff */}
                <div className={`p-4 rounded-lg border ${
                  step === 'dropoff' 
                    ? 'bg-blue-900/20 border-blue-600' 
                    : 'bg-gray-800 border-gray-700'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-gray-400">Drop-off</span>
                    {dropoff && step !== 'dropoff' && (
                      <button
                        onClick={() => setStep('dropoff')}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {dropoff ? (
                    <p className="text-white font-medium">{dropoff.address}</p>
                  ) : (
                    <p className="text-gray-500 text-sm">Click on map to set drop-off</p>
                  )}
                </div>
              </div>

              {/* Step Navigation */}
              <div className="mt-6 space-y-3">
                {step === 'pickup' && pickup && (
                  <button
                    onClick={() => setStep('dropoff')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Next: Set Drop-off →
                  </button>
                )}
                {step === 'dropoff' && dropoff && (
                  <button
                    onClick={() => setStep('confirm')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Next: Confirm Ride →
                  </button>
                )}
              </div>
            </div>

            {/* Fare Estimate */}
            {pickup && dropoff && (
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">💰 Fare Estimate</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">Distance</span>
                    <span className="text-xl font-bold">
                      {calculateDistance(pickup, dropoff).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">Estimated Fare</span>
                    <span className="text-3xl font-bold">₹{estimatedFare}</span>
                  </div>
                  <p className="text-xs text-green-100 mt-2">
                    * Fare may vary based on shared rides
                  </p>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            {step === 'confirm' && pickup && dropoff && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Requesting Ride...
                  </span>
                ) : (
                  '🚖 Request Ride'
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
