import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridesApi } from '../../services/api';
import LocationPicker from '../../components/LocationPicker';

const CreateRide = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    originLat: 0,
    originLng: 0,
    originAddress: '',
    destLat: 0,
    destLng: 0,
    destAddress: '',
    departTime: '',
    isShared: true,
    capacity: 4,
  });
  const [originSet, setOriginSet] = useState(false);
  const [destSet, setDestSet] = useState(false);

  // Generate datetime-local value for current time + 1 hour
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!originSet || !destSet) {
      alert('Please select both origin and destination locations on the map');
      return;
    }

    if (!formData.departTime) {
      alert('Please select departure time');
      return;
    }

    setLoading(true);

    try {
      await ridesApi.createRide({
        originLat: formData.originLat,
        originLng: formData.originLng,
        originAddress: formData.originAddress,
        destLat: formData.destLat,
        destLng: formData.destLng,
        destAddress: formData.destAddress,
        departTime: new Date(formData.departTime).toISOString(),
        seatsNeeded: 1,
        isShared: formData.isShared,
        capacity: formData.capacity,
      });

      alert(`✅ Ride created successfully! ${formData.isShared ? 'Riders can now join your ride.' : 'Private ride created.'}`);
      navigate('/driver/dashboard');
    } catch (error: any) {
      console.error('Create ride error:', error);
      alert(error.response?.data?.error || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create a New Ride</h1>
          <p className="text-gray-400">
            Set your route and let riders join your journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Origin Location */}
          <LocationPicker
            label="📍 Origin (Where you're starting)"
            markerColor="green"
            onLocationSelect={(lat, lng, address) => {
              setFormData({ ...formData, originLat: lat, originLng: lng, originAddress: address });
              setOriginSet(true);
            }}
          />

          {/* Destination Location */}
          <LocationPicker
            label="🎯 Destination (Where you're going)"
            markerColor="red"
            onLocationSelect={(lat, lng, address) => {
              setFormData({ ...formData, destLat: lat, destLng: lng, destAddress: address });
              setDestSet(true);
            }}
          />

          {/* Departure Time - Modern UI */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🕐 Departure Time *
            </label>
            <input
              type="datetime-local"
              value={formData.departTime}
              onChange={(e) => setFormData({ ...formData, departTime: e.target.value })}
              min={getMinDateTime()}
              className="input text-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Select when you plan to depart
            </p>
          </div>

          {/* Ride Type */}
          <div className="bg-dark-800 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🚗 Ride Type
            </label>
            <div className="flex gap-4">
              <label className="flex-1">
                <input
                  type="radio"
                  checked={formData.isShared}
                  onChange={() => setFormData({ ...formData, isShared: true })}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 border-white/20 rounded-lg cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-all">
                  <div className="font-semibold text-white">🤝 Shared Ride</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Allow riders to join and share costs
                  </div>
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  checked={!formData.isShared}
                  onChange={() => setFormData({ ...formData, isShared: false })}
                  className="sr-only peer"
                />
                <div className="p-4 border-2 border-white/20 rounded-lg cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50 transition-all">
                  <div className="font-semibold text-white">🔒 Private Ride</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Just you, no sharing
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Capacity (only for shared rides) */}
          {formData.isShared && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🪑 Available Seats
              </label>
              <select
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="input"
              >
                <option value={1}>1 seat</option>
                <option value={2}>2 seats</option>
                <option value={3}>3 seats</option>
                <option value={4}>4 seats</option>
                <option value={5}>5 seats</option>
                <option value={6}>6 seats</option>
                <option value={7}>7 seats</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How many riders can join your ride?
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-full text-lg py-4"
            disabled={loading || !originSet || !destSet}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Ride...
              </span>
            ) : (
              '✅ Create Ride & Notify Riders'
            )}
          </button>

          {(!originSet || !destSet) && (
            <p className="text-sm text-center text-gray-500">
              Please select both origin and destination to continue
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateRide;
