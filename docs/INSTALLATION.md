# Complete Installation & Troubleshooting Guide

## ✅ Current Status

All dependencies have been installed successfully:
- ✅ Root dependencies installed
- ✅ Backend (API) dependencies installed (695 packages)
- ✅ Frontend dependencies installed (370 packages)
- ✅ Prisma client generated

## Next Steps to Run the Application

### Step 1: Create `.env` file

```bash
cd /Users/rajatsharma/Desktop/BTP
cp .env.example .env
```

The default values in `.env.example` are configured for local development and will work as-is.

### Step 2: Start PostgreSQL Database

```bash
docker-compose up -d
```

**Verify it's running:**
```bash
docker ps
# You should see rideshare-postgres container
```

### Step 3: Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

This command will:
1. Create the database schema
2. Generate Prisma Client
3. Apply migrations

If asked "Do you want to continue?", type `y`.

### Step 4: (Optional) Seed Sample Data

```bash
cd apps/api
npm run prisma:seed
```

This creates:
- 2 sample drivers (`driver1@rideshare.dev`, `driver2@rideshare.dev`)
- 2 sample users (`rider1@rideshare.dev`, `rider2@rideshare.dev`)
- 2 sample rides

### Step 5: Start the Application

**Option A - Run Everything Together:**
```bash
cd /Users/rajatsharma/Desktop/BTP
npm run dev
```

**Option B - Run Separately (3 terminals):**

Terminal 1 (Backend):
```bash
cd /Users/rajatsharma/Desktop/BTP/apps/api
npm run dev
```

Terminal 2 (Frontend):
```bash
cd /Users/rajatsharma/Desktop/BTP/apps/frontend
npm run dev
```

Terminal 3 (Database Studio - optional):
```bash
cd /Users/rajatsharma/Desktop/BTP/apps/api
npx prisma studio
```

### Step 6: Access the Application

Once running:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api-docs
- **Prisma Studio**: http://localhost:5555 (if started)

---

## 🧪 Testing the App

### Test 1: Register and Login as Rider

1. Open http://localhost:5173
2. Click "I'm a Rider"
3. Enter email: `test@example.com`
4. Click "Send OTP"
5. **Check your terminal** running the backend - you'll see:
   ```
   ================================================================================
   📧 EMAIL SENT (Development Mode)
   ================================================================================
   To: test@example.com
   OTP: 123456
   Preview: https://ethereal.email/message/...
   ================================================================================
   ```
6. Enter the OTP and login

### Test 2: Register a Driver (via API)

```bash
curl -X POST http://localhost:3000/api/driver/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mydriver@example.com",
    "name": "Test Driver",
    "phone": "+1234567890",
    "vehicle": "Sedan",
    "vehicleModel": "Toyota Camry",
    "vehicleColor": "Silver",
    "licensePlate": "TEST-123"
  }'
```

Then login at http://localhost:5173 with:
- Role: "I'm a Driver"
- Email: `mydriver@example.com`
- Get OTP from console and login

### Test 3: Book a Ride

1. Login as a rider
2. Click "Book a New Ride"
3. Enter coordinates (examples below)
4. Search for available rides
5. Join a ride (if available from seed data)

**Sample Coordinates (New York City):**
- **Pickup**: `40.7128, -74.0060` (Lower Manhattan)
- **Drop**: `40.7589, -73.9851` (Times Square)

### Test 4: Real-time Location Tracking

1. Login as driver
2. Go to driver dashboard
3. Click "Go Online"
4. Allow location access when prompted
5. Your location will broadcast every 5 seconds
6. (In another browser/incognito) login as rider who joined driver's ride
7. Watch real-time location updates

---

## 🔧 Troubleshooting

### Problem: Docker container won't start

**Symptoms:**
- `docker-compose up -d` fails
- Can't connect to database

**Solutions:**

1. Check if Docker is running:
   ```bash
   docker info
   ```

2. Check if port 5432 is already in use:
   ```bash
   lsof -i :5432
   # Kill the process if needed
   kill -9 <PID>
   ```

3. Remove old containers and try again:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

4. Check container logs:
   ```bash
   docker-compose logs postgres
   ```

---

### Problem: Prisma migration fails

**Symptoms:**
- `prisma migrate dev` errors
- "Can't reach database server"

**Solutions:**

1. Ensure PostgreSQL is running:
   ```bash
   docker ps
   ```

2. Test database connection:
   ```bash
   docker exec -it rideshare-postgres psql -U rideshare -d rideshare_db
   # Type \q to exit
   ```

3. Check DATABASE_URL in `.env`:
   ```
   DATABASE_URL="postgresql://rideshare:rideshare123@localhost:5432/rideshare_db?schema=public"
   ```

4. Reset and retry:
   ```bash
   cd apps/api
   npx prisma migrate reset
   npx prisma migrate dev --name init
   ```

---

### Problem: Frontend won't start (Port 5173 in use)

**Symptoms:**
- `npm run dev` fails in frontend
- "Port 5173 is already in use"

**Solutions:**

