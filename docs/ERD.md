# Entity Relationship Diagram

## Database Schema Overview

This document describes the database schema for the RideShare application using PostgreSQL 18 with Prisma ORM.

## Core Entities

### 1. User (Riders)
Stores information about riders who book rides.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `email` (String, Unique): User email address
- `name` (String, Optional): User's full name
- `phone` (String, Optional): Contact number
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- Has many `RideMember` (rides the user is part of)
- Has many `OTPLog` (OTP verification logs)

---

### 2. Driver
Stores information about drivers who offer rides.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `email` (String, Unique): Driver email address
- `name` (String): Driver's full name
- `phone` (String): Contact number
- `vehicle` (String): Vehicle type (Sedan, SUV, etc.)
- `vehicleModel` (String, Optional): Vehicle model
- `vehicleColor` (String, Optional): Vehicle color
- `licensePlate` (String, Optional): License plate number
- `licenseId` (String, Optional): Driver's license ID
- `isActive` (Boolean, Default: true): Account active status
- `isAvailable` (Boolean, Default: true): Currently available for rides
- `currentLat` (Float, Optional): Current latitude
- `currentLng` (Float, Optional): Current longitude
- `heading` (Float, Optional): Current heading/direction
- `speed` (Float, Optional): Current speed
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- Has many `Ride` (rides offered by driver)
- Has many `OTPLog` (OTP verification logs)

**Indexes:**
- `email`
- `isActive, isAvailable` (composite)
- `currentLat, currentLng` (composite, for geospatial queries)

---

### 3. Ride
Represents a ride instance (solo or shared).

**Fields:**
- `id` (UUID, PK): Unique identifier
- `driverId` (UUID, FK, Optional): Reference to Driver
- `originLat` (Float): Origin latitude
- `originLng` (Float): Origin longitude
- `originAddress` (String, Optional): Human-readable origin
- `destLat` (Float): Destination latitude
- `destLng` (Float): Destination longitude
- `destAddress` (String, Optional): Human-readable destination
- `departTime` (DateTime): Scheduled departure time
- `estimatedArrival` (DateTime, Optional): Estimated arrival time
- `isShared` (Boolean, Default: true): Whether ride accepts sharing
- `capacity` (Int, Default: 4): Maximum seats
- `seatsTaken` (Int, Default: 1): Current seats occupied
- `baseFare` (Float): Base fare for the ride
- `distanceKm` (Float): Total distance in kilometers
- `estimatedDuration` (Int, Optional): Duration in minutes
- `status` (Enum: OPEN, IN_PROGRESS, COMPLETED, CANCELLED): Ride status
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp
- `startedAt` (DateTime, Optional): Actual start time
- `completedAt` (DateTime, Optional): Completion time
- `cancelledAt` (DateTime, Optional): Cancellation time

**Relations:**
- Belongs to `Driver`
- Has many `RideMember` (riders in this ride)

**Indexes:**
- `status, departTime` (composite)
- `driverId, status` (composite)
- `originLat, originLng` (composite, for geospatial queries)
- `destLat, destLng` (composite, for geospatial queries)

---

### 4. RideMember
Represents a rider's participation in a specific ride (join table with extra data).

**Fields:**
- `id` (UUID, PK): Unique identifier
- `rideId` (UUID, FK): Reference to Ride
- `userId` (UUID, FK): Reference to User
- `pickupLat` (Float): Pickup latitude
- `pickupLng` (Float): Pickup longitude
- `pickupAddress` (String, Optional): Pickup address
- `dropLat` (Float): Drop latitude
- `dropLng` (Float): Drop longitude
- `dropAddress` (String, Optional): Drop address
- `price` (Float): Price for this member
- `offsetKm` (Float, Optional): Extra distance added to route
- `status` (Enum: REQUESTED, CONFIRMED, PICKED_UP, DROPPED_OFF, CANCELLED): Member status
- `createdAt` (DateTime): Join request timestamp
- `updatedAt` (DateTime): Last update timestamp
- `pickedUpAt` (DateTime, Optional): Actual pickup time
- `droppedOffAt` (DateTime, Optional): Actual drop time

**Relations:**
- Belongs to `Ride`
- Belongs to `User`

**Indexes:**
- `rideId, status` (composite)
- `userId, status` (composite)

---

### 5. OTPLog
Stores OTP verification codes for passwordless authentication.

