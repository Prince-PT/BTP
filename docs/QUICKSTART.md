# 🚀 Quick Start Guide

Get your RideShare application up and running in minutes!

## Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js 20+** - [Download](https://nodejs.org/)
- ✅ **Docker & Docker Compose** - [Download](https://www.docker.com/get-started)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **npm** (comes with Node.js)

## Installation Steps

### Step 1: Navigate to Project
```bash
cd /Users/rajatsharma/Desktop/BTP
```

### Step 2: Install Dependencies

All dependencies are already installed! If you need to reinstall:

```bash
# Root dependencies
npm install

# Backend dependencies
cd apps/api && npm install

# Frontend dependencies
cd ../frontend && npm install

cd ../..
```

### Step 3: Setup Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your preferences (optional for development)
# The default values work out of the box for local development
```

**Key Environment Variables:**
- `DATABASE_URL` - Already configured for Docker
- `JWT_SECRET` - Change this in production!
- `SMTP_*` - Leave empty for dev (uses Ethereal email)

### Step 4: Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify the database is running:
```bash
docker ps
```

You should see `rideshare-postgres` container running.

### Step 5: Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev --name init
```

This will:
- Create database tables
- Generate Prisma client

### Step 6: (Optional) Seed Database

Add sample data for testing:

```bash
cd apps/api
npm run prisma:seed
```

This creates:
- 2 sample drivers
- 2 sample riders
- 2 sample rides

## Running the Application

### Option 1: Run Everything Together (Recommended)

From the root directory:

```bash
npm run dev
```

This starts:
- 🔵 Backend API on http://localhost:3000
- 🟣 Frontend on http://localhost:5173

### Option 2: Run Services Individually

**Terminal 1 - Backend:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

**Terminal 3 - View Database:**
```bash
cd apps/api
npm run prisma:studio
```

## Access the Application

Once everything is running:

- **Frontend App**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api-docs
- **Prisma Studio**: http://localhost:5555 (if running)

## Testing the Application

### 1. Create a Rider Account

1. Open http://localhost:5173
2. Click **"I'm a Rider"**
3. Enter your email (e.g., `test@example.com`)
4. Click **"Send OTP"**
5. Check console logs for the OTP (or Ethereal preview URL)
6. Enter the OTP and login

### 2. Create a Driver Account

First, register as a driver via API:

```bash
curl -X POST http://localhost:3000/api/driver/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "name": "John Driver",
    "phone": "+1234567890",
    "vehicle": "Sedan",
    "vehicleModel": "Toyota Camry",
    "vehicleColor": "Silver",
    "licensePlate": "ABC-1234"
  }'
```

Then login:
1. Go to http://localhost:5173/login
2. Click **"I'm a Driver"**
3. Enter `driver@example.com`
4. Get OTP and login

### 3. Test Ride Booking Flow

**As Driver:**
1. Login to driver dashboard
2. Click "Go Online"
3. Allow location access
4. Create a new ride (or use seeded data)

**As Rider:**
1. Login to rider dashboard
2. Click "Book a New Ride"
3. Enter pickup/drop coordinates (examples provided)
4. Search for available rides
5. Join a ride
6. View ride details with real-time tracking

## Sample Coordinates (New York)

Use these for testing:

**Pickup Locations:**
- Lower Manhattan: `40.7128, -74.0060`
- Times Square: `40.7589, -73.9851`
- Brooklyn Bridge: `40.7061, -73.9969`

**Drop Locations:**
- Central Park: `40.7829, -73.9654`
- JFK Airport: `40.6413, -73.7781`
- Statue of Liberty: `40.6892, -74.0445`

## Viewing Email OTPs

In development mode, OTPs are logged in two places:

1. **Console Output**: Check the terminal running the backend
2. **Ethereal Email**: Look for a preview URL in the logs

Example console output:
```
================================================================================
📧 EMAIL SENT (Development Mode)
================================================================================
To: test@example.com
OTP: 123456
Preview: https://ethereal.email/message/...
================================================================================
```

## Database Management

### View Data
```bash
cd apps/api
npx prisma studio
```

### Reset Database
```bash
cd apps/api
npx prisma migrate reset
```

### Create New Migration
```bash
cd apps/api
npx prisma migrate dev --name your_migration_name
```

## Running Tests

### Backend Unit Tests
```bash
cd apps/api
npm test
```

### Test Coverage
```bash
cd apps/api
npm test -- --coverage
```

## Troubleshooting

### Database Connection Failed

**Problem**: Cannot connect to PostgreSQL

**Solution**:
```bash
# Check if Docker container is running
docker ps

# Restart container
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Port Already in Use

**Problem**: Port 3000 or 5173 already in use

**Solution**:
```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill process
kill -9 <PID>

# Or change ports in .env and vite.config.ts
```

### Prisma Client Not Generated

**Problem**: `@prisma/client` not found

**Solution**:
```bash
cd apps/api
npx prisma generate
```

### Email Not Sending

**Problem**: No OTP email received

**Solution**:
- In development, check console for Ethereal preview URL
- OTPs are always logged to console
- For production, configure SMTP settings in `.env`

### WebSocket Not Connecting

**Problem**: Real-time updates not working

**Solution**:
- Check that both frontend and backend are running
- Verify WebSocket connection in browser DevTools > Network > WS
- Ensure you're logged in with a valid token

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Changes auto-refresh
- Backend: Using `tsx watch`

### Debugging

**Backend:**
Add breakpoints and run:
```bash
cd apps/api
npm run dev
```

**Frontend:**
Use browser DevTools and React DevTools extension

### Logs

Backend logs are saved to:
- `apps/api/logs/error.log`
- `apps/api/logs/combined.log`

## Next Steps

After getting the app running:

1. ✅ Explore the API with the docs at http://localhost:3000/api-docs
2. ✅ Read the [Architecture Documentation](./ARCHITECTURE.md)
3. ✅ Check the [API Reference](./API.md)
4. ✅ Review the [Database Schema](./ERD.md)
5. ✅ Start building new features!

## Production Deployment

Before deploying to production:

1. Set strong `JWT_SECRET` in `.env`
2. Configure production database
3. Set up production SMTP (SendGrid/Mailgun)
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up monitoring and logging
7. Run security audit
8. Load testing

See [Production Checklist](./ARCHITECTURE.md#deployment-checklist) for details.

## Need Help?

- 📖 Check the [README](../README.md)
- 🏗️ Review [Architecture](./ARCHITECTURE.md)
- 🔌 See [API Docs](./API.md)
- 🗄️ Understand [Database Schema](./ERD.md)

## Common Commands Reference

```bash
# Start everything
npm run dev

# Start database
docker-compose up -d

# Stop database
docker-compose down

# View database
cd apps/api && npx prisma studio

# Run tests
cd apps/api && npm test

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint
```

Happy coding! 🚀
