import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import RiderDashboard from './pages/rider/Dashboard';
import BookRide from './pages/rider/BookRide';
import RideDetails from './pages/rider/RideDetails';
import SharedRides from './pages/rider/SharedRides';
import DriverDashboard from './pages/driver/Dashboard';
import DriverProfile from './pages/driver/Profile';
import DriverRegister from './pages/driver/Register';
import DriverRideDetails from './pages/driver/RideDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Rider Routes */}
            <Route
              path="/rider/dashboard"
              element={
                <ProtectedRoute role="user">
                  <RiderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/book"
              element={
                <ProtectedRoute role="user">
                  <BookRide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/shared-rides"
              element={
                <ProtectedRoute role="user">
                  <SharedRides />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/rides/:id"
              element={
                <ProtectedRoute role="user">
                  <RideDetails />
                </ProtectedRoute>
              }
            />
            
            {/* Driver Routes */}
            <Route path="/driver/register" element={<DriverRegister />} />
            <Route
              path="/driver/dashboard"
              element={
                <ProtectedRoute role="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/profile"
              element={
                <ProtectedRoute role="driver">
                  <DriverProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver/rides/:id"
              element={
                <ProtectedRoute role="driver">
                  <DriverRideDetails />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
