# 🚗 CampusCommute - Campus Ride Sharing Platform

A modern, full-stack ride-sharing application designed for campus communities with real-time tracking, dynamic pricing, and shared ride capabilities.

## 🌟 Features

- **Smart Ride Matching**: AI-powered algorithm matches riders with drivers
- **Shared Rides**: Split costs with other passengers going the same direction
- **Real-time Tracking**: Live GPS tracking with Socket.IO
- **Dynamic Pricing**: Fare automatically adjusts based on passengers and distance
- **Role-based Access**: Separate dashboards for riders and drivers
- **Secure Authentication**: JWT-based auth with email OTP verification
- **Modern UI**: Beautiful dark-themed interface built with React & Tailwind CSS

## 🏗️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time updates
- **React Router** for navigation
- **Leaflet** for interactive maps

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma ORM** with PostgreSQL
- **Socket.IO** for WebSocket connections
- **JWT** for authentication
- **Winston** for logging

### Infrastructure
- **PostgreSQL** database
- **Docker & Docker Compose** for containerization
- **Nominatim** for geocoding

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Docker & Docker Compose** (optional, for containerized setup)

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/Prince-PT/BTP.git
cd BTP
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/frontend
npm install

# Install backend dependencies
cd ../api
npm install

# Go back to root
cd ../..
\`\`\`

### 3. Set Up Environment Variables

Create \`.env\` file in \`apps/api/\`:

\`\`\`bash
cp .env.example apps/api/.env
\`\`\`

Edit \`apps/api/.env\` with your settings:

\`\`\`env
# Database
DATABASE_URL="postgresql://rideshare:rideshare123@localhost:5432/rideshare_db"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration (Optional - for OTP emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="CampusCommute <noreply@campuscommute.com>"

# Server
PORT=3000
NODE_ENV="development"
\`\`\`

### 4. Set Up the Database

#### Option A: Using Docker (Recommended)

\`\`\`bash
# Start PostgreSQL with Docker Compose
docker-compose up -d

# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Run migrations
cd apps/api
npx prisma migrate deploy

# Seed the database (optional - creates test users)
npx prisma db seed

cd ../..
\`\`\`

#### Option B: Using Local PostgreSQL

\`\`\`bash
# Create database
createdb rideshare_db

# Or use psql
psql -U postgres
CREATE DATABASE rideshare_db;
\\q

# Update DATABASE_URL in apps/api/.env to match your PostgreSQL setup

# Run migrations
cd apps/api
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed

cd ../..
\`\`\`

### 5. Start the Development Servers

#### Option 1: Using Concurrent Script (from root)

\`\`\`bash
npm run dev
\`\`\`

This will start both frontend (port 5173) and backend (port 3000) concurrently.

#### Option 2: Manual Start (separate terminals)

**Terminal 1 - Backend:**
\`\`\`bash
cd apps/api
npm run dev
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
cd apps/frontend
npm run dev
\`\`\`

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

## 👥 Test Accounts (After Seeding)

### Drivers
- Email: \`driver1@campuscommute.dev\`
- Email: \`driver2@campuscommute.dev\`

### Riders
- Email: \`rider1@campuscommute.dev\`
- Email: \`rider2@campuscommute.dev\`

**Note**: In development mode, the OTP code is logged to console instead of being emailed.

## 📁 Project Structure

\`\`\`
BTP/
├── apps/
│   ├── api/                 # Backend Express API
│   │   ├── prisma/          # Database schema & migrations
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── sockets/     # WebSocket handlers
│   │   │   └── utils/       # Utilities
│   │   └── package.json
│   │
│   └── frontend/            # React Frontend
│       ├── src/
│       │   ├── components/  # Reusable components
│       │   ├── contexts/    # React contexts
│       │   ├── pages/       # Page components
│       │   ├── services/    # API client
│       │   └── styles/      # Global styles
│       └── package.json
│
├── docs/                    # Documentation
├── infra/                   # Infrastructure files
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Docker setup
└── package.json            # Root package.json
\`\`\`

## 🛠️ Available Scripts

### Root Directory
- \`npm run dev\` - Start both frontend and backend
- \`npm run build\` - Build both applications
- \`npm run clean\` - Clean all node_modules and build artifacts

### Frontend (\`apps/frontend\`)
- \`npm run dev\` - Start Vite dev server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

### Backend (\`apps/api\`)
- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Compile TypeScript
- \`npm run start\` - Start production server
- \`npm run prisma:migrate\` - Run database migrations
- \`npm run prisma:studio\` - Open Prisma Studio
- \`npm run test\` - Run tests

## 🗃️ Database Management

### Run Migrations
\`\`\`bash
cd apps/api
npx prisma migrate dev --name migration_name
\`\`\`

### Reset Database
\`\`\`bash
cd apps/api
npx prisma migrate reset
\`\`\`

### Open Prisma Studio
\`\`\`bash
cd apps/api
npx prisma studio
\`\`\`

## 🐛 Troubleshooting

### Port Already in Use
\`\`\`bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
\`\`\`

### Database Connection Issues
\`\`\`bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# View PostgreSQL logs
docker-compose logs postgres
\`\`\`

### Clear Application Data
\`\`\`bash
cd apps/api
psql -U rideshare -d rideshare_db -f ../../scripts/clear-data.sql
\`\`\`

## 📚 API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## 🏛️ Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture details.

## 🧪 Testing

\`\`\`bash
# Run backend tests
cd apps/api
npm test

# Run with coverage
npm run test:coverage
\`\`\`

## 🚢 Deployment

### Deploy to Render (Recommended)

🚀 **Quick Deploy** (30 minutes):
1. Read **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** for step-by-step instructions
2. Follow **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** to track progress

📚 **Complete Guides:**
- **[DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)** - Overview & cost breakdown
- **[RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)** - Comprehensive guide
- **[render.yaml](render.yaml)** - Infrastructure as Code (one-click deploy)

**What you'll deploy:**
- ✅ PostgreSQL Database (Free tier: 1GB)
- ✅ Backend API (Node.js + Express + Socket.IO)
- ✅ Frontend (React + Vite static site)

**Free Tier Total Cost:** $0/month (with cold starts)
**Production Cost:** ~$14/month (no cold starts)

### Other Deployment Options

<details>
<summary>Manual Production Build</summary>

\`\`\`bash
# Build frontend
cd apps/frontend
npm run build

# Build backend
cd ../api
npm run build

# Start production server
npm start
\`\`\`

### Environment Variables for Production

Ensure these are set in production:
- \`NODE_ENV=production\`
- \`DATABASE_URL\` - Production database URL
- \`JWT_SECRET\` - Strong secret key
- \`SMTP_*\` - Email service credentials
- \`CORS_ORIGIN\` - Your frontend URL

</details>

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Authors

- Prince PT - Initial work

## 🙏 Acknowledgments

- OpenStreetMap for geocoding services
- Leaflet for mapping
- All contributors and testers

---

**Happy Riding! 🚗💨**
