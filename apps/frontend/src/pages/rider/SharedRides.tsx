import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridesApi } from '../../services/api';
import LocationPicker from '../../components/LocationPicker';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const SharedRides = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [joiningRide, setJoiningRide] = useState(false);

  const [pickupLocation, setPickupLocation] = useState<LocationData>({
    lat: 0,
    lng: 0,
    address: '',
  });

  const [dropLocation, setDropLocation] = useState<LocationData>({
    lat: 0,
    lng: 0,
    address: '',
  });

  const [pickupSet, setPickupSet] = useState(false);
  const [dropSet, setDropSet] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickingFor, setPickingFor] = useState<'pickup' | 'drop'>('pickup');

  // Load all available shared rides on mount
  useEffect(() => {
    loadAllSharedRides();
  }, []);

  const loadAllSharedRides = async () => {
    setLoading(true);
    try {
      // Get all assigned/pending shared rides that have capacity
      const response = await fetch('http://localhost:3000/api/rides/shared/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      setAvailableRides(result.rides || []);
    } catch (error: any) {
      console.error('Error loading rides:', error);
      // Don't alert on initial load, just show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    if (pickingFor === 'pickup') {
      setPickupLocation({ lat, lng, address });
      setPickupSet(true);
    } else {
      setDropLocation({ lat, lng, address });
      setDropSet(true);
    }
  };

  const openLocationPicker = (type: 'pickup' | 'drop') => {
    setPickingFor(type);
    setShowLocationPicker(true);
  };

  const handleSelectRide = (ride: any) => {
    setSelectedRide(ride);
    // Reset locations when selecting a new ride
    setPickupSet(false);
    setDropSet(false);
    setPickupLocation({ lat: 0, lng: 0, address: '' });
    setDropLocation({ lat: 0, lng: 0, address: '' });
  };

  const handleBackToList = () => {
    setSelectedRide(null);
    setPickupSet(false);
    setDropSet(false);
  };

  const handleSendJoinRequest = async () => {
    if (!selectedRide || !pickupSet || !dropSet) {
      alert('Please select both pickup and drop locations');
      return;
    }

    setJoiningRide(true);
    try {
      await ridesApi.joinRide(selectedRide.id, {
        pickupLat: pickupLocation.lat,
        pickupLng: pickupLocation.lng,
        pickupAddress: pickupLocation.address,
        dropLat: dropLocation.lat,
        dropLng: dropLocation.lng,
        dropAddress: dropLocation.address,
      });

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500/100 text-white px-6 py-4 rounded-lg shadow-lg z-50';
      successMsg.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-semibold">Join Request Sent!</p>
            <p class="text-sm opacity-90">Waiting for driver approval...</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      setTimeout(() => {
        navigate('/rider/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error sending join request:', error);
      alert(error.response?.data?.error || 'Failed to send join request');
    } finally {
      setJoiningRide(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <header className="bg-dark-900/80 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => selectedRide ? handleBackToList() : navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">{selectedRide ? 'Back to List' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">Shared Rides</h1>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-purple rounded-lg flex items-center justify-center text-lg shadow-glow">
                🚗
              </div>
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Step 1: Browse Available Rides */}
        {!selectedRide && (
          <div>
            <div className="card mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
                <span className="text-3xl">🔍</span>
                Browse Available Shared Rides
              </h2>
              <p className="text-gray-400">
                Select a ride that matches your route, then provide your specific pickup and drop locations.
              </p>
            </div>

            {loading ? (
              <div className="card text-center py-12">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading available rides...</p>
              </div>
            ) : availableRides.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">
                  {availableRides.length} {availableRides.length === 1 ? 'Ride' : 'Rides'} Available
                </h3>

                {availableRides.map((ride) => (
                  <div key={ride.id} className="card hover:shadow-glow transition-all cursor-pointer border border-white/20 hover:border-primary-400 bg-gradient-to-br from-dark-800 to-dark-700" onClick={() => handleSelectRide(ride)}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Ride Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-glow">
                            {ride.driver?.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-white">{ride.driver?.name || 'Driver'}</h4>
                            <p className="text-sm text-gray-300">
                              {ride.driver?.vehicle || 'Vehicle'} - {ride.driver?.vehicleColor || 'Color'}
                            </p>
                            {ride.driver?.licensePlate && (
                              <p className="text-xs text-gray-400">{ride.driver.licensePlate}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                              <span className="text-green-400">📍</span>
                              <span className="font-medium">From:</span>
                            </div>
                            <p className="text-sm pl-6 line-clamp-2 text-gray-100">{ride.originAddress || `${ride.originLat}, ${ride.originLng}`}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                              <span className="text-red-400">🎯</span>
                              <span className="font-medium">To:</span>
                            </div>
                            <p className="text-sm pl-6 line-clamp-2 text-gray-100">{ride.destAddress || `${ride.destLat}, ${ride.destLng}`}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="bg-dark-900/50 border border-white/10 p-3 rounded-lg">
                            <div className="text-gray-400 text-xs">Departure</div>
                            <div className="font-semibold text-white">
                              {new Date(ride.departTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(ride.departTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="bg-dark-900/50 border border-white/10 p-3 rounded-lg">
                            <div className="text-gray-400 text-xs">Distance</div>
                            <div className="font-semibold text-white">{ride.distanceKm?.toFixed(1) || 'N/A'} km</div>
                          </div>
                          <div className="bg-green-500/20 border border-green-500/30 p-3 rounded-lg">
                            <div className="text-gray-300 text-xs">Available Seats</div>
                            <div className="font-semibold text-green-400">
                              {(ride.capacity || 4) - (ride.seatsTaken || 0)} / {ride.capacity || 4}
                            </div>
                          </div>
                          <div className="bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg">
                            <div className="text-gray-300 text-xs">Status</div>
                            <div className="font-semibold text-blue-400 capitalize">
                              {ride.status?.toLowerCase() || 'pending'}
                            </div>
                          </div>
                        </div>

                        {/* Other Riders */}
                        {ride.members && ride.members.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="text-xs text-gray-400 mb-2">
                              Current riders ({ride.members.length}):
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ride.members.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-1 bg-primary-500/20 border border-primary-500/30 px-3 py-1 rounded-full text-xs text-gray-200">
                                  <span>👤</span>
                                  <span>{member.user?.name || member.user?.email?.split('@')[0] || 'Rider'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Select Button */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Base Fare</div>
                          <div className="text-2xl font-bold text-primary-400">
                            ₹{ride.baseFare?.toFixed(0) || '0'}
                          </div>
                          <div className="text-xs text-gray-400">Will be adjusted</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRide(ride);
                          }}
                          className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-glow whitespace-nowrap px-6 py-2"
                        >
                          Select Ride →
                        </button>
                        {ride.driver?.phone && (
                          <div className="text-xs text-gray-400 text-center">
                            📞 {ride.driver.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Shared Rides Available</h3>
                <p className="text-gray-400 mb-4">
                  There are no shared rides available at the moment. Why not book a new ride?
                </p>
                <button
                  onClick={() => navigate('/rider/book')}
                  className="btn btn-primary"
                >
                  Book a New Ride
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Enter Your Pickup/Drop Locations */}
        {selectedRide && (
          <div>
            <div className="card mb-6 bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {selectedRide.driver?.name?.charAt(0) || 'D'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Selected Ride: {selectedRide.driver?.name || 'Driver'}
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {selectedRide.originAddress} → {selectedRide.destAddress}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="bg-dark-700 px-2 py-1 rounded">
                      🕐 {new Date(selectedRide.departTime).toLocaleString()}
                    </span>
                    <span className="bg-dark-700 px-2 py-1 rounded">
                      💺 {(selectedRide.capacity || 4) - (selectedRide.seatsTaken || 0)} seats available
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <span className="text-3xl">📍</span>
                Enter Your Locations
              </h2>
              <p className="text-gray-400 mb-6">
                Provide your specific pickup and drop-off points along the driver's route.
                <strong className="block mt-1 text-primary-600">No need to select date/time - the ride is already scheduled!</strong>
              </p>

              <div className="space-y-4">
                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📍 Your Pickup Location
                  </label>
                  <div
                    onClick={() => openLocationPicker('pickup')}
                    className="cursor-pointer p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    {pickupSet ? (
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{pickupLocation.address}</p>
                          <p className="text-xs text-gray-500">
                            {pickupLocation.lat.toFixed(6)}, {pickupLocation.lng.toFixed(6)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLocationPicker('pickup');
                          }}
                          className="text-primary-600 text-sm hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <p className="text-sm">Click to select your pickup location on map</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drop Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    🎯 Your Drop-off Location
                  </label>
                  <div
                    onClick={() => openLocationPicker('drop')}
                    className="cursor-pointer p-4 border-2 border-dashed border-white/20 rounded-lg hover:border-primary-500 transition-colors"
                  >
                    {dropSet ? (
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{dropLocation.address}</p>
                          <p className="text-xs text-gray-500">
                            {dropLocation.lat.toFixed(6)}, {dropLocation.lng.toFixed(6)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLocationPicker('drop');
                          }}
                          className="text-primary-600 text-sm hover:underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <p className="text-sm">Click to select your drop-off location on map</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Request Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSendJoinRequest}
                    disabled={!pickupSet || !dropSet || joiningRide}
                    className="btn btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {joiningRide ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending Request...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Join Request to Driver
                      </span>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    The driver will review your request and accept or decline
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {pickingFor === 'pickup' ? '📍 Select Pickup Location' : '🎯 Select Drop-off Location'}
              </h2>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="space-y-6">
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLat={pickingFor === 'pickup' ? pickupLocation.lat : dropLocation.lat}
                  initialLng={pickingFor === 'pickup' ? pickupLocation.lng : dropLocation.lng}
                  label={pickingFor === 'pickup' ? 'Pickup Location' : 'Drop Location'}
                  markerColor={pickingFor === 'pickup' ? 'green' : 'red'}
                  autoNotify={true}
                />
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button
                    onClick={() => setShowLocationPicker(false)}
                    className="btn btn-primary"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedRides;
