import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ridesApi } from '../../services/api';
import LocationPicker from '../../components/LocationPicker';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const BookRide = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Separate state for each location to prevent conflicts
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
  
  const [departTime, setDepartTime] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [isShared, setIsShared] = useState(false);
  const [capacity, setCapacity] = useState(4);
  
  const [pickupSet, setPickupSet] = useState(false);
  const [dropSet, setDropSet] = useState(false);

  const handlePickupSelect = (lat: number, lng: number, address: string) => {
    setPickupLocation({ lat, lng, address });
    setPickupSet(true);
  };

  const handleDropSelect = (lat: number, lng: number, address: string) => {
    setDropLocation({ lat, lng, address });
    setDropSet(true);
  };

  const calculateDistance = () => {
    if (!pickupSet || !dropSet) return 0;
    
    const R = 6371;
    const dLat = ((dropLocation.lat - pickupLocation.lat) * Math.PI) / 180;
    const dLng = ((dropLocation.lng - pickupLocation.lng) * Math.PI) / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupLocation.lat * Math.PI) / 180) *
        Math.cos((dropLocation.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimatedFare = () => {
    const distance = calculateDistance();
    const baseFare = 35;    // ₹35 base fare
    const perKm = 11.5;     // ₹11.50 per km (realistic Indian rate)
    const totalFare = baseFare + distance * perKm;
    
    // ALWAYS charge for full capacity - driver gets full taxi revenue
    // seatsNeeded is only used to split cost at drop-off time
    return Math.round(totalFare * capacity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupSet || !dropSet) {
      alert('Please select both pickup and drop locations on the map');
      return;
    }
    
    if (!departTime) {
      alert('Please select a departure time');
      return;
    }

    setLoading(true);
    
    try {
      const ride = await ridesApi.createRide({
        originLat: pickupLocation.lat,
        originLng: pickupLocation.lng,
        originAddress: pickupLocation.address,
        destLat: dropLocation.lat,
        destLng: dropLocation.lng,
        destAddress: dropLocation.address,
        departTime: new Date(departTime).toISOString(),
        seatsNeeded,
        isShared,
        capacity: isShared ? capacity : 4,
      });

      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500/100 text-white px-6 py-4 rounded-lg shadow-lg z-50';
      successMsg.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-semibold">Request Created!</p>
            <p class="text-sm opacity-90">Drivers are being notified...</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
      
      setTimeout(() => {
        navigate(`/rider/rides/${ride.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Create ride error:', error);
      alert(error.response?.data?.error || 'Failed to create ride request');
    } finally {
      setLoading(false);
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return pickupSet;
      case 2:
        return dropSet;
      case 3:
        return !!departTime;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
      <header className="bg-dark-900/80 backdrop-blur-md shadow-lg sticky top-0 z-40 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                Step {currentStep} of 4
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-xl shadow-glow">
                🚗
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, label: 'Pickup', icon: '📍' },
              { num: 2, label: 'Drop-off', icon: '🎯' },
              { num: 3, label: 'Schedule', icon: '🕐' },
              { num: 4, label: 'Confirm', icon: '✓' },
            ].map((step, idx) => (
              <div key={step.num} className="flex-1 flex items-center">
                <button
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    currentStep === step.num
                      ? 'scale-110'
                      : currentStep > step.num
                      ? 'opacity-60'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      isStepComplete(step.num)
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-glow'
                        : currentStep === step.num
                        ? 'bg-gradient-to-br from-primary-500 to-accent-purple text-white shadow-glow ring-4 ring-primary-500/30'
                        : 'bg-dark-700 text-gray-500 border border-white/10'
                    }`}
                  >
                    {isStepComplete(step.num) ? '✓' : step.icon}
                  </div>
                  <span className="text-xs font-medium hidden sm:block text-gray-400">{step.label}</span>
                </button>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded transition-all ${
                      isStepComplete(step.num) ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-dark-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div
                className={`transition-all duration-300 ${
                  currentStep === 1 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}
              >
                {currentStep === 1 && (
                  <div className="card">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        📍 Where should we pick you up?
                      </h2>
                      <p className="text-gray-400">Click on the map or search for your location</p>
                    </div>
                    <LocationPicker
                      label=""
                      markerColor="green"
                      onLocationSelect={handlePickupSelect}
                      autoNotify={false}
                    />
                    {pickupSet && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg px-8 py-3 shadow-glow transform hover:scale-105 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            Continue to Drop-off
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className={`transition-all duration-300 ${
                  currentStep === 2 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}
              >
                {currentStep === 2 && (
                  <div className="card">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        🎯 Where are you going?
                      </h2>
                      <p className="text-gray-400">Select your destination on the map</p>
                    </div>
                    <LocationPicker
                      label=""
                      markerColor="red"
                      onLocationSelect={handleDropSelect}
                      autoNotify={false}
                      initialLat={pickupSet ? pickupLocation.lat : undefined}
                      initialLng={pickupSet ? pickupLocation.lng : undefined}
                    />
                    {dropSet && (
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg px-8 py-3 shadow-glow transform hover:scale-105 transition-all"
                        >
                          <span className="flex items-center gap-2">
                            Continue to Schedule
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className={`transition-all duration-300 ${
                  currentStep === 3 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}
              >
                {currentStep === 3 && (
                  <div className="card animate-fadeIn">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                      <span className="text-3xl animate-pulse-soft">🕐</span>
                      <span>When do you need a ride?</span>
                    </h2>
                    <p className="text-gray-400 mb-6">Choose your departure date and time</p>

                    <div className="space-y-6">
                      {/* Date and Time Selection - Enhanced UI */}
                      <div className="bg-gradient-to-br from-dark-700 to-dark-800 p-6 rounded-2xl border border-primary-500/30">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Date Selector */}
                          <div>
                            <label className="block text-sm font-bold mb-3 text-gray-300 flex items-center gap-2">
                              <span className="text-xl">📅</span>
                              <span>Select Date</span>
                            </label>
                            <input
                              type="date"
                              className="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-dark-700 text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/30 transition-all text-lg font-medium"
                              value={departTime.split('T')[0] || ''}
                              onChange={(e) => {
                                const date = e.target.value;
                                const time = departTime.split('T')[1] || '12:00';
                                setDepartTime(`${date}T${time}`);
                              }}
                              required
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>

                          {/* Time Selector */}
                          <div>
                            <label className="block text-sm font-bold mb-3 text-gray-300 flex items-center gap-2">
                              <span className="text-xl">⏰</span>
                              <span>Select Time</span>
                            </label>
                            <input
                              type="time"
                              className="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-dark-700 text-white focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/30 transition-all text-lg font-medium"
                              value={departTime.split('T')[1] || ''}
                              onChange={(e) => {
                                const time = e.target.value;
                                const date = departTime.split('T')[0] || new Date().toISOString().split('T')[0];
                                setDepartTime(`${date}T${time}`);
                              }}
                              required
                            />
                          </div>
                        </div>

                        {/* Quick Time Presets */}
                        {departTime.split('T')[0] === new Date().toISOString().split('T')[0] && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-400 mb-2">⚡ Quick Select (Today)</p>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: 'Now', offset: 0 },
                                { label: '+30m', offset: 30 },
                                { label: '+1h', offset: 60 },
                                { label: '+2h', offset: 120 },
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    now.setMinutes(now.getMinutes() + preset.offset);
                                    const dateStr = now.toISOString().split('T')[0];
                                    const timeStr = now.toTimeString().slice(0, 5);
                                    setDepartTime(`${dateStr}T${timeStr}`);
                                  }}
                                  className="px-3 py-2 bg-dark-700 border-2 border-primary-500/40 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-sm font-semibold"
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Selected Time Display */}
                        {departTime && (
                          <div className="mt-4 p-4 bg-dark-700 rounded-xl border-2 border-green-500/30 animate-bounceIn">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl animate-pulse">✅</div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-green-400 uppercase">Departure Time Set</p>
                                <p className="text-lg font-bold text-white">
                                  {new Date(departTime).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                  })}{' '}
                                  at{' '}
                                  {new Date(departTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Passengers Section - Enhanced */}
                      <div className="bg-gradient-to-br from-dark-800 to-dark-700 border border-accent-purple/30 p-6 rounded-2xl">
                        <label className="block text-sm font-bold mb-4 text-white flex items-center gap-2">
                          <span className="text-xl">👥</span>
                          <span>Number of Passengers</span>
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { num: 1, emoji: '👤', label: 'Solo' },
                            { num: 2, emoji: '👥', label: 'Duo' },
                            { num: 3, emoji: '👨‍👩‍👦', label: 'Trio' },
                            { num: 4, emoji: '👨‍👩‍👧‍👦', label: 'Group' },
                          ].map((option) => (
                            <button
                              key={option.num}
                              type="button"
                              onClick={() => setSeatsNeeded(option.num)}
                              className={`p-4 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                                seatsNeeded === option.num
                                  ? 'border-purple-500 bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-glow scale-105'
                                  : 'border-white/20 bg-dark-900/50 hover:border-purple-400 shadow-md text-gray-300'
                              }`}
                            >
                              <div className="text-3xl mb-2">{option.emoji}</div>
                              <div className="text-xl font-bold mb-1">{option.num}</div>
                              <div className={`text-xs font-semibold ${
                                seatsNeeded === option.num ? 'text-white' : 'text-gray-400'
                              }`}>
                                {option.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Shared Ride Toggle */}
                      <div className="bg-gradient-to-br from-dark-800 to-dark-700 border border-indigo-500/30 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xl">🤝</span>
                            <div>
                              <span className="block text-sm font-bold text-white">Allow Ride Sharing</span>
                              <span className="block text-xs text-gray-400">Let others join to reduce costs</span>
                            </div>
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsShared(!isShared)}
                            className={`relative w-14 h-8 rounded-full transition-colors shadow-inner ${
                              isShared ? 'bg-green-500' : 'bg-dark-900 border border-white/20'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                                isShared ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        {isShared && (
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-gray-200">
                                <span className="font-semibold text-green-400">Shared Ride Benefits:</span> You pay full capacity upfront. Your fare will <span className="font-semibold">decrease automatically</span> as other riders join and share costs!
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span>Fare decreases as riders share the route</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Eco-friendly and cost-effective</span>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-2">
                                Vehicle Capacity (Total Seats)
                              </label>
                              <select
                                value={capacity}
                                onChange={(e) => setCapacity(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-dark-700 border-2 border-indigo-500/30 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all hover:border-indigo-400 font-medium"
                                style={{ 
                                  colorScheme: 'dark',
                                  backgroundColor: 'rgb(31, 41, 55)',
                                  color: 'white'
                                }}
                              >
                                <option value={2} style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}>2 seats</option>
                                <option value={3} style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}>3 seats</option>
                                <option value={4} style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}>4 seats (Default)</option>
                                <option value={5} style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}>5 seats</option>
                                <option value={6} style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}>6 seats</option>
                                <option value={7} style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}>7 seats</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Notice */}
                      <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">💳</span>
                          <div className="text-sm text-gray-200">
                            <p className="font-semibold mb-1 text-blue-400">Payment Model</p>
                            <p className="text-gray-300">
                              You pay for the <span className="font-bold text-white">full taxi capacity ({capacity} seats)</span> upfront to ensure driver gets fair revenue. 
                              {isShared ? ' Your fare will be reduced as other riders join and share costs.' : ' This is a private ride - no one else can join.'}
                            </p>
                            {seatsNeeded > 1 && (
                              <p className="text-gray-400 mt-2 text-xs">
                                📊 Booking for {seatsNeeded} passengers: Cost will be split equally (₹{pickupSet && dropSet ? Math.round((35 + calculateDistance() * 11.5) * capacity / seatsNeeded) : 'X'} per person)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">ℹ️</span>
                          <div className="text-sm text-gray-200">
                            <p className="font-semibold mb-1 text-amber-400">Driver Notification</p>
                            <p className="text-gray-300">
                              Available drivers will be notified 15 minutes before your scheduled departure time
                            </p>
                          </div>
                        </div>
                      </div>

                      {departTime && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setCurrentStep(4)}
                            className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-glow text-lg px-8 py-3 transform hover:scale-105 transition-all"
                          >
                            <span className="flex items-center gap-2">
                              Review Trip
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`transition-all duration-300 ${
                  currentStep === 4 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                }`}
              >
                {currentStep === 4 && (
                  <div className="card">
                    <h2 className="text-2xl font-bold text-white mb-6">
                      ✓ Review Your Trip
                    </h2>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 p-6 rounded-xl">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 bg-green-400 rounded-full shadow-glow"></div>
                            <div className="w-0.5 h-12 bg-gradient-to-b from-green-400 to-red-400"></div>
                            <div className="w-4 h-4 bg-red-400 rounded-full shadow-glow"></div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">PICKUP</p>
                              <p className="font-medium text-gray-100">{pickupLocation.address}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">DROP-OFF</p>
                              <p className="font-medium text-gray-100">{dropLocation.address}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 p-4 rounded-xl">
                          <p className="text-xs font-semibold text-blue-400 mb-1">DEPARTURE</p>
                          <p className="font-semibold text-gray-100">
                            {new Date(departTime).toLocaleDateString()} at{' '}
                            {new Date(departTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-dark-800 to-dark-700 border border-white/20 p-4 rounded-xl">
                          <p className="text-xs font-semibold text-purple-400 mb-1">PASSENGERS</p>
                          <p className="font-semibold text-gray-100">{seatsNeeded} person{seatsNeeded > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-glow w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating Request...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            🚗 Request Ride
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                <div className="card bg-gradient-to-br from-primary-600 to-purple-600 text-white border-none shadow-glow">
                  <h3 className="text-lg font-bold mb-4">Trip Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                      <span className="text-sm opacity-90">Distance</span>
                      <span className="font-bold text-white">
                        {pickupSet && dropSet ? `${calculateDistance().toFixed(1)} km` : '-'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                      <span className="text-sm opacity-90">Estimated Fare</span>
                      <span className="text-2xl font-bold text-white">
                        {pickupSet && dropSet ? `₹${estimatedFare()}` : '-'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                      <span className="text-sm opacity-90">Passengers</span>
                      <span className="font-bold text-white">{seatsNeeded} {seatsNeeded > 1 ? 'persons' : 'person'}</span>
                    </div>
                  </div>
                </div>

                <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-yellow-500/30">
                  <h3 className="font-semibold text-yellow-400 mb-3">✨ How it works</h3>
                  <ol className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-yellow-400">1.</span>
                      <span>Complete the booking form with your trip details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-yellow-400">2.</span>
                      <span>Nearby drivers are notified instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-yellow-400">3.</span>
                      <span>Get matched with an available driver</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-yellow-400">4.</span>
                      <span>Track your driver in real-time</span>
                    </li>
                  </ol>
                </div>

                <div className="card bg-gradient-to-br from-dark-800 to-dark-700 border border-green-500/30">
                  <h3 className="font-semibold text-green-400 mb-3">🛡️ Safety First</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Verified drivers only</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Real-time GPS tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>24/7 customer support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookRide;
