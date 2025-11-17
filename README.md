# 🚖 Campus Rideshare - Full Stack Web Application

A comprehensive ride-sharing platform built specifically for LNMIIT campus users (students & faculty) with advanced features including multi-passenger route-aware shared rides, driver decision control, fare splitting, and real-time tracking.

## 📌 Project Overview

This is a full-stack ride-sharing web application that enables campus users to:
- Book rides within the campus
- Share rides with multiple passengers
- Track drivers in real-time
- Calculate fares dynamically based on distance and sharing
- Manage driver availability and accept/reject ride requests

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js with OpenStreetMap
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Language**: TypeScript

## 📦 Project Structure

```
BTP/
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── entities/       # TypeORM entities (User, Driver, Ride, etc.)
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── utils/          # Helper functions (distance, fare)
│   │   └── index.ts        # Server entry point
│   └── package.json
│
└── frontend/         # Next.js application
    ├── app/              # App router pages
    ├── components/       # React components
    ├── contexts/         # React contexts (Auth)
    ├── lib/
    │   ├── api/          # API client functions
    │   ├── socket/       # Socket.IO client
    │   └── utils/        # Helper utilities
    ├── types/            # TypeScript types
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Database Setup

```bash
# Install PostgreSQL if not installed
# On macOS:
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Create database
psql postgres
CREATE DATABASE campus_rideshare;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your database credentials
# Edit the following:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=your_password
# DB_DATABASE=campus_rideshare

# Run database migrations (TypeORM will auto-sync in dev mode)
npm run dev
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:5000" >> .env.local

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📱 Features

### User Authentication
- ✅ Phone number-based login
- ✅ Mock OTP verification (demo: 123456)
- ✅ JWT token authentication
- ✅ Role-based access (Student/Faculty)

### Passenger Features
- ✅ Book rides with pickup/dropoff locations
- ✅ Real-time driver tracking
- ✅ Shared ride matching algorithm
- ✅ Dynamic fare calculation
- ✅ Ride history
- ✅ Real-time notifications

### Driver Features
- ✅ Register as driver with vehicle details
- ✅ Toggle availability on/off
- ✅ Accept/reject ride requests
- ✅ View passenger requests with route details
- ✅ Add passengers to existing rides
- ✅ Mark passengers as picked up
- ✅ Complete rides and mark payment
- ✅ Real-time location broadcasting

### Advanced Features
- ✅ **Route-aware shared rides**: Match passengers with overlapping routes
- ✅ **Detour calculation**: Minimal detour for shared rides (<15%)
- ✅ **Dynamic fare splitting**: Proportional fare based on distance
- ✅ **Real-time updates**: Socket.IO for live location and notifications
- ✅ **Distance calculation**: Haversine formula for accurate distances
- ✅ **Campus-focused**: Optimized for LNMIIT campus

## 🧮 Fare Calculation

The fare system uses a simple and transparent model:

```
Base Fare = ₹20 (convenience fee)
Per Km Rate = ₹10/km
Minimum Fare = ₹30

For Shared Rides:
- Each passenger pays base fare (₹20)
- Distance charge is split proportionally
- Example: If passenger travels 3km out of 5km total route
  Fare = ₹20 + (5km × ₹10 × 3/5) = ₹20 + ₹30 = ₹50
```

## 🗺️ Maps & Location

- **Map Library**: Leaflet.js with OpenStreetMap tiles (no API keys required)
- **Geocoding**: Nominatim API (rate-limited, use sparingly)
- **Distance**: Haversine formula for accurate campus distances
- **Default Location**: LNMIIT Campus (26.9389°N, 75.9239°E)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/auth/profile` - Get current user profile

### Driver
- `POST /api/drivers/register` - Register as driver
- `PUT /api/drivers/availability` - Update availability
- `PUT /api/drivers/location` - Update location
- `GET /api/drivers/available` - Get available drivers

### Rides
- `POST /api/rides/request` - Create ride request
- `POST /api/rides/accept` - Accept ride request (driver)
- `POST /api/rides/reject` - Reject ride request (driver)
- `POST /api/rides/pickup` - Mark passenger picked up
- `POST /api/rides/complete` - Complete ride for passenger
- `POST /api/rides/payment` - Mark payment complete
- `GET /api/rides/my-rides` - Get passenger's rides
- `GET /api/rides/active` - Get driver's active rides

## 🔄 Real-time Events

### Socket.IO Events

**Client → Server**
- `user:join` - Join user room
- `driver:join` - Join driver tracking room
- `ride:join` - Join ride room
- `driver:location:update` - Update driver location
- `chat:message` - Send chat message

**Server → Client**
- `ride:accepted` - Ride accepted notification
- `ride:rejected` - Ride rejected notification
- `ride:new-request` - New ride request (for drivers)
- `ride:new-passenger-request` - New passenger joining
- `ride:fare-updated` - Fare updated due to new passenger
- `driver:location:updated` - Driver location update
- `chat:message:received` - Chat message received

## 🎨 UI Components

- `LoginForm` - Phone number + OTP authentication
- `Map` - Leaflet map with markers
- `DashboardPage` - Main dashboard with map and actions
- `AuthContext` - Global authentication state

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Environment variables for sensitive data
- Input validation

## 🚧 Roadmap

- [ ] Ride request page with location picker
- [ ] Driver dashboard with active rides
- [ ] Real-time chat between driver and passenger
- [ ] Rating system for drivers
- [ ] Push notifications
- [ ] Payment gateway integration (UPI)
- [ ] Ride analytics and insights
- [ ] Admin panel

## 🤝 Contributing

This is an academic project for LNMIIT BTP. Contributions are welcome!

## 📄 License

This project is for educational purposes.

## 👥 Authors

- Rajat Sharma - LNMIIT

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Note**: This is a demo application. The OTP is hardcoded as `123456` for testing purposes. In production, integrate with a real SMS gateway.
