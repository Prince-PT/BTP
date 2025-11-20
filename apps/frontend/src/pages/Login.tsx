import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

const Login = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'user' | 'driver'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'driver' ? '/driver/dashboard' : '/rider/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.requestOtp(email, role);
      setSuccess('OTP sent to your email! Check your inbox.');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, otp, role);
      // Redirect will happen via useEffect
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.requestOtp(email, role);
      setSuccess('OTP resent to your email!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
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

      <div className="card max-w-md w-full bg-dark-800 border border-white/10 shadow-glow">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow">
            🚗
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Secure login with OTP - no password needed</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRole('user')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              role === 'user'
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600 border border-white/10'
            }`}
          >
            🧑 I'm a Rider
          </button>
          <button
            onClick={() => setRole('driver')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              role === 'driver'
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-glow'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600 border border-white/10'
            }`}
          >
            🚗 I'm a Driver
          </button>
        </div>

        {/* Error/Success Messages */}
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

        {/* Email Step */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input bg-dark-700 border-white/10 text-white placeholder-gray-500 focus:border-primary-500"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white w-full shadow-glow" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP sent to <span className="text-primary-400">{email}</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="input bg-dark-700 border-white/10 text-white placeholder-gray-500 focus:border-primary-500 text-center text-2xl tracking-widest"
                maxLength={6}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button type="submit" className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white w-full mb-3 shadow-glow" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify & Login'
              )}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="btn bg-dark-700 text-gray-300 hover:bg-dark-600 border border-white/10 flex-1"
                disabled={loading}
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="btn border-2 border-primary-500/50 hover:border-primary-500 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 flex-1"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {role === 'driver' && step === 'email' && (
          <p className="mt-4 text-center text-sm text-gray-400">
            Not registered as a driver yet?{' '}
            <Link to="/driver/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Register here
            </Link>
          </p>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
