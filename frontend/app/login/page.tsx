'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'role' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!name || name.trim().length < 2) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.sendOTP(email, name);
      
      if (response.success) {
        toast.success('OTP sent to your email!');
        // Show mock OTP in development
        if (response.mockOTP) {
          toast.success(`Development OTP: ${response.mockOTP}`, { duration: 15000 });
        }
        
        // Move to role selection
        setStep('role');
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = () => {
    // After role is selected, move to OTP step
    setStep('otp');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(email, otp, name, role);
      
      if (response.success && response.token && response.user) {
        if (response.isNewUser) {
          toast.success('Account created successfully! Welcome aboard! 🎉');
        } else {
          toast.success('Welcome back! 👋');
        }
        
        // Store token and user
        const user = {
          ...response.user,
          role: response.user.role as 'student' | 'faculty',
        };
        login(response.token, user);
        
        // Redirect based on user type
        if (response.user.isDriver) {
          router.push('/driver/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('role');
    } else if (step === 'role') {
      setStep('email');
    }
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Campus Rideshare</h1>
          <p className="text-gray-400">LNMIIT Smart Mobility Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Step 1: Email & Name */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome</h2>
                <p className="text-gray-400">Enter your details to continue</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@lnmiit.ac.in"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Role Selection */}
          {step === 'role' && (
            <div className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back</span>
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Select Your Role</h2>
                  <p className="text-gray-400">Are you a student or faculty member?</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setRole('student');
                    handleRoleSelection();
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Student</div>
                      <div className="text-sm text-gray-400">I&apos;m a student at LNMIIT</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setRole('faculty');
                    handleRoleSelection();
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Faculty</div>
                      <div className="text-sm text-gray-400">I&apos;m a faculty member at LNMIIT</div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back</span>
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Enter OTP</h2>
                  <p className="text-gray-400 mb-2">
                    OTP sent to <span className="text-white font-semibold">{email}</span>
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    Signing in as: <span className="text-blue-400 font-semibold">{role === 'student' ? '🎓 Student' : '👨‍🏫 Faculty'}</span>
                  </p>
                  <p className="text-sm text-blue-400">
                    📧 Check your email inbox (and spam folder)
                  </p>
                </div>

                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                  6-Digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-500 text-center text-2xl tracking-widest transition-all"
                  required
                  disabled={loading}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  OTP expires in 10 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Secure campus mobility for LNMIIT community
        </p>
      </div>
    </div>
  );
}
