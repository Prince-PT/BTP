# Location Tracking Test Guide

## Overview
This guide will help you test the real-time driver location tracking feature.

## Prerequisites
1. Backend server running (port 3000)
2. Frontend running (port 5173)
3. Two browser windows/tabs:
   - One for Driver
   - One for Rider

## Step-by-Step Testing

### 1. Setup Driver Account
1. Open browser window #1 (Driver)
2. Navigate to `http://localhost:5173`
3. Register as driver or login with existing driver account
4. Go to Driver Dashboard
5. Click "Go Online" button to become available
6. **IMPORTANT**: Click "▶ Start Sharing" button to enable location sharing
   - You should see "📍 Sharing location" status
   - WebSocket should show "🟢 Connected"

### 2. Setup Rider Account
1. Open browser window #2 (Rider)
2. Navigate to `http://localhost:5173`
3. Login as rider (or create new user account)
4. Create a new ride request:
   - Set pickup location
   - Set drop-off location
   - Set departure time
   - Submit the request

### 3. Accept Ride (Driver)
1. Switch to Driver window
2. You should see the ride request in "Available Ride Requests" section
3. Click "✓ Accept Ride" button
4. **VERIFY**: Location sharing should still be active (or auto-start)

### 4. View Live Tracking (Rider)
1. Switch to Rider window
2. Go to "My Rides" and click on the ride you created
3. You should see:
   - Ride status: "ASSIGNED"
   - Driver information displayed
   - Map showing:
     - 🟢 Green marker: Pickup location
     - 🔴 Red marker: Drop-off location
     - 🔵 Blue marker: Driver's current location (should appear)

### 5. Verify Real-Time Updates

#### Open Browser Console (F12) on Rider Side
You should see logs like:
```
🔌 Subscribing to ride: <ride-id>
🚗 Ride status update received: {driver: {...}, status: 'ASSIGNED'}
📍 Setting initial driver location from ride status: {lat: X, lng: Y}
🗺️ Updating driver marker: {lat: X, lng: Y}
➕ Creating new driver marker
```

#### Every 5 seconds you should see:
```
📍 Driver location update received: {lat: X, lng: Y}
🗺️ Updating driver marker: {lat: X, lng: Y}
✅ Updating existing driver marker position
```

#### Open Backend Console/Logs
You should see:
```
📍 Driver <driver-id> location update - Broadcasting to 1 active rides
  → Broadcasting to ride-<ride-id>
```

### 6. Simulate Driver Movement (For Testing)

Since you're testing locally, the driver's location will be based on your actual GPS. To simulate movement:

**Option A: Use Browser DevTools**
1. Open DevTools on Driver window
2. Go to Console
3. Press F1 → Settings → Sensors
4. Override geolocation with custom coordinates
5. Change coordinates every few seconds to simulate movement

**Option B: Use Mock Location (Chrome)**
1. DevTools → More tools → Sensors
2. Select a location or enter custom lat/lng
3. Change it to see updates

## Troubleshooting

### Driver Location Not Showing

**Check 1: Driver Dashboard**
- [ ] Is "WebSocket" showing "🟢 Connected"?
- [ ] Is location sharing active ("📍 Sharing location")?
- [ ] Click "▶ Start Sharing" button manually if not active

**Check 2: Rider Console**
Look for these logs:
- [ ] `🔌 Subscribing to ride:` - Rider connected to WebSocket
- [ ] `🚗 Ride status update received:` - Initial ride data received
- [ ] `📍 Driver location update received:` - Real-time updates working

**Check 3: Backend Logs**
- [ ] Check if driver location updates are being received
- [ ] Check if broadcasts are being sent to the ride room
- [ ] Look for any error messages

**Check 4: Ride Status**
- [ ] Ride status must be "ASSIGNED" or "IN_PROGRESS"
- [ ] Driver must be assigned to the ride
- [ ] Driver must have accepted the ride

**Check 5: Browser Permissions**
- [ ] Driver browser has location permissions enabled
- [ ] Check browser URL bar for location icon
- [ ] Grant permissions if prompted

### Common Issues

1. **"Cannot read properties of undefined (_leaflet_pos)"**
   - Fixed in latest code
   - Ensure you're using updated RideDetails.tsx

2. **No location updates appearing**
   - Driver needs to click "▶ Start Sharing" manually
   - Or have an active ride (status ASSIGNED/IN_PROGRESS)

3. **WebSocket disconnected**
   - Check backend server is running
   - Check network tab for WebSocket connection
   - Try refreshing both pages

## Expected Behavior

### When Working Correctly:

1. **Driver Dashboard**
   - Location updates sent every 5 seconds
   - Console shows occasional location logs
   - No errors in console

2. **Rider Dashboard**
   - Blue marker appears on map at driver's location
   - Blue marker updates position every 5 seconds
   - "Driver Active" badge shows green
   - Driver location coordinates update in real-time

3. **Backend Logs**
   - Shows driver location broadcasts
   - Shows riders joining ride rooms
   - No error messages

## Success Criteria

- [x] Driver can share location
- [x] Rider can subscribe to ride updates
- [x] Driver location appears on rider's map
- [x] Location updates in real-time (every 5 seconds)
- [x] No console errors
- [x] Blue marker moves when driver location changes
