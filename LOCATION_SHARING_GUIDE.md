# Real-Time Location Sharing - User Guide

## Overview
This guide explains how the simplified location sharing system works in the rideshare application.

## How It Works

### Driver Side (Automatic Location Sharing)

1. **Driver logs in** → Status is "Offline" by default
2. **Driver clicks "Go Online"** → Location sharing starts automatically
3. **Location updates every 5 seconds** while online
4. **Driver clicks "Go Offline"** → Location sharing stops

**Key Points:**
- No manual location sharing buttons - it's all automatic
- Location only shared when driver is "Online"
- Riders can only see driver location for their assigned rides
- WebSocket connection required for real-time updates

### Rider Side (Viewing Driver Location)

1. **Rider books a ride** → Status shows "WAITING FOR DRIVER"
2. **Driver accepts ride** → Status changes to "DRIVER ASSIGNED"
3. **Driver goes online** → Blue marker appears on map
4. **Driver location updates** → Marker moves in real-time

## Testing the Feature

### Step 1: Start Both Applications

```bash
# Terminal 1 - Start Backend
cd apps/api
npm run dev

# Terminal 2 - Start Frontend
cd apps/frontend
npm run dev
```

### Step 2: Create Test Accounts

1. **Create a Rider Account:**
   - Go to http://localhost:5173
   - Click "Get Started" or "Login"
   - Sign up as a regular user
   - Email: `rider@test.com`, Password: `password123`

2. **Create a Driver Account:**
   - Open an incognito/private window
   - Go to http://localhost:5173
   - Navigate to `/driver/register`
   - Fill in driver details:
     - Email: `driver@test.com`
     - Password: `password123`
     - Vehicle: `Toyota Camry`
     - License: `ABC123`
   - Complete registration

### Step 3: Book a Ride (As Rider)

1. Log in as rider (`rider@test.com`)
2. Click "Book a New Ride"
3. Set pickup and drop-off locations
4. Choose departure time (can be now or future)
5. Set number of passengers
6. Click "Search for Rides" or "Create Ride Request"
7. Confirm and book the ride
8. Note the ride status: **"WAITING FOR DRIVER"**

### Step 4: Accept the Ride (As Driver)

1. In the incognito window, log in as driver (`driver@test.com`)
2. Click "Go Online" button
   - Status changes to "Available"
   - WebSocket shows "Connected"
   - Location sharing indicator shows "📍 Sharing location"
3. You should see the ride request in "Available Ride Requests"
4. Click "✓ Accept Ride"
5. Ride is now assigned to you

### Step 5: View Real-Time Location (As Rider)

1. Switch back to rider window
2. Go to "Your Rides" and click on the booked ride
3. **You should now see:**
   - Green marker: Pickup location
   - Red marker: Drop-off location
   - **Blue marker: Driver's current location** (if driver is online)
   - Status badge: "DRIVER ASSIGNED"
   - Real-time location info showing lat/lng and last update time

4. **The driver marker should:**
   - Appear within a few seconds
   - Update every 5 seconds
   - Show driver's actual GPS location

### Step 6: Simulate Driver Movement

To see the marker move in real-time:

**Option 1: Use Browser DevTools**
1. In driver window, open DevTools (F12)
2. Go to Console
3. Run this to simulate movement:
```javascript
// Override geolocation to simulate movement
let lat = 28.6139;
let lng = 77.2090;

setInterval(() => {
  lat += 0.001;  // Move slightly north
  lng += 0.001;  // Move slightly east
  
  navigator.geolocation.getCurrentPosition = (success) => {
    success({
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: 0,
        speed: 20
      },
      timestamp: Date.now()
    });
  };
}, 5000);
```

**Option 2: Use Real GPS (Mobile)**
- Open the driver dashboard on a mobile device
- Allow location permissions
- Walk around - the marker will update!

## Troubleshooting

### Driver location not showing?

**Check these in order:**

