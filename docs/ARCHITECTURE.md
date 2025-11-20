# System Architecture

## Overview

RideShare is a full-stack ride-sharing application built with modern web technologies. The system enables riders to find and join shared rides, while drivers can offer rides and track their passengers in real-time.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React SPA (Vite + TypeScript)                │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐ │   │
│  │  │  Rider Interface │  │   Driver Interface        │ │   │
│  │  │  - Book rides    │  │   - Create rides          │ │   │
│  │  │  - Track driver  │  │   - Share location        │ │   │
│  │  │  - View history  │  │   - Manage passengers     │ │   │
│  │  └──────────────────┘  └──────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │       Shared Components                       │   │   │
│  │  │  - Map (Leaflet)                              │   │   │
│  │  │  - Auth Context                               │   │   │
│  │  │  - Socket Context (Socket.io-client)          │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTP + WebSocket
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                     API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────  ┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │    Express.js + TypeScript Server                    │    │
│  │                                                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │  CORS    │  │  Helmet  │  │   Rate Limiting  │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │         Authentication Middleware            │   │    │
│  │  │         (JWT Verification)                   │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────┬───────────────────────────┬────────────────  ┘
                 │                           │
                 │ REST                      │ WebSocket
                 │                           │
┌────────────────▼───────────┐   ┌──────────▼─────────────────┐
│   BUSINESS LOGIC LAYER     │   │   REAL-TIME LAYER          │
├────────────────────────────┤   ├────────────────────────────┤
│                            │   │                            │
│  ┌──────────────────────┐ │   │  ┌──────────────────────┐ │
│  │  Auth Service        │ │   │  │  Socket.io Server    │ │
│  │  - OTP generation    │ │   │  │                      │ │
│  │  - Email sending     │ │   │  │  ┌────────────────┐ │ │
│  │  - JWT creation      │ │   │  │  │ Driver Events  │ │ │
│  └──────────────────────┘ │   │  │  │ - location     │ │ │
│                            │   │  │  └────────────────┘ │ │
│  ┌──────────────────────┐ │   │  │                      │ │
│  │  Matching Service    │ │   │  │  ┌────────────────┐ │ │
│  │  - Find candidates   │ │   │  │  │ Rider Events   │ │ │
│  │  - Score rides       │ │   │  │  │ - subscribe    │ │ │
│  │  - Calculate prices  │ │   │  │  │ - unsubscribe  │ │ │
│  └──────────────────────┘ │   │  │  └────────────────┘ │ │
│                            │   │  └──────────────────────┘ │
│  ┌──────────────────────┐ │   │                            │
│  │  Geo Utils           │ │   │  Rooms:                    │
│  │  - Haversine         │ │   │  - ride-{id}               │
│  │  - Bounding box      │ │   │  - driver-{id}             │
│  │  - Route calc        │ │   │                            │
│  └──────────────────────┘ │   └────────────────────────────┘
│                            │
└────────────────┬───────────┘
                 │
                 │ Prisma ORM
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            PostgreSQL 18 Database                  │    │
│  │                                                     │    │
│  │   Tables:                                          │    │
│  │   - users          (rider accounts)                │    │
│  │   - drivers        (driver accounts + location)    │    │
│  │   - rides          (ride instances)                │    │
│  │   - ride_members   (riders in rides)               │    │
│  │   - otp_logs       (OTP verification)              │    │
│  │                                                     │    │
│  │   Indexes:                                         │    │
│  │   - Geospatial (lat/lng pairs)                     │    │
│  │   - Status fields                                  │    │
│  │   - Composite keys                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3
- **Routing**: React Router 6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **WebSocket Client**: Socket.io-client
- **Maps**: Leaflet + OpenStreetMap

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **WebSocket**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer (Ethereal for dev)
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest

### Database
- **DBMS**: PostgreSQL 18
- **Hosting**: Docker container (development)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Development**: Concurrent scripts for full-stack dev

## Key Design Patterns

### 1. **Repository Pattern** (via Prisma)
- Database access abstracted through Prisma Client
- Type-safe queries
- Migration management

### 2. **Service Layer Pattern**
- Business logic separated into services:
  - `auth.service.ts` - Authentication & OTP
  - `matching.service.ts` - Ride matching algorithm
  - `email.service.ts` - Email notifications

### 3. **Context Provider Pattern** (Frontend)
- `AuthContext` - Global authentication state
- `SocketContext` - WebSocket connection management

### 4. **Middleware Pipeline** (Backend)
- Authentication
- Validation (Joi schemas)
- Error handling
- Rate limiting

## Data Flow

### User Login Flow
```
1. User enters email → POST /auth/request-otp
2. Server generates 6-digit OTP
3. Server stores OTP in database (expires in 5 min)
4. Server sends OTP via email (Nodemailer)
5. User enters OTP → POST /auth/verify-otp
6. Server validates OTP
7. Server returns JWT token
8. Client stores token in localStorage
9. Client includes token in all subsequent requests
```

### Ride Booking Flow
```
1. Rider enters pickup/drop locations → GET /rides/available
2. Server calculates bounding box around pickup
3. Server queries rides within box
4. Server runs matching algorithm:
   - Calculate route distance with stop
   - Calculate offset distance
   - Score rides by efficiency
5. Server returns top 10 matches
6. Rider selects ride → POST /rides/:id/join
7. Server validates capacity
8. Server calculates price for rider
9. Server creates RideMember record (status: REQUESTED)
10. Rider confirms → POST /rides/:id/confirm-payment
11. Server marks RideMember as CONFIRMED
12. Server increments ride.seatsTaken
```