**Fields:**
- `id` (UUID, PK): Unique identifier
- `email` (String): Email address for OTP
- `otp` (String): 6-digit OTP code
- `purpose` (String, Default: "login"): Purpose of OTP
- `expiresAt` (DateTime): Expiration timestamp (5 minutes)
- `createdAt` (DateTime): Creation timestamp
- `used` (Boolean, Default: false): Whether OTP has been used
- `usedAt` (DateTime, Optional): When OTP was used
- `userId` (UUID, FK, Optional): Reference to User (if applicable)
- `driverId` (UUID, FK, Optional): Reference to Driver (if applicable)

**Relations:**
- Belongs to `User` (optional)
- Belongs to `Driver` (optional)

**Indexes:**
- `email, otp, expiresAt` (composite, for lookup)
- `createdAt` (for cleanup)

---

## Enums

### RideStatus
- `OPEN` - Accepting riders
- `IN_PROGRESS` - Currently driving
- `COMPLETED` - Finished successfully
- `CANCELLED` - Cancelled by driver or system

### MemberStatus
- `REQUESTED` - Waiting for confirmation
- `CONFIRMED` - Confirmed and paid
- `PICKED_UP` - Currently in vehicle
- `DROPPED_OFF` - Completed their journey
- `CANCELLED` - Cancelled their request

---

## Visual Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │         │     Ride     │         │   Driver    │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)      │         │ id (PK)     │
│ email       │         │ driverId (FK)│◄────────│ email       │
│ name        │         │ originLat    │         │ name        │
│ phone       │         │ originLng    │         │ vehicle     │
│ createdAt   │         │ destLat      │         │ currentLat  │
│ updatedAt   │         │ destLng      │         │ currentLng  │
└──────┬──────┘         │ departTime   │         │ isAvailable │
       │                │ capacity     │         └─────────────┘
       │                │ seatsTaken   │
       │                │ status       │
       │                └──────┬───────┘
       │                       │
       │                       │
       │                       │
       │                ┌──────▼───────┐
       └────────────────► RideMember   │
                        ├──────────────┤
                        │ id (PK)      │
                        │ rideId (FK)  │
                        │ userId (FK)  │
                        │ pickupLat    │
                        │ pickupLng    │
                        │ dropLat      │
                        │ dropLng      │
                        │ price        │
                        │ status       │
                        └──────────────┘

┌─────────────┐
│   OTPLog    │
├─────────────┤
│ id (PK)     │
│ email       │
│ otp         │
│ expiresAt   │
│ used        │
│ userId (FK) │────► User
│ driverId(FK)│────► Driver
└─────────────┘
```

---

## Key Design Decisions

1. **UUID Primary Keys**: Using UUIDs instead of auto-increment integers for better distribution and security.

2. **Geospatial Data**: Storing lat/lng as Float fields with indexes. For production with heavy load, consider enabling PostGIS extension for advanced spatial queries.

3. **Soft Deletion**: Rides are marked as `CANCELLED` rather than deleted, preserving history.

4. **Denormalization**: Storing both lat/lng and addresses for faster queries (geocoding can be slow).

5. **OTP Security**: OTPs expire after 5 minutes and are marked as used to prevent reuse.

6. **Real-time Location**: Driver's `currentLat`, `currentLng`, `heading`, and `speed` are updated frequently via WebSocket for live tracking.

7. **Pricing Flexibility**: Each `RideMember` has their own `price` field, allowing dynamic pricing based on route offset.

---

## Sample Queries

### Find available rides near a location
```sql
SELECT * FROM rides
WHERE status = 'OPEN'
  AND isShared = true
  AND seatsTaken < capacity
  AND originLat BETWEEN :minLat AND :maxLat
  AND originLng BETWEEN :minLng AND :maxLng
  AND departTime BETWEEN :startTime AND :endTime;
```

### Get active drivers in an area
```sql
SELECT * FROM drivers
WHERE isActive = true
  AND isAvailable = true
  AND currentLat BETWEEN :minLat AND :maxLat
  AND currentLng BETWEEN :minLng AND :maxLng;
```

### Find user's upcoming rides
```sql
SELECT rm.*, r.*, d.*
FROM ride_members rm
JOIN rides r ON rm.rideId = r.id
JOIN drivers d ON r.driverId = d.id
WHERE rm.userId = :userId
  AND rm.status IN ('CONFIRMED', 'PICKED_UP')
  AND r.status IN ('OPEN', 'IN_PROGRESS')
ORDER BY r.departTime ASC;
```
