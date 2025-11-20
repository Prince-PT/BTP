# API Documentation

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All endpoints except `/auth/*` require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Request OTP

Request an OTP code for passwordless login.

**Endpoint:** `POST /auth/request-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "user"  // or "driver"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to your email",
  "expiresAt": "2025-11-19T10:35:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid email format
- `404 Not Found` - Driver not registered (if role is "driver")

---

### Verify OTP

Verify OTP and receive JWT token.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "role": "user"  // or "driver"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired OTP

---

### Logout

Logout (client should discard token).

**Endpoint:** `POST /auth/logout`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## Ride Endpoints (Riders)

### Search Available Rides

Find shared rides matching your route.

**Endpoint:** `GET /rides/available`

**Query Parameters:**
- `pickupLat` (required): Pickup latitude
- `pickupLng` (required): Pickup longitude
- `dropLat` (required): Drop latitude
- `dropLng` (required): Drop longitude
- `departTime` (optional): ISO 8601 datetime

**Example:**
```
GET /rides/available?pickupLat=40.7128&pickupLng=-74.0060&dropLat=40.7589&dropLng=-73.9851
```

**Response:** `200 OK`
```json
{
  "matches": [
    {
      "ride": {
        "id": "ride-uuid",
        "driver": {
          "id": "driver-uuid",
          "name": "John Doe",
          "vehicle": "Sedan",
          "vehicleModel": "Toyota Camry",
          "vehicleColor": "Silver"
        },
        "originLat": 40.7128,
        "originLng": -74.0060,
        "destLat": 40.7589,
        "destLng": -73.9851,
        "departTime": "2025-11-19T15:00:00.000Z",
        "capacity": 4,
        "seatsTaken": 2,
        "status": "OPEN"
      },
      "offsetAdded": 1.2,
      "newRouteDistance": 6.4,
      "pricePerPerson": 8.50,
      "score": 2.5,
      "seatsAvailable": 2
    }
  ],
  "count": 1
}
```

---

### Create Ride (Driver Only)

Create a new ride offering.

**Endpoint:** `POST /rides`

**Auth:** Required (driver role)

**Request Body:**
```json
{
  "originLat": 40.7128,
  "originLng": -74.0060,
  "originAddress": "Lower Manhattan, NY",
  "destLat": 40.7589,
  "destLng": -73.9851,
  "destAddress": "Times Square, NY",
  "departTime": "2025-11-19T15:00:00.000Z",
  "isShared": true,
  "capacity": 4
}
```

**Response:** `201 Created`
```json
{
  "id": "ride-uuid",
  "driverId": "driver-uuid",
  "originLat": 40.7128,
  "originLng": -74.0060,
  "destLat": 40.7589,
  "destLng": -73.9851,
  "departTime": "2025-11-19T15:00:00.000Z",
  "isShared": true,
  "capacity": 4,
  "seatsTaken": 0,
  "baseFare": 15.0,
  "distanceKm": 5.2,
  "status": "OPEN",
  "createdAt": "2025-11-19T10:30:00.000Z"
}
```

---

### Get Ride Details

Get detailed information about a specific ride.

**Endpoint:** `GET /rides/:id`

**Auth:** Required

**Response:** `200 OK`
```json
{
  "id": "ride-uuid",
  "driver": {
    "id": "driver-uuid",
    "name": "John Doe",
    "vehicle": "Sedan",
    "currentLat": 40.7128,
    "currentLng": -74.0060
  },
  "originLat": 40.7128,
  "originLng": -74.0060,
  "destLat": 40.7589,
  "destLng": -73.9851,
  "departTime": "2025-11-19T15:00:00.000Z",
  "capacity": 4,
  "seatsTaken": 2,
  "baseFare": 15.0,
  "status": "OPEN",
  "members": [
    {
      "id": "member-uuid",
      "user": {
        "id": "user-uuid",
        "name": "Alice",
        "email": "alice@example.com"
      },
      "pickupLat": 40.7128,
      "pickupLng": -74.0060,
      "dropLat": 40.7589,
      "dropLng": -73.9851,
      "price": 12.5,
      "status": "CONFIRMED"
    }
  ]
}
```

---

### Join Ride

Request to join a shared ride.

**Endpoint:** `POST /rides/:id/join`

**Auth:** Required (user role)

**Request Body:**
```json
{
  "pickupLat": 40.7200,
  "pickupLng": -74.0100,
  "pickupAddress": "Battery Park, NY",
  "dropLat": 40.7550,
  "dropLng": -73.9900,
  "dropAddress": "Midtown, NY"
}
```

**Response:** `200 OK`
```json
{
  "member": {
    "id": "member-uuid",
    "rideId": "ride-uuid",
    "userId": "user-uuid",
    "pickupLat": 40.7200,
    "pickupLng": -74.0100,
    "dropLat": 40.7550,
    "dropLng": -73.9900,
    "price": 10.50,
    "status": "REQUESTED",
    "createdAt": "2025-11-19T10:35:00.000Z"
  },
  "price": 10.50
}
```

**Errors:**
- `404 Not Found` - Ride not found
- `400 Bad Request` - Ride is full or not accepting members

---

### Confirm Payment

Confirm payment for a ride booking.

**Endpoint:** `POST /rides/:id/confirm-payment`

**Auth:** Required (user role)

**Request Body:**
```json
{
  "paymentToken": "mock-payment-token-123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Payment confirmed"
}
```

---

### Get User Rides

Get all rides for a specific user.

**Endpoint:** `GET /rides/user/:userId`

**Auth:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "member-uuid",
    "rideId": "ride-uuid",
    "userId": "user-uuid",
    "pickupLat": 40.7128,
    "pickupLng": -74.0060,
    "dropLat": 40.7589,
    "dropLng": -73.9851,
    "price": 12.5,
    "status": "CONFIRMED",
    "ride": {
      "id": "ride-uuid",
      "driver": {
        "name": "John Doe",
        "vehicle": "Sedan"
      },
      "departTime": "2025-11-19T15:00:00.000Z",
      "status": "OPEN"
    }
  }
]
```