### Real-time Location Tracking
```
1. Driver enables location sharing
2. Browser requests geolocation permission
3. Every 5 seconds:
   a. Get GPS coordinates
   b. Emit socket event: driver:location
   c. Also POST /driver/location (backup)
4. Server receives location
5. Server updates driver.currentLat/Lng
6. Server broadcasts to all riders in driver's active rides:
   → Emit to room: ride-{rideId}
   → Event: driver:location:update
7. Rider app updates map marker
```

## Matching Algorithm

### Input
- Rider's pickup/drop coordinates
- Departure time (optional)

### Process
1. **Find Candidates** (SQL query)
   - Rides with status = OPEN
   - isShared = true
   - seatsTaken < capacity
   - originLat/Lng within bounding box (~10km radius)
   - departTime within ±30 minutes

2. **Score Each Candidate**
   ```javascript
   for each ride:
     originalDistance = haversine(ride.origin, ride.dest)
     newDistance = haversine(ride.origin, rider.pickup) +
                   haversine(rider.pickup, rider.drop) +
                   haversine(rider.drop, ride.dest)
     offsetAdded = newDistance - originalDistance
     
     if offsetAdded > MAX_OFFSET_KM: skip
     
     efficiency = offsetAdded / originalDistance
     if efficiency > MAX_EFFICIENCY_RATIO: skip
     
     score = offsetAdded * 2 +
             distanceToPickup * 1.5 +
             (1 / seatsAvailable) * 0.5 +
             efficiency * 10
   ```

3. **Sort & Return**
   - Sort by score (ascending, lower is better)
   - Return top 10 matches

### Output
- Array of scored rides with:
  - Ride details
  - Offset distance
  - Price per person
  - Score
  - Seats available

## Security Considerations

### Authentication
- ✅ Passwordless OTP authentication
- ✅ JWT with expiration (7 days default)
- ✅ OTP expires after 5 minutes
- ✅ OTP is single-use (marked as `used`)
- ✅ Tokens validated on every protected route

### Authorization
- ✅ Role-based access control (user vs driver)
- ✅ Users can only access their own data
- ✅ Drivers can only modify their own rides

### Data Protection
- ✅ CORS configured for specific origin
- ✅ Helmet.js security headers
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation with Joi
- ✅ SQL injection protection (Prisma parameterized queries)

### WebSocket Security
- ✅ Socket connections require JWT authentication
- ✅ Users can only subscribe to their own rides
- ✅ Drivers can only broadcast their own location

## Scalability Considerations

### Current Architecture (MVP)
- Single Node.js server
- Single PostgreSQL instance
- In-memory WebSocket connections

### Future Improvements

1. **Horizontal Scaling**
   - Add Redis for session storage
   - Use Redis adapter for Socket.io (multi-server)
   - Load balancer (NGINX/HAProxy)

2. **Database Optimization**
   - Enable PostGIS for advanced spatial queries
   - Read replicas for ride searches
   - Connection pooling (PgBouncer)

3. **Caching**
   - Redis cache for frequent queries
   - CDN for static assets

4. **Background Jobs**
   - Add BullMQ + Redis for async tasks:
     - Email sending
     - Ride matching
     - Analytics

5. **Monitoring**
   - Application Performance Monitoring (Datadog/NewRelic)
   - Error tracking (Sentry)
   - Log aggregation (ELK stack)

## Development Workflow

### Local Development
```bash
# Start infrastructure
docker-compose up -d

# Run database migrations
cd apps/api && pnpm prisma migrate dev

# Start backend (port 3000)
cd apps/api && pnpm dev

# Start frontend (port 5173)
cd apps/frontend && pnpm dev
```

### Testing
```bash
# Unit tests
cd apps/api && pnpm test

# Coverage report
cd apps/api && pnpm test --coverage
```

### Deployment Checklist
- [ ] Set strong JWT_SECRET
- [ ] Configure production SMTP
- [ ] Enable HTTPS/SSL
- [ ] Set proper CORS origins
- [ ] Configure production DATABASE_URL
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Load testing
- [ ] Security audit

## Performance Metrics

### Target Metrics
- API response time: < 200ms (p95)
- WebSocket latency: < 100ms
- Database queries: < 50ms
- Ride matching: < 500ms
- Frontend load time: < 2s

### Monitoring
- Use Winston for structured logging
- Track key metrics:
  - Ride bookings per hour
  - Active WebSocket connections
  - Database connection pool usage
  - API endpoint latencies

## Folder Structure Rationale

```
apps/
├── api/          # Backend service (can be deployed independently)
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # Route definitions
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── sockets/       # WebSocket handlers
│   │   └── utils/         # Shared utilities
│   └── tests/             # Unit & integration tests
│
└── frontend/     # Frontend SPA (can be deployed to CDN)
    └── src/
        ├── pages/         # Route components
        ├── components/    # Reusable UI components
        ├── contexts/      # React contexts
        └── services/      # API clients

infra/            # Infrastructure config
docs/             # Documentation
```

## Future Feature Roadmap

1. **Phase 2 - Enhanced Matching**
   - Integration with OpenRouteService for accurate routing
   - Machine learning for price optimization
   - Predictive arrival times

2. **Phase 3 - Payments**
   - Stripe integration
   - In-app wallet
   - Automatic fare splitting

3. **Phase 4 - Advanced Features**
   - Ride ratings & reviews
   - Driver verification
   - Scheduled recurring rides
   - Multi-stop rides

4. **Phase 5 - Mobile Apps**
   - React Native mobile apps
   - Push notifications
   - Offline mode

5. **Phase 6 - Analytics**
   - Admin dashboard
   - Revenue analytics
   - User behavior tracking
   - Heatmaps of popular routes
