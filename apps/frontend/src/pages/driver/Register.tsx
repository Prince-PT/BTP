import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { driverApi, authApi } from '../../services/api';

const DriverRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    vehicle: 'Sedan',
    vehicleModel: '',
    vehicleColor: '',
    licensePlate: '',
    licenseId: '',
  });
  
  const [otp, setOtp] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await driverApi.register(formData);
      setSuccess('Registration successful! We\'ve sent an OTP to your email.');
      
      // Request OTP for login
      await authApi.requestOtp(formData.email, 'driver');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.verifyOtp(formData.email, otp, 'driver');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/driver/dashboard');
      window.location.reload(); // Force reload to update auth context
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center p-6">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-primary-400 transition-colors"
      >
        <span className="text-2xl">←</span>
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="card max-w-2xl w-full bg-dark-800 border border-white/10 shadow-glow">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow">
            🚗
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Become a Driver</h1>
          <p className="text-gray-400">
            {step === 'register' 
              ? 'Join our community of drivers and start earning today!'
              : 'Enter the OTP sent to your email'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg">
            {success}
          </div>
        )}

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Personal Information */}
            <div className="bg-dark-700/50 border border-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>👤</span> Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-dark-700/50 border border-white/10 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>🚙</span> Vehicle Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    value={formData.vehicle}
                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="input bg-dark-700 border-white/10 text-white"
                    required
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Van">Van</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="Toyota Camry"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                    placeholder="Silver"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    placeholder="ABC-1234"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver License ID
                  </label>
                  <input
                    type="text"
                    value={formData.licenseId}
                    onChange={(e) => setFormData({ ...formData, licenseId: e.target.value })}
                    placeholder="DL12345678"
                    className="input bg-dark-700 border-white/10 text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white w-full text-lg py-3 shadow-glow" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering...
                </span>
              ) : (
                '✅ Register as Driver'
              )}
            </button>

            <div className="text-center text-sm text-gray-400">
              Already registered?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                Login here
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="input bg-dark-700 border-white/10 text-white placeholder-gray-500 text-center text-2xl tracking-widest"
                required
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Check your email (<span className="text-primary-400">{formData.email}</span>) for the OTP
              </p>
            </div>

            <button type="submit" className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white w-full shadow-glow" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default DriverRegister;