---

### Update Ride Status (Driver Only)

Update the status of a ride.

**Endpoint:** `PATCH /rides/:id/status`

**Auth:** Required (driver role)

**Request Body:**
```json
{
  "status": "IN_PROGRESS"  // OPEN, IN_PROGRESS, COMPLETED, CANCELLED
}
```

**Response:** `200 OK`
```json
{
  "id": "ride-uuid",
  "status": "IN_PROGRESS",
  "startedAt": "2025-11-19T15:00:00.000Z"
}
```

---

## Driver Endpoints

### Register as Driver

Register a new driver account.

**Endpoint:** `POST /driver/register`

**Request Body:**
```json
{
  "email": "driver@example.com",
  "name": "John Driver",
  "phone": "+1234567890",
  "vehicle": "Sedan",
  "vehicleModel": "Toyota Camry",
  "vehicleColor": "Silver",
  "licensePlate": "ABC-1234",
  "licenseId": "DL12345"
}
```

**Response:** `201 Created`
```json
{
  "message": "Driver registered successfully",
  "driver": {
    "id": "driver-uuid",
    "email": "driver@example.com",
    "name": "John Driver",
    "vehicle": "Sedan",
    "isActive": true,
    "isAvailable": true
  }
}
```

---

### Get Driver Profile

Get the authenticated driver's profile.

**Endpoint:** `GET /driver/profile`

**Auth:** Required (driver role)

**Response:** `200 OK`
```json
{
  "id": "driver-uuid",
  "email": "driver@example.com",
  "name": "John Driver",
  "phone": "+1234567890",
  "vehicle": "Sedan",
  "vehicleModel": "Toyota Camry",
  "vehicleColor": "Silver",
  "licensePlate": "ABC-1234",
  "isActive": true,
  "isAvailable": true,
  "currentLat": 40.7128,
  "currentLng": -74.0060
}
```

---

### Update Driver Profile

Update driver profile information.

**Endpoint:** `PATCH /driver/profile`

**Auth:** Required (driver role)

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567891",
  "vehicleColor": "Blue"
}
```

**Response:** `200 OK`
```json
{
  "id": "driver-uuid",
  "name": "John Updated",
  "phone": "+1234567891",
  "vehicleColor": "Blue"
}
```

---

### Update Driver Location

Update current GPS location.

**Endpoint:** `POST /driver/location`

**Auth:** Required (driver role)

**Request Body:**
```json
{
  "lat": 40.7128,
  "lng": -74.0060,
  "heading": 90,
  "speed": 45
}
```

**Response:** `200 OK`
```json
{
  "message": "Location updated",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

---

### Update Availability

Toggle driver availability status.

**Endpoint:** `PATCH /driver/availability`

**Auth:** Required (driver role)

**Request Body:**
```json
{
  "isAvailable": true
}
```

**Response:** `200 OK`
```json
{
  "isAvailable": true
}
```

---

### Get Driver Rides

Get all rides for the authenticated driver.

**Endpoint:** `GET /driver/rides`

**Auth:** Required (driver role)

**Query Parameters:**
- `status` (optional): Filter by status (OPEN, IN_PROGRESS, COMPLETED, CANCELLED)

**Response:** `200 OK`
```json
[
  {
    "id": "ride-uuid",
    "originLat": 40.7128,
    "originLng": -74.0060,
    "destLat": 40.7589,
    "destLng": -73.9851,
    "departTime": "2025-11-19T15:00:00.000Z",
    "capacity": 4,
    "seatsTaken": 2,
    "baseFare": 15.0,
    "status": "OPEN",
    "members": [
      {
        "id": "member-uuid",
        "user": {
          "name": "Alice",
          "phone": "+1234567890"
        },
        "status": "CONFIRMED"
      }
    ]
  }
]
```

---

## WebSocket Events

### Connection

Connect with JWT authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Driver Events

#### Emit: `driver:location`
Update driver location (emitted by driver app).

```javascript
socket.emit('driver:location', {
  lat: 40.7128,
  lng: -74.0060,
  heading: 90,
  speed: 45
});
```

#### Listen: `driver:location:ack`
Acknowledgment of location update.

```javascript
socket.on('driver:location:ack', (data) => {
  console.log(data.success); // true/false
});
```

### Rider Events

#### Emit: `ride:subscribe`
Subscribe to ride updates.

```javascript
socket.emit('ride:subscribe', { rideId: 'ride-uuid' });
```

#### Listen: `driver:location:update`
Receive driver location updates.

```javascript
socket.on('driver:location:update', (data) => {
  console.log(data); // { driverId, lat, lng, heading, speed, timestamp }
});
```

#### Listen: `ride:status`
Receive ride status updates.

```javascript
socket.on('ride:status', (data) => {
  console.log(data); // Full ride object
});
```

#### Emit: `ride:unsubscribe`
Unsubscribe from ride updates.

```javascript
socket.emit('ride:unsubscribe', { rideId: 'ride-uuid' });
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "status": 400
}
```

**Common Status Codes:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
