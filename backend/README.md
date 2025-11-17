# Campus Rideshare - Backend

Express.js + TypeORM + PostgreSQL + Socket.IO backend for the campus ride-sharing platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database:**
   ```bash
   # Create database
   createdb campus_rideshare
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE campus_rideshare;
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and update values:
   ```bash
   cp .env.example .env
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/profile` - Get user profile (protected)

### Driver
- `POST /api/drivers/register` - Register as driver
- `PUT /api/drivers/availability` - Update availability
- `PUT /api/drivers/location` - Update location
- `GET /api/drivers/available` - Get available drivers

### Rides
- `POST /api/rides/request` - Create ride request (passenger)
- `GET /api/rides/my-rides` - Get passenger's rides
- `POST /api/rides/accept` - Accept ride request (driver)
- `POST /api/rides/reject` - Reject ride request (driver)
- `POST /api/rides/pickup` - Mark passenger picked up
- `POST /api/rides/complete` - Complete ride for passenger
- `POST /api/rides/payment` - Mark payment complete
- `GET /api/rides/active` - Get driver's active rides

## Socket.IO Events

### Client → Server
- `user:join` - Join user room
- `driver:join` - Join driver tracking room
- `ride:join` - Join ride room
- `driver:location:update` - Update driver location
- `chat:message` - Send chat message

### Server → Client
- `driver:location:updated` - Driver location updated
- `ride:accepted` - Ride accepted by driver
- `ride:new-request` - New ride request available
- `ride:new-passenger-request` - New passenger wants to join
- `ride:fare-updated` - Fare updated due to sharing
- `chat:message:received` - Chat message received

## Database Schema

- **users** - User accounts (students/faculty)
- **drivers** - Driver profiles and vehicle info
- **rides** - Active/completed rides
- **ride_requests** - Passenger booking requests
- **notifications** - User notifications

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features

- ✅ JWT-based authentication with mock OTP
- ✅ Distance-based ride matching
- ✅ Proportional fare splitting
- ✅ Real-time driver tracking
- ✅ WebSocket notifications
- ✅ Multi-passenger shared rides
