import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { ridesApi } from '../../services/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    if (socket && connected) {
      // Listen for ride status updates
      socket.on('ride:status', (updatedRide) => {
        console.log('📡 Ride update received:', updatedRide);
        setRides((prevRides) =>
          prevRides.map((rideData) => {
            if (rideData.ride.id === updatedRide.id) {
              // Find the member entry for this user
              const memberData = updatedRide.members?.find((m: any) => m.userId === user?.id);
              if (memberData) {
                return {
                  ...rideData,
                  ride: updatedRide,
                  status: memberData.status,
                  price: memberData.price,
                };
              }
            }
            return rideData;
          })
        );
      });

      return () => {
        socket.off('ride:status');
      };
    }
  }, [socket, connected, user]);

  const loadRides = async () => {
    try {
      const data = await ridesApi.getUserRides(user!.id);
      setRides(data);
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (memberStatus: string, rideStatus: string) => {
    // Priority: member status first, then ride status
    
    // If member is pending approval
    if (memberStatus === 'PENDING') {
      return {
        badge: 'badge badge-warning',
        label: '⏳ AWAITING DRIVER',
        description: 'Your join request is pending',
      };
    }
    
    // If member was cancelled/rejected
    if (memberStatus === 'CANCELLED') {
      return {
        badge: 'badge badge-error',
        label: '✗ REJECTED',
        description: 'Driver declined your request',
      };
    }
    
    // If member is confirmed, check ride status
    if (memberStatus === 'CONFIRMED') {
      if (rideStatus === 'PENDING') {
        return {
          badge: 'badge badge-info',
          label: '🔍 FINDING DRIVER',
          description: 'Searching for available drivers',
        };
      }
      
      if (rideStatus === 'ASSIGNED') {
        return {
          badge: 'badge badge-success',
          label: '✓ DRIVER ASSIGNED',
          description: 'Driver accepted your ride',
        };
      }
      
      if (rideStatus === 'IN_PROGRESS') {
        return {
          badge: 'badge bg-purple-500/20 text-purple-400 border border-purple-500/30',
          label: '🚗 IN PROGRESS',
          description: 'Currently on the way',
        };
      }
    }
    
    // Picked up
    if (memberStatus === 'PICKED_UP') {
      return {
        badge: 'badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        label: '🚙 IN VEHICLE',
        description: 'En route to destination',
      };
    }
    
    // Dropped off
    if (memberStatus === 'DROPPED_OFF' || rideStatus === 'COMPLETED') {
      return {
        badge: 'badge bg-gray-500/20 text-gray-400 border border-gray-500/30',
        label: '✓ COMPLETED',
        description: 'Ride completed',
      };
    }
    
    // Cancelled
    if (rideStatus === 'CANCELLED') {
      return {
        badge: 'badge badge-error',
        label: '✗ CANCELLED',
        description: 'Ride was cancelled',
      };
    }
    
    // Default
    return {
      badge: 'badge bg-gray-500/20 text-gray-400 border border-gray-500/30',
      label: memberStatus || rideStatus,
      description: '',
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-2xl shadow-glow">
                🚗
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                CampusCommute
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 hidden sm:block">Hi, {user?.email?.split('@')[0]}</span>
              <button onClick={logout} className="btn btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/rider/book" className="group relative btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg px-8 py-6 text-center shadow-glow transform hover:scale-105 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative">🚗 Book a New Ride</span>
          </Link>
          <Link to="/rider/shared-rides" className="group relative btn bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-pink hover:to-accent-purple text-white text-lg px-8 py-6 text-center shadow-glow transform hover:scale-105 transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative">🤝 Join a Shared Ride</span>
          </Link>
        </div>

        {/* Rides List */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 text-white">Your Rides</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading your rides...</p>
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚗</div>
              <p className="text-gray-400 text-lg mb-4">You haven't booked any rides yet</p>
              <Link to="/rider/book" className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-glow">
                Book Your First Ride
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((rideData) => {
                const statusInfo = getStatusInfo(rideData.status, rideData.ride.status);
                return (
                  <Link
                    key={rideData.id}
                    to={`/rider/rides/${rideData.ride.id}`}
                    className="block p-6 bg-gradient-to-br from-dark-800 to-dark-700 rounded-xl hover:from-dark-700 hover:to-dark-600 transition-all border border-white/20 hover:border-primary-400 hover:shadow-glow group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <span className="text-lg font-semibold text-gray-100 group-hover:text-primary-300 transition-colors">
                            {rideData.pickupAddress || 'Pickup Location'}
                          </span>
                          <span className="text-gray-400 hidden sm:block">→</span>
                          <span className="text-lg font-semibold text-gray-100 group-hover:text-primary-300 transition-colors">
                            {rideData.dropAddress || 'Drop Location'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                          <span>📅</span>
                          <span>{new Date(rideData.ride.departTime).toLocaleString()}</span>
                        </div>
                        {statusInfo.description && (
                          <div className="text-sm text-gray-400 italic flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></span>
                            {statusInfo.description}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className={statusInfo.badge}>
                          {statusInfo.label}
                        </div>
                        <div className="text-2xl font-bold text-primary-400 mt-2">
                          ₹{rideData.price.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {rideData.ride.isShared && '🤝 Shared Ride'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 pt-3 border-t border-white/10">
                      <span className="flex items-center gap-1">
                        🚗 {rideData.ride.driver?.vehicle || 'Vehicle TBD'}
                      </span>
                      {rideData.ride.driver?.name && (
                        <span className="flex items-center gap-1">
                          👤 {rideData.ride.driver.name}
                        </span>
                      )}
                      {rideData.ride.isShared && (
                        <span className="flex items-center gap-1">
                          💺 {rideData.ride.seatsTaken}/{rideData.ride.capacity} seats
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
