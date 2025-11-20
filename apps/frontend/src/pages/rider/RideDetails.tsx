import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ridesApi } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<any>(null);

  // Map refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const mapInitializedRef = useRef(false);

  // Cleanup function for when component unmounts
  useEffect(() => {
    return () => {
      // Clean up map and all markers when component unmounts
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }
      if (dropMarkerRef.current) {
        dropMarkerRef.current.remove();
        dropMarkerRef.current = null;
      }
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      mapInitializedRef.current = false;
    };
  }, []);

  // Load ride details on component mount or ID change
  useEffect(() => {
    loadRide();
  }, [id]);

  // Handle WebSocket connection and subscriptions
  useEffect(() => {
    if (socket && connected && id) {
      console.log('🔌 Subscribing to ride:', id);
      
      // Subscribe to ride updates
      socket.emit('ride:subscribe', { rideId: id });

      // Listen for driver location updates
      socket.on('driver:location:update', (data) => {
        console.log('📍 Driver location update received:', data);
        setDriverLocation(data);
      });

      // Listen for ride status updates
      socket.on('ride:status', (data) => {
        console.log('🚗 Ride status update received:', data);
        // Only update ride state, don't reinitialize map
        setRide(data);
        
        // If this is the first update and we have driver location, set it
        if (data.driver?.currentLat && data.driver?.currentLng) {
          console.log('📍 Setting initial driver location from ride status:', {
            lat: data.driver.currentLat,
            lng: data.driver.currentLng,
          });
          setDriverLocation({
            lat: data.driver.currentLat,
            lng: data.driver.currentLng,
            heading: data.driver.heading,
            speed: data.driver.speed,
            timestamp: new Date(),
          });
        }
      });

      // Cleanup on unmount or dependency change
      return () => {
        console.log('🔌 Unsubscribing from ride:', id);
        socket.emit('ride:unsubscribe', { rideId: id });
        socket.off('driver:location:update');
        socket.off('ride:status');
      };
    }
  }, [socket, connected, id]);

  // Initialize map when ride data is available (only once)
  useEffect(() => {
    if (!ride || !mapContainerRef.current || mapInitializedRef.current) return;

    // Calculate center point between pickup and drop
    const centerLat = (ride.originLat + ride.destLat) / 2;
    const centerLng = (ride.originLng + ride.destLng) / 2;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      preferCanvas: true,
    });
    mapRef.current = map;
    mapInitializedRef.current = true;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Set initial driver location if available from ride data
    if (ride.driver && ride.driver.currentLat && ride.driver.currentLng) {
      setDriverLocation({
        lat: ride.driver.currentLat,
        lng: ride.driver.currentLng,
      });
    }

    // Custom marker icons
    const pickupIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });
    const dropIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: iconShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    // Add pickup marker
    pickupMarkerRef.current = L.marker([ride.originLat, ride.originLng], {
      icon: pickupIcon,
    }).addTo(map);
    pickupMarkerRef.current.bindPopup('<b>📍 Pickup Location</b><br>' + (ride.originAddress || 'Pickup'));

    // Add drop marker
    dropMarkerRef.current = L.marker([ride.destLat, ride.destLng], {
      icon: dropIcon,
    }).addTo(map);
    dropMarkerRef.current.bindPopup('<b>🎯 Drop-off Location</b><br>' + (ride.destAddress || 'Drop-off'));

    // Draw route line between pickup and drop and store reference
    routeLineRef.current = L.polyline(
      [
        [ride.originLat, ride.originLng],
        [ride.destLat, ride.destLng],
      ],
      {
        color: '#6366f1',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }
    ).addTo(map);

    // Fit bounds to show all markers
    const bounds = L.latLngBounds([
      [ride.originLat, ride.originLng],
      [ride.destLat, ride.destLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Force map to invalidate size after a short delay
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  }, [ride]);

  // Update driver marker position when location changes
  useEffect(() => {
    if (!driverLocation || !mapRef.current || !mapInitializedRef.current) {
      return;
    }

    console.log('🗺️ Updating driver marker:', driverLocation);

    const driverIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: iconShadow,
      iconSize: [35, 57],
      iconAnchor: [17, 57],
      popupAnchor: [1, -45],
    });

    try {
      if (driverMarkerRef.current && mapRef.current.hasLayer(driverMarkerRef.current)) {
        // Update existing marker position
        console.log('✅ Updating existing driver marker position');
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
      } else {
        // Remove old marker if it exists but is not on the map
        if (driverMarkerRef.current) {
          console.log('🗑️ Removing old driver marker');
          driverMarkerRef.current.remove();
        }
        // Create new driver marker
        console.log('➕ Creating new driver marker');
        driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], {
          icon: driverIcon,
        }).addTo(mapRef.current);
        driverMarkerRef.current.bindPopup('<b>🚗 Driver Location</b><br>Live tracking');
      }
    } catch (error) {
      console.error('❌ Error updating driver marker:', error);
      // Reset marker on error
      driverMarkerRef.current = null;
    }
    
    // Optionally pan to driver location (uncomment if you want auto-follow)
    // mapRef.current.panTo([driverLocation.lat, driverLocation.lng]);
  }, [driverLocation]);

  const loadRide = async () => {
    try {
      const data = await ridesApi.getRide(id!);
      setRide(data);
    } catch (error) {
      console.error('Error loading ride:', error);
      alert('Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-200',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Ride not found</p>
          <button onClick={() => navigate('/rider/dashboard')} className="btn btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <header className="bg-dark-900/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>
      </header>
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Map */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">🗺️ Live Tracking</h2>
                {ride.driver && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${
                    driverLocation ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${driverLocation ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                    {driverLocation ? 'Driver Active' : 'Waiting for driver'}
                  </div>
                )}
              </div>
              <div
                ref={mapContainerRef}
                className="h-96 rounded-lg border-2 border-white/20 overflow-hidden"
                style={{ zIndex: 0 }}
              />
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/100 rounded-full"></div>
                  <span className="text-gray-400">Pickup</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-400">Drop-off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-dark-7000 rounded-full"></div>
                  <span className="text-gray-400">Driver</span>
                </div>
              </div>
            </div>

            {/* Ride Info */}
            <div className="card">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Ride Details</h1>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ride.status)}`}>
                    {ride.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">WebSocket</div>
                  <div className={`text-sm font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connected ? '🟢 Connected' : '🔴 Disconnected'}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Route</div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{ride.originAddress || 'Origin'}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold">{ride.destAddress || 'Destination'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Departure Time</div>
                    <div className="font-semibold">
                      {new Date(ride.departTime).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Distance</div>
                    <div className="font-semibold">{ride.distanceKm.toFixed(1)} km</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Capacity</div>
                    <div className="font-semibold">
                      {ride.seatsTaken}/{ride.capacity} seats taken
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Shared Ride</div>
                    <div className="font-semibold">{ride.isShared ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            {ride.driver && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Driver Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
                      🚗
                    </div>
                    <div>
                      <div className="font-semibold">{ride.driver.name}</div>
                      <div className="text-sm text-gray-400">{ride.driver.email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-400">Vehicle</div>
                      <div className="font-medium">{ride.driver.vehicle}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Model</div>
                      <div className="font-medium">{ride.driver.vehicleModel || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Color</div>
                      <div className="font-medium">{ride.driver.vehicleColor || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">License Plate</div>
                      <div className="font-medium">{ride.driver.licensePlate || 'N/A'}</div>
                    </div>
                  </div>
                  {driverLocation && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-400 mb-2">Real-time Location</div>
                      <div className="text-xs bg-dark-800 p-3 rounded-lg font-mono">
                        Lat: {driverLocation.lat.toFixed(6)}, Lng: {driverLocation.lng.toFixed(6)}
                        <br />
                        Speed: {driverLocation.speed || 0} km/h
                        <br />
                        Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members */}
            {ride.members && ride.members.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Riders ({ride.members.length})</h2>
                <div className="space-y-3">
                  {ride.members.map((member: any) => (
                    <div key={member.id} className="flex justify-between items-center p-3 bg-dark-800 rounded-lg">
                      <div>
                        <div className="font-medium">{member.user.name || member.user.email}</div>
                        <div className="text-sm text-gray-400">{member.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary-600">₹{member.price.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Pricing</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Fare</span>
                  <span>₹{ride.baseFare.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Distance ({ride.distanceKm.toFixed(1)} km)</span>
                  <span>₹{(ride.distanceKm * 1.2).toFixed(0)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary-600">₹{ride.baseFare.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideDetails;