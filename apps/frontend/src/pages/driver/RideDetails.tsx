import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ridesApi } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const DriverRideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadRide();
  }, [id]);

  useEffect(() => {
    if (socket && connected && id) {
      socket.emit('ride:subscribe', { rideId: id });

      socket.on('ride:status', (data) => {
        setRide(data);
      });

      return () => {
        socket.emit('ride:unsubscribe', { rideId: id });
        socket.off('ride:status');
      };
    }
  }, [socket, connected, id]);

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

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await ridesApi.updateRideStatus(id!, newStatus);
      await loadRide();
      
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500/100 text-white px-6 py-4 rounded-lg shadow-lg z-50';
      successMsg.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p class="font-semibold">Status updated to ${newStatus}</p>
        </div>
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.error || 'Failed to update ride status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDropOffMember = async (memberId: string) => {
    if (!confirm('Mark this passenger as dropped off?')) return;

    try {
      setUpdating(true);
      const result = await ridesApi.completeMember(id!, memberId);
      setRide(result);
      
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500/100 text-white px-6 py-4 rounded-lg shadow-lg z-50';
      successMsg.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-semibold">Passenger Dropped Off!</p>
            <p class="text-sm opacity-90">Prices have been recalculated</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error: any) {
      console.error('Error marking member as dropped:', error);
      alert(error.response?.data?.error || 'Failed to update passenger status');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveJoinRequest = async (memberId: string, approved: boolean) => {
    const action = approved ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${action} this join request?`)) return;

    try {
      setUpdating(true);
      const response = await fetch(`http://localhost:3000/api/rides/${id}/members/${memberId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ approved }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process request');
      }

      await loadRide();
      
      const successMsg = document.createElement('div');
      successMsg.className = `fixed top-4 right-4 ${approved ? 'bg-green-500/100' : 'bg-orange-500'} text-white px-6 py-4 rounded-lg shadow-lg z-50`;
      successMsg.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p class="font-semibold">Join request ${approved ? 'approved' : 'rejected'}!</p>
        </div>
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (error: any) {
      console.error('Error processing join request:', error);
      alert(error.message || `Failed to ${action} join request`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      ASSIGNED: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      IN_PROGRESS: 'bg-green-500/20 text-green-300 border border-green-500/30',
      COMPLETED: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const getMemberStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      PICKED_UP: 'bg-green-500/20 text-green-300 border border-green-500/30',
      DROPPED_OFF: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      CANCELLED: 'bg-red-500/20 text-red-300 border border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-300">Ride not found</p>
          <button onClick={() => navigate('/driver/dashboard')} className="btn btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const activeMembers = ride.members?.filter((m: any) => m.status !== 'DROPPED_OFF' && m.status !== 'CANCELLED') || [];
  const droppedMembers = ride.members?.filter((m: any) => m.status === 'DROPPED_OFF') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <header className="bg-dark-900/80 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            ← Back
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Ride Status Card */}
        <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Ride Details</h1>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ride.status)}`}>
                {ride.status}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Fare</div>
              <div className="text-3xl font-bold text-primary-400">₹{ride.baseFare.toFixed(0)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400">From</div>
              <div className="font-semibold text-gray-100">{ride.originAddress || 'Origin'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">To</div>
              <div className="font-semibold text-gray-100">{ride.destAddress || 'Destination'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Departure</div>
              <div className="font-semibold text-gray-100">{new Date(ride.departTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Distance</div>
              <div className="font-semibold text-gray-100">{ride.distanceKm.toFixed(1)} km</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Capacity</div>
              <div className="font-semibold text-gray-100">{ride.seatsTaken}/{ride.capacity} seats</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Type</div>
              <div className="font-semibold text-gray-100">{ride.isShared ? '🤝 Shared' : '👤 Private'}</div>
            </div>
          </div>

          {/* Status Actions */}
          <div className="pt-4 border-t border-white/10">
            <div className="text-sm font-medium text-gray-300 mb-3">Update Status:</div>
            <div className="grid grid-cols-3 gap-2">
              {ride.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  disabled={updating}
                  className="btn btn-primary disabled:opacity-50"
                >
                  🚗 Start Ride
                </button>
              )}
              {ride.status === 'IN_PROGRESS' && activeMembers.length === 0 && (
                <button
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={updating}
                  className="btn btn-success disabled:opacity-50"
                >
                  ✓ Complete Ride
                </button>
              )}
              {(ride.status === 'ASSIGNED' || ride.status === 'IN_PROGRESS') && (
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={updating}
                  className="btn btn-secondary bg-red-500/100 hover:bg-red-600 text-white disabled:opacity-50"
                >
                  ✗ Cancel Ride
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pending Join Requests */}
        {ride.isShared && ride.members.filter((m: any) => m.status === 'PENDING').length > 0 && (
          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border-2 border-yellow-500/30 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">⏳</span>
              Pending Join Requests ({ride.members.filter((m: any) => m.status === 'PENDING').length})
            </h2>
            <div className="space-y-3">
              {ride.members
                .filter((m: any) => m.status === 'PENDING')
                .map((member: any) => (
                  <div key={member.id} className="p-4 bg-dark-900/50 rounded-lg border-2 border-yellow-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-xl border border-yellow-500/30">
                            ⏳
                          </div>
                          <div>
                            <div className="font-semibold text-lg text-gray-100">{member.user.name || member.user.email}</div>
                            <div className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              PENDING APPROVAL
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <div className="text-gray-400 text-xs">📍 Their Pickup</div>
                            <div className="font-medium text-gray-100">{member.pickupAddress || 'Custom location'}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">🎯 Their Drop</div>
                            <div className="font-medium text-gray-100">{member.dropAddress || 'Custom location'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div className="bg-dark-800/80 border border-white/10 p-2 rounded">
                            <div className="text-gray-400">Estimated Fare</div>
                            <div className="font-semibold text-green-400">₹{member.price.toFixed(0)}</div>
                          </div>
                          {member.offsetKm > 0 && (
                            <div className="bg-dark-800/80 border border-white/10 p-2 rounded">
                              <div className="text-gray-400">Route Offset</div>
                              <div className="font-semibold text-gray-200">{member.offsetKm.toFixed(1)} km</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveJoinRequest(member.id, true)}
                          disabled={updating}
                          className="btn btn-success btn-sm whitespace-nowrap disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleApproveJoinRequest(member.id, false)}
                          disabled={updating}
                          className="btn btn-secondary bg-red-500/100 hover:bg-red-600 text-white btn-sm whitespace-nowrap disabled:opacity-50"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Active Passengers */}
        {activeMembers.length > 0 && (
          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Active Passengers ({activeMembers.length})
            </h2>
            <div className="space-y-3">
              {activeMembers
                .sort((a: any, b: any) => (a.dropOrder || 99) - (b.dropOrder || 99))
                .map((member: any) => (
                  <div key={member.id} className="p-4 bg-dark-900/50 rounded-lg border-2 border-primary-500/30 hover:border-primary-400 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center text-xl font-bold text-primary-300 border border-primary-500/30">
                            {member.dropOrder || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-lg text-gray-100">{member.user.name || member.user.email}</div>
                            <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getMemberStatusColor(member.status)}`}>
                              {member.status}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <div className="text-gray-400 text-xs">📍 Pickup</div>
                            <div className="font-medium text-gray-100">{member.pickupAddress || 'Custom location'}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">🎯 Drop</div>
                            <div className="font-medium text-gray-100">{member.dropAddress || 'Custom location'}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                          <div className="bg-dark-800/80 border border-white/10 p-2 rounded">
                            <div className="text-gray-400">Fare</div>
                            <div className="font-semibold text-green-400">₹{member.price.toFixed(0)}</div>
                          </div>
                          {member.originalPrice && member.originalPrice !== member.price && (
                            <div className="bg-dark-800/80 border border-white/10 p-2 rounded">
                              <div className="text-gray-400">Original</div>
                              <div className="font-semibold text-gray-500 line-through">₹{member.originalPrice.toFixed(0)}</div>
                            </div>
                          )}
                          {member.offsetKm > 0 && (
                            <div className="bg-dark-800/80 border border-white/10 p-2 rounded">
                              <div className="text-gray-400">Offset</div>
                              <div className="font-semibold text-gray-200">{member.offsetKm.toFixed(1)} km</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4">
                        {ride.status === 'IN_PROGRESS' && member.status !== 'DROPPED_OFF' && (
                          <button
                            onClick={() => handleDropOffMember(member.id)}
                            disabled={updating}
                            className="btn btn-success btn-sm whitespace-nowrap disabled:opacity-50"
                          >
                            ✓ Drop Off
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {ride.status === 'IN_PROGRESS' && activeMembers.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start gap-2 text-sm text-yellow-300">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-yellow-400">Drop-off Order</p>
                    <p className="text-gray-300">Passengers are numbered in the suggested drop-off order. Prices will be recalculated after each drop-off.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dropped Off Passengers */}
        {droppedMembers.length > 0 && (
          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">✓</span>
              Dropped Off ({droppedMembers.length})
            </h2>
            <div className="space-y-2">
              {droppedMembers.map((member: any) => (
                <div key={member.id} className="p-3 bg-dark-900/50 border border-white/10 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-100">{member.user.name || member.user.email}</div>
                    <div className="text-sm text-gray-400">
                      {member.droppedOffAt && `Dropped at ${new Date(member.droppedOffAt).toLocaleTimeString()}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-400">₹{member.price.toFixed(0)}</div>
                    <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getMemberStatusColor(member.status)}`}>
                      {member.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No passengers message */}
        {(!ride.members || ride.members.length === 0) && (
          <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 text-center py-8">
            <div className="text-4xl mb-2">👤</div>
            <p className="text-gray-300">No passengers for this ride</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverRideDetails;
