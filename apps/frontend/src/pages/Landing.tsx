import { Link } from 'react-router-dom';
import { useState } from 'react';

const Landing = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: '🎯',
      title: 'Smart Matching',
      description: 'Our intelligent algorithm matches you with riders going the same direction for optimal cost sharing.',
    },
    {
      icon: '💰',
      title: 'Dynamic Pricing',
      description: 'Pay only for what you need. Fare automatically adjusts as more passengers join your shared ride.',
    },
    {
      icon: '🌍',
      title: 'Eco-Friendly',
      description: 'Reduce carbon emissions by up to 75% compared to solo rides. Travel green, save the planet.',
    },
    {
      icon: '📍',
      title: 'Real-time Tracking',
      description: 'Track your driver\'s location live on the map. Know exactly when they\'ll arrive.',
    },
    {
      icon: '🔒',
      title: 'Secure & Safe',
      description: 'Verified drivers, secure payments, and 24/7 support for your peace of mind.',
    },
    {
      icon: '⚡',
      title: 'Instant Booking',
      description: 'Book rides in seconds with our streamlined interface. No hassle, no waiting.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Choose Your Route',
      description: 'Select your pickup and drop-off locations on the interactive map.',
    },
    {
      number: '02',
      title: 'Pick Ride Type',
      description: 'Choose between shared rides (split costs) or private rides (full privacy).',
    },
    {
      number: '03',
      title: 'Get Matched',
      description: 'Our system instantly finds the best driver and co-passengers for you.',
    },
    {
      number: '04',
      title: 'Track & Ride',
      description: 'Track your driver in real-time and enjoy your journey!',
    },
  ];

  const faqs = [
    {
      question: 'How does shared ride pricing work?',
      answer: 'With shared rides, you book seats (e.g., 2 seats for 2 people) and pay for those seats upfront. As other passengers join the same ride, your fare is automatically reduced proportionally. The more people share, the less everyone pays!',
    },
    {
      question: 'What\'s the difference between shared and private rides?',
      answer: 'Shared rides allow multiple passengers to join your trip, splitting the cost and reducing fares. Private rides are exclusive to you - you book the entire vehicle with no other passengers allowed.',
    },
    {
      question: 'How do I become a driver?',
      answer: 'Click on "Become a Driver", register with your details, upload required documents, and create your first ride offer. Once verified, passengers can book your rides!',
    },
    {
      question: 'Is it safe to share rides?',
      answer: 'Absolutely! All drivers are verified, and you can see driver ratings and reviews. Plus, we have real-time GPS tracking and 24/7 customer support.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-2xl shadow-glow">
                🚗
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                CampusCommute
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="hidden sm:block text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/login" 
                className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-6 py-2.5 shadow-glow"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center animate-fade-in">
            <div className="inline-block mb-4 px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-full text-primary-300 text-sm font-medium">
              🎉 The Future of Ride Sharing
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Campus Rides,
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-accent-purple to-accent-pink bg-clip-text text-transparent">
                Shared Costs
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with fellow students, split costs, and make your daily commute effortless.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                to="/login" 
                className="btn bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-lg px-8 py-4 shadow-glow-lg transform hover:scale-105 transition-all"
              >
                🧑 Start Riding Now
              </Link>
              <Link 
                to="/driver/register" 
                className="btn border-2 border-primary-500/50 hover:border-primary-500 bg-primary-500/10 hover:bg-primary-500/20 text-white text-lg px-8 py-4 backdrop-blur-sm transition-all"
              >
                🚗 Become a Driver
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { value: '10K+', label: 'Happy Riders' },
                { value: '2K+', label: 'Verified Drivers' },
                { value: '50K+', label: 'Rides Completed' },
                { value: '60%', label: 'Avg. Savings' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-dark-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary-400">CampusCommute</span>?
            </h2>
            <p className="text-gray-400 text-lg">
              Experience the next generation of campus transportation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-8 bg-gradient-to-br from-dark-800 to-dark-900 border border-white/10 rounded-2xl hover:border-primary-500/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It <span className="text-primary-400">Works</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Get started in just 4 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-purple rounded-2xl flex items-center justify-center text-3xl font-bold shadow-glow">
                    {step.number}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-32 h-0.5 bg-gradient-to-r from-primary-500 to-transparent"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-dark-900/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-primary-400">Questions</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to know about CampusCommute
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-dark-800 border border-white/10 rounded-xl overflow-hidden hover:border-primary-500/30 transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <span className={`text-2xl transition-transform ${activeFaq === idx ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-5 text-gray-400 animate-slide-up">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-primary-600 to-accent-purple rounded-3xl p-12 text-center shadow-glow-lg">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of satisfied riders and drivers today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 transform hover:scale-105 transition-all"
              >
                Get Started Free
              </Link>
              <Link 
                to="/driver/register" 
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4 transition-all"
              >
                Become a Driver
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-2xl">
                  🚗
                </div>
                <span className="text-xl font-bold">CampusCommute</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transforming the way people travel together.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">For Riders</Link></li>
                <li><Link to="/driver/register" className="hover:text-white transition-colors">For Drivers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Shared Rides</li>
                <li>Private Rides</li>
                <li>Real-time Tracking</li>
                <li>Secure Payments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Help Center</li>
                <li>Safety Guidelines</li>
                <li>Contact Us</li>
                <li>24/7 Support</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
            <p>© 2025 CampusCommute. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
