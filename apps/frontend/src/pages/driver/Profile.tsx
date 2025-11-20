import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverApi } from '../../services/api';

const DriverProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicle: '',
    vehicleModel: '',
    vehicleColor: '',
    licensePlate: '',
    licenseId: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await driverApi.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        vehicle: data.vehicle || '',
        vehicleModel: data.vehicleModel || '',
        vehicleColor: data.vehicleColor || '',
        licensePlate: data.licensePlate || '',
        licenseId: data.licenseId || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await driverApi.updateProfile(formData);
      alert('Profile updated successfully!');
      navigate('/driver/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-800">
      <header className="bg-dark-700 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="card">
          <h1 className="text-3xl font-bold mb-6">Driver Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="input bg-gray-100"
                    value={profile?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Type</label>
                  <select
                    className="input"
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    required
                  >
                    <option value="">Select vehicle type</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Model</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Toyota Camry 2020"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Color</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Silver"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">License Plate</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., ABC-1234"
                    value={formData.licensePlate}
                    onChange={(e) =>
                      setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Driver License ID</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., DL12345678"
                    value={formData.licenseId}
                    onChange={(e) => setFormData({ ...formData, licenseId: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t flex gap-4">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