1. Find what's using the port:
   ```bash
   lsof -i :5173
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

3. Or change the port in `apps/frontend/vite.config.ts`:
   ```typescript
   server: {
     port: 3001, // Change to any free port
   }
   ```

---

### Problem: Backend won't start (Port 3000 in use)

**Symptoms:**
- Backend fails to start
- "Port 3000 is already in use"

**Solutions:**

1. Find what's using the port:
   ```bash
   lsof -i :3000
   ```

2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

3. Or change PORT in `.env`:
   ```
   PORT=3001
   ```

---

### Problem: OTP email not received

**Symptoms:**
- No OTP in console
- Can't login

**Solutions:**

1. **Check backend terminal** - OTPs are always logged:
   ```
   📧 EMAIL SENT (Development Mode)
   OTP: 123456
   ```

2. Check email service logs:
   ```bash
   # In backend terminal, look for:
   ✅ Database connected
   📧 Using Ethereal test email account
   ```

3. If you see "Error sending email", check:
   - Internet connection (Ethereal needs internet)
   - No firewall blocking SMTP (port 587)

4. Temporary workaround - manually create OTP in database:
   ```bash
   cd apps/api
   npx prisma studio
   # Manually add OTP to OTPLog table
   ```

---

### Problem: WebSocket not connecting

**Symptoms:**
- Real-time updates don't work
- "WebSocket: Disconnected" in UI

**Solutions:**

1. Check browser console for errors:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for Socket.io errors

2. Verify backend is running:
   ```bash
   curl http://localhost:3000/health
   ```

3. Check if you're logged in (WebSocket needs auth):
   - Logout and login again
   - Check localStorage for token

4. Verify WebSocket connection in DevTools:
   - Network tab > Filter: WS
   - Should see WebSocket connection

---

### Problem: "Module not found" errors

**Symptoms:**
- Import errors
- TypeScript errors

**Solutions:**

1. Reinstall dependencies:
   ```bash
   cd apps/api
   rm -rf node_modules package-lock.json
   npm install
   
   cd ../frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Regenerate Prisma client:
   ```bash
   cd apps/api
   npx prisma generate
   ```

3. Clear build caches:
   ```bash
   # Frontend
   cd apps/frontend
   rm -rf dist .vite
   
   # Backend
   cd apps/api
   rm -rf dist
   ```

---

### Problem: Database schema out of sync

**Symptoms:**
- Prisma client errors
- "Invalid column" errors

**Solutions:**

1. Regenerate Prisma client:
   ```bash
   cd apps/api
   npx prisma generate
   ```

2. If schema changed, create new migration:
   ```bash
   npx prisma migrate dev --name your_change_name
   ```

3. Nuclear option (resets database):
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

---

### Problem: CORS errors in browser

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- API calls fail from frontend

**Solutions:**

1. Check CORS_ORIGIN in backend `.env`:
   ```
   CORS_ORIGIN=http://localhost:5173
   ```

2. Restart backend after changing .env

3. Clear browser cache and reload

---

### Problem: TypeScript errors

**Symptoms:**
- Build fails
- Type errors in IDE

**Solutions:**

1. Ensure TypeScript is installed:
   ```bash
   npm install -g typescript
   ```

2. Regenerate types:
   ```bash
   cd apps/api
   npx prisma generate
   npm run build
   ```

3. Restart TypeScript server in VS Code:
   - `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

## 🧹 Clean Reset (Nuclear Option)

If everything is broken, start fresh:

```bash
cd /Users/rajatsharma/Desktop/BTP

# Stop all services
docker-compose down -v

# Remove all node_modules
rm -rf node_modules apps/*/node_modules

# Remove build artifacts
rm -rf apps/api/dist apps/frontend/dist apps/frontend/.vite

# Reinstall everything
npm install
cd apps/api && npm install && npx prisma generate
cd ../frontend && npm install
cd ../..

# Restart database
docker-compose up -d

# Run migrations
cd apps/api
npx prisma migrate dev --name init
npm run prisma:seed

# Start app
cd ../..
npm run dev
```

---

## 📋 Pre-flight Checklist

Before starting the app, ensure:

- [ ] Docker Desktop is running
- [ ] Node.js 20+ is installed (`node --version`)
- [ ] Ports 3000, 5173, 5432 are free
- [ ] `.env` file exists (copy from `.env.example`)
- [ ] Dependencies installed in all packages
- [ ] Prisma client generated
- [ ] PostgreSQL container is running
- [ ] Database migrations applied

Quick check script:
```bash
cd /Users/rajatsharma/Desktop/BTP

# Check Node version
node --version  # Should be v20.x or higher

# Check Docker
docker ps  # Should show rideshare-postgres

# Check dependencies
ls node_modules  # Should exist
ls apps/api/node_modules  # Should exist
ls apps/frontend/node_modules  # Should exist

# Check Prisma
ls apps/api/node_modules/@prisma/client  # Should exist

# Check .env
cat .env  # Should show DATABASE_URL and other vars
```

---

## 🎯 Success Indicators

When everything is working correctly, you should see:

**Backend Terminal:**
```
🚀 Server running on port 3000
📡 WebSocket server ready
🏥 Health check: http://localhost:3000/health
📚 API docs: http://localhost:3000/api-docs
✅ Database connected
📧 Using Ethereal test email account
```

**Frontend Terminal:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Browser (http://localhost:5173):**
- Beautiful landing page loads
- No console errors (check DevTools)
- Can navigate to /login

**API Health Check:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## 📞 Getting Help

If you're still stuck:

1. **Check the logs:**
   - Backend: Look at terminal running `npm run dev`
   - Frontend: Browser DevTools → Console
   - Database: `docker-compose logs postgres`

2. **Verify configuration:**
   - `.env` file has correct values
   - Database URL matches Docker setup
   - Ports are not conflicting

3. **Test components individually:**
   - Database: `docker exec -it rideshare-postgres psql -U rideshare`
   - Backend: `curl http://localhost:3000/health`
   - Prisma: `cd apps/api && npx prisma studio`

4. **Check documentation:**
   - [QUICKSTART.md](./QUICKSTART.md)
   - [ARCHITECTURE.md](./ARCHITECTURE.md)
   - [API.md](./API.md)

---

## 🎉 You're All Set!

Once the application starts successfully, you can:
1. Create accounts (rider and driver)
2. Book rides
3. Track drivers in real-time
4. Explore the API
5. Review the code
6. Build new features!

**Happy coding! 🚀**