1. **WebSocket Connected?**
   - Rider page should show "🟢 Connected"
   - Driver page should show "Connected" under WebSocket

2. **Driver Online?**
   - Driver dashboard should show "Available" status (green)
   - Location sharing indicator: "📍 Sharing location"

3. **Browser Console (Rider Side):**
   ```
   Expected logs:
   ✅ 🔌 Subscribing to ride: <ride-id>
   ✅ 🚗 Ride status update received: {...}
   ✅ 📍 Setting initial driver location from ride status
   ✅ 📍 Driver location update received: {...}
   ✅ 🗺️ Updating driver marker: {...}
   ✅ ➕ Creating new driver marker
   ```

4. **Browser Console (Driver Side):**
   ```
   Expected logs (reduced frequency):
   📍 Location shared: { lat: ..., lng: ... }  (occasional)
   ```

5. **Backend Logs:**
   ```
   Check apps/api/logs/combined.log for:
   - Driver location updates
   - WebSocket room subscriptions
   - Location broadcasts to riders
   ```

### Common Issues

**Issue: "Cannot read properties of undefined (reading '_leaflet_pos')"**
- Fixed! Map cleanup was improved
- If still seeing: Refresh the page

**Issue: Driver marker doesn't appear**
- Ensure driver went online BEFORE accepting ride
- Check browser location permissions
- Verify WebSocket connection on both sides

**Issue: Marker appears but doesn't update**
- Check driver is still online
- Verify WebSocket hasn't disconnected
- Look for errors in browser console

**Issue: Wrong location shown**
- Browser may be using WiFi-based location (less accurate)
- On desktop, it might show ISP location
- Use mobile device for accurate GPS

## Status Badge Meanings

### Rider Dashboard

| Badge | Meaning |
|-------|---------|
| WAITING FOR DRIVER | Ride created, no driver yet |
| DRIVER ASSIGNED | Driver accepted, preparing for pickup |
| IN PROGRESS | Driver picked up rider, en route |
| COMPLETED | Ride finished successfully |
| CANCELLED | Ride was cancelled |

### Driver Dashboard

| Badge | Meaning |
|-------|---------|
| PENDING | New ride request available |
| ASSIGNED | You accepted this ride |
| IN PROGRESS | Currently driving |
| COMPLETED | Ride delivered |

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Driver    │         │   Backend   │         │    Rider    │
│   Browser   │         │  WebSocket  │         │   Browser   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Goes Online        │                       │
       ├──────────────────────►│                       │
       │                       │                       │
       │ 2. Accepts Ride       │                       │
       ├──────────────────────►│                       │
       │                       │ 3. Subscribes         │
       │                       │◄──────────────────────┤
       │                       │ to ride-{id}          │
       │                       │                       │
       │ 4. Location Update    │                       │
       │    (every 5s)         │                       │
       ├──────────────────────►│                       │
       │                       │ 5. Broadcast          │
       │                       ├──────────────────────►│
       │                       │ driver:location:update│
       │                       │                       │
       │                       │                       │ 6. Update Map
       │                       │                       │    (blue marker)
```

## API Endpoints Used

- `POST /api/auth/login` - Login
- `GET /api/rides/user/:userId` - Get rider's rides
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:id/accept` - Driver accepts ride
- `PATCH /api/driver/availability` - Toggle online/offline

## WebSocket Events

### Driver Emits:
- `driver:location` - Send GPS coordinates

### Rider Subscribes:
- `ride:subscribe` - Join room for specific ride
- `driver:location:update` - Receive driver position
- `ride:status` - Receive ride updates

## Next Steps

Once location tracking works:
1. Test with multiple rides
2. Test driver going offline/online
3. Test ride status changes (IN_PROGRESS, COMPLETED)
4. Add route optimization (future feature)
5. Add ETA calculations (future feature)

---

**Last Updated:** November 20, 2025
**Version:** 2.0 (Simplified)
