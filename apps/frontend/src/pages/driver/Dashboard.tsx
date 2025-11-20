import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { driverApi, ridesApi } from '../../services/api';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { socket, connected } = useSocket();
  const [profile, setProfile] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-share location when driver is available (online)
  useEffect(() => {
    if (isAvailable && socket && connected) {
      // Share location immediately when going online
      shareLocation();
      
      // Then continue sharing every 5 seconds
      const interval = setInterval(() => {
        shareLocation();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAvailable, socket, connected]);

  const loadData = async () => {
    try {
      const [profileData, ridesData] = await Promise.all([
        driverApi.getProfile(),
        driverApi.getRides(),
      ]);
      
      console.log('📊 Driver Dashboard - Loaded Rides:', ridesData);
      console.log('📊 Rides with members:', ridesData.map((r: any) => ({
        id: r.id,
        status: r.status,
        membersCount: r.members?.length || 0,
        members: r.members
      })));
      
      setProfile(profileData);
      setRides(ridesData);
      setIsAvailable(profileData.isAvailable);
      
      // Load available ride requests if driver is available
      if (profileData.isAvailable) {
        loadAvailableRequests();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRequests = async () => {
    try {
      const params = currentLocation 
        ? { lat: currentLocation.lat, lng: currentLocation.lng, radius: 10 }
        : undefined;
      const data = await ridesApi.getAvailableRequests(params);
      setAvailableRequests(data.rides || []);
    } catch (error) {
      console.error('Error loading available requests:', error);
    }
  };

  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          if (socket && connected) {
            // Only log occasionally to reduce noise (every 30 seconds)
            const shouldLog = Math.random() < 0.16; // ~1 in 6 updates (every 30s at 5s interval)
            if (shouldLog) {
              console.log('📍 Location shared:', { lat: latitude, lng: longitude });
            }
            
            socket.emit('driver:location', {
              lat: latitude,
              lng: longitude,
              heading: position.coords.heading || 0,
              speed: position.coords.speed || 0,
            });
            
            // Listen for acknowledgment (only log errors)
            socket.once('driver:location:ack', (ack) => {
              if (!ack.success) {
                console.error('❌ Location update failed:', ack.error);
              }
            });
          }

          // Also update via REST API (silent unless error)
          driverApi.updateLocation({
            lat: latitude,
            lng: longitude,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          }).catch(err => console.error('❌ REST location update failed:', err));
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Failed to get location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      await driverApi.updateAvailability(newStatus);
      setIsAvailable(newStatus);
      
      if (newStatus) {
        loadAvailableRequests();
      } else {
        setAvailableRequests([]);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!confirm('Accept this ride request?')) return;
    
    try {
      await ridesApi.acceptRide(rideId);
      alert('Ride accepted! The rider has been notified.');
      navigate(`/rider/rides/${rideId}`);
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      alert(error.response?.data?.error || 'Failed to accept ride');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'badge badge-warning',
      ASSIGNED: 'badge badge-info',
      IN_PROGRESS: 'badge badge-warning',
      COMPLETED: 'badge badge-success',
      CANCELLED: 'badge badge-error',
    };
    return badges[status] || 'badge';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <header className="bg-dark-900/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-2xl shadow-glow">
                🚗
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                Driver Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/driver/profile" className="btn btn-secondary text-sm">
                Profile
              </Link>
              <button onClick={logout} className="btn btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Available Ride Requests */}
        {isAvailable && availableRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">🎯 Available Ride Requests</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRequests.map((request: any) => (
                <div key={request.id} className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 hover:border-primary-400 hover:shadow-glow transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400">Pickup</div>
                      <div className="font-semibold text-gray-100 mb-2 group-hover:text-primary-300 transition-colors">
                        {request.originAddress || `${request.originLat.toFixed(4)}, ${request.originLng.toFixed(4)}`}
                      </div>
                      <div className="text-sm text-gray-400">Drop</div>
                      <div className="font-semibold text-gray-100 group-hover:text-primary-300 transition-colors">
                        {request.destAddress || `${request.destLat.toFixed(4)}, ${request.destLng.toFixed(4)}`}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4 py-3 border-t border-b border-white/10">
                    <div className="text-gray-300">
                      📏 {request.distanceKm.toFixed(1)} km
                    </div>
                    <div className="text-primary-400 font-semibold">
                      💰 ₹{request.baseFare.toFixed(0)}
                    </div>
                    <div className="text-gray-300">
                      🪑 {request.seatsNeeded} seat{request.seatsNeeded > 1 ? 's' : ''}
                    </div>
                    <div className="text-gray-300">
                      🕐 {new Date(request.departTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {request.distanceToPickup && (
                      <div className="text-gray-300 col-span-2">
                        📍 {request.distanceToPickup.toFixed(1)} km away
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleAcceptRide(request.id)}
                    className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-glow w-full"
                  >
                    ✓ Accept Ride
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAvailable && availableRequests.length === 0 && (
          <div className="mb-8 card bg-yellow-500/10 border border-yellow-500/30 text-center py-8">
            <p className="text-yellow-300 text-lg">
              🔍 No ride requests available at the moment
            </p>
            <p className="text-yellow-400 text-sm mt-2">
              New requests will appear here automatically
            </p>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-300 mb-1">Status</div>
                <div className={`text-xl font-bold ${isAvailable ? 'text-green-400' : 'text-gray-400'}`}>
                  {isAvailable ? 'Available' : 'Offline'}
                </div>
              </div>
              <div className="text-3xl">{isAvailable ? '🟢' : '⚫'}</div>
            </div>
            <button onClick={toggleAvailability} className={`btn w-full ${isAvailable ? 'btn-secondary' : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-glow'}`}>
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          </div>

          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-300 mb-1">WebSocket</div>
                <div className={`text-xl font-bold ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <div className="text-3xl">{connected ? '📡' : '📴'}</div>
            </div>
            <div className="text-sm text-gray-300">
              {isAvailable ? '📍 Sharing location' : '📍 Location sharing offline'}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm text-gray-300 mb-1">Total Rides</div>
                <div className="text-3xl font-bold text-primary-400">{rides.length}</div>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <div className="text-sm text-gray-300">
              {rides.filter((r) => r.status === 'COMPLETED').length} completed
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4 text-white">Your Vehicle</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Type</div>
                <div className="font-semibold text-gray-100">{profile.vehicle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Model</div>
                <div className="font-semibold text-gray-100">{profile.vehicleModel || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Color</div>
                <div className="font-semibold text-gray-100">{profile.vehicleColor || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">License Plate</div>
                <div className="font-semibold text-gray-100">{profile.licensePlate || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Rides List */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Rides</h2>
            <select className="input max-w-xs bg-dark-700 border-white/20 text-white" onChange={() => loadData()}>
              <option value="">All Rides</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {rides.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🚗</div>
              <p className="text-lg">No rides yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <Link
                  key={ride.id}
                  to={`/driver/rides/${ride.id}`}
                  className="block p-6 bg-gradient-to-br from-dark-800 to-dark-700 rounded-xl hover:from-dark-700 hover:to-dark-600 border border-white/20 hover:border-primary-400 hover:shadow-glow transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={getStatusBadge(ride.status)}>{ride.status}</span>
                        <span className="text-sm text-gray-300">
                          {new Date(ride.departTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-lg">
                        <span className="font-semibold text-gray-100 group-hover:text-primary-300 transition-colors">{ride.originAddress || 'Origin'}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-semibold text-gray-100 group-hover:text-primary-300 transition-colors">{ride.destAddress || 'Destination'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-400">
                        ₹{ride.baseFare.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Distance:</span>{' '}
                      <span className="font-medium text-gray-200">{ride.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Seats:</span>{' '}
                      <span className="font-medium text-gray-200">
                        {ride.seatsTaken}/{ride.capacity}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Riders:</span>{' '}
                      <span className="font-medium text-blue-400">
                        {ride.members?.length || 0} 
                        {ride.members?.length ? ' 👥' : ' (none)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>{' '}
                      <span className="font-medium text-gray-200">{ride.isShared ? '🤝 Shared' : '🚗 Private'}</span>
                    </div>
                  </div>

                  {/* Always show members section, even if empty */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-sm font-semibold text-gray-200 mb-2 flex items-center justify-between">
                      <span>👥 Passengers ({ride.members?.length || 0})</span>
                      {ride.isShared && (
                        <span className="text-xs text-gray-400">
                          {ride.capacity - ride.seatsTaken} seats available
                        </span>
                      )}
                    </div>
                    {ride.members && ride.members.length > 0 ? (
                      <div className="space-y-2">
                        {ride.members.map((member: any) => (
                          <div key={member.id} className="flex justify-between items-center text-sm bg-dark-800 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.user?.name || member.user?.email || 'Unknown'}</span>
                              {member.user?.phone && (
                                <span className="text-xs text-gray-500">📞 {member.user.phone}</span>
                              )}
                            </div>
                            <span className={`badge ${
                              member.status === 'CONFIRMED' ? 'badge-success' :
                              member.status === 'PENDING' ? 'badge-warning' :
                              member.status === 'PICKED_UP' ? 'badge-info' :
                              member.status === 'DROPPED_OFF' ? 'badge-secondary' :
                              'badge-error'
                            }`}>
                              {member.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic py-2">
                        No passengers yet
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
