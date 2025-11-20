# Quick Testing Guide - Corrected Flow

## 🎯 Testing the Rider → Driver Flow

### Prerequisites
- Both servers running (`npm run dev` from root)
- Database migrated and empty
- Browser at http://localhost:5173

---

## Test Scenario: Complete Ride Flow

### Step 1: Register as a Rider

1. Go to http://localhost:5173
2. Click **"Start Riding"**
3. Enter your email (e.g., `rider@test.com`)
4. Click **"Send OTP"**
5. Check terminal logs for OTP code or Ethereal preview URL
6. Enter the 6-digit OTP
7. Click **"Verify & Login"**
8. You should see the **Rider Dashboard**

### Step 2: Create a Ride Request

1. From Rider Dashboard, click **"Book a Ride"**
2. **Set Pickup Location:**
   - Option A: Click **"Use Current Location"** (needs GPS)
   - Option B: Type address in search box (e.g., "Times Square, NY")
   - Option C: Click directly on the map
   - Drag the green marker to adjust if needed
3. **Set Drop Location:**
   - Repeat process with red marker
   - Use a location 5-10km away
4. **Select Departure Time:**
   - Choose a time (current or future)
5. **Select Passengers:**
   - Choose 1-4 passengers
6. **Review Trip Summary** (blue box shows route details)
7. Click **"🚗 Request Ride"**
8. ✅ You should see: "Ride request created successfully!"
9. Note the Ride ID from the URL (e.g., `/rider/rides/{ride-id}`)

### Step 3: Register as a Driver

1. Open new **incognito/private window**
2. Go to http://localhost:5173
3. Click **"Become a Driver"**
4. Fill in driver registration:
   - Email: `driver@test.com`
   - Name: `Test Driver`
   - Phone: `+1234567890`
   - Vehicle: `Sedan`
   - Vehicle Model: `Toyota Camry`
   - Vehicle Color: `Black`
   - License Plate: `ABC123`
5. Click **"Register as Driver"**
6. Check terminal for OTP
7. Enter OTP on login page
8. ✅ You should see the **Driver Dashboard**

### Step 4: Driver Accepts Ride Request

1. On Driver Dashboard, click **"Go Online"**
2. Allow location access when prompted
3. ✅ You should see **"Available Ride Requests"** section
4. You should see the ride request created by the rider:
   - Shows pickup address
   - Shows drop address
   - Shows fare estimate
   - Shows distance
   - Shows departure time
   - Shows number of seats needed
5. Click **"✓ Accept Ride"**
6. Confirm acceptance in the dialog
7. ✅ You should see: "Ride accepted! The rider has been notified."

### Step 5: Verify Ride Status

**In Rider Window:**
1. Navigate to "My Rides" or the ride details page
2. Status should change from `PENDING` to `ASSIGNED`
3. Driver information should now be visible
4. Real-time driver location should appear on map

**In Driver Window:**
1. The accepted ride should appear in "Your Rides" section
2. Status should show `ASSIGNED`
3. Rider information should be visible

---

## 🧪 Additional Test Cases

### Test Case 1: Multiple Riders, One Driver

1. Create 3 ride requests from different rider accounts
2. Driver should see all 3 requests
3. Driver accepts one request
4. That request disappears from available list
5. Other 2 requests remain visible

### Test Case 2: Driver Offline

1. Driver logs in
2. **Do NOT click "Go Online"**
3. Available requests section should not show
4. Driver cannot accept any requests

### Test Case 3: Location-Based Filtering

1. Create ride request from New York
2. Driver shares location from California
3. Request should show large "distance to pickup"
4. Driver can still accept (no hard limit)

### Test Case 4: No Available Requests

1. Driver goes online
2. No ride requests in database
3. Should see: "🔍 No ride requests available at the moment"

### Test Case 5: Invalid Ride Request

1. Rider tries to submit without selecting locations
2. Should see: "Please select both pickup and drop locations"
3. Rider tries to submit without departure time
4. Should see: "Please select a departure time"

---

## 🔍 What to Look For

### ✅ Success Indicators

**Rider Side:**
- Can click on map to set locations
- Can search by address
- Trip summary shows correct addresses
- Ride created with PENDING status
- Receives ride ID after creation

**Driver Side:**
- Available requests only visible when online
- Can see all pending requests
- Acceptance creates driver assignment
- Status changes to ASSIGNED
- Rider notified immediately

### ❌ Common Issues

**Issue:** "Cannot find module './pages/Login'"
- **Fix:** Restart the frontend dev server

**Issue:** Prisma enum type errors
- **Fix:** Run `cd apps/api && npx prisma generate`

**Issue:** OTP not received
- **Fix:** Check terminal logs for Ethereal preview URL

**Issue:** Map not loading
- **Fix:** Check internet connection (needs Leaflet tiles)

**Issue:** Location permission denied
- **Fix:** Use address search or click on map instead

---

## 📊 Database Verification

### Check Ride Status in Database

```bash
cd apps/api
npx prisma studio
```

Then navigate to `Ride` table and verify:
- `status` = `PENDING` before driver accepts
- `driverId` = `null` before driver accepts
- `status` = `ASSIGNED` after driver accepts
- `driverId` = `{driver-id}` after driver accepts
- `acceptedAt` timestamp is set after acceptance

### Check RideMember Table

Should have one entry per ride:
- `userId` = rider's ID
- `rideId` = ride ID
- `status` = `CONFIRMED`
- `price` = calculated fare

---

## 🚀 WebSocket Testing

### Real-Time Location Updates

1. Accept a ride as driver
2. Open browser DevTools → Network → WS tab
3. Filter for WebSocket connections
4. Should see:
   - `driver:location` events every 5 seconds
   - Location data: `{ lat, lng, heading, speed }`

### Driver Availability

1. Toggle "Go Online" / "Go Offline"
2. Check WebSocket events
3. Verify availability status broadcasts

---

## 📝 API Testing (Postman/cURL)

### 1. Request OTP

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"user"}'
```

### 2. Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","role":"user"}'
```

### 3. Create Ride Request

```bash
curl -X POST http://localhost:3000/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "originLat": 40.7580,
    "originLng": -73.9855,
    "originAddress": "Times Square, NY",
    "destLat": 40.7614,
    "destLng": -73.9776,
    "destAddress": "Central Park, NY",
    "departTime": "2025-11-20T10:00:00Z",
    "seatsNeeded": 1
  }'
```

### 4. Get Available Requests (Driver)

```bash
curl -X GET "http://localhost:3000/api/rides/available?lat=40.7580&lng=-73.9855&radius=10" \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN"
```

### 5. Accept Ride (Driver)

```bash
curl -X POST http://localhost:3000/api/rides/RIDE_ID/accept \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN"
```

---

## ✅ Expected Results Summary

| Action | Expected Result |
|--------|----------------|
| Rider creates request | Ride with PENDING status, no driver |
| Driver goes online | Sees all pending requests |
| Driver accepts request | Ride status → ASSIGNED, driverId set |
| Rider views ride | Sees driver info and can track location |
| Driver goes offline | Cannot see or accept requests |

---

## 🎉 Success!

If all tests pass, the corrected flow is working properly:
- ✅ Riders initiate ride requests
- ✅ Drivers see and accept requests
- ✅ Real-time updates work
- ✅ Database reflects correct flow
