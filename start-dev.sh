#!/bin/bash

# 🚀 Campus Rideshare - Development Server Launcher
# This script starts both backend and frontend servers

echo "🚀 Starting Campus Rideshare Development Servers..."
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running!"
    echo "   Starting PostgreSQL..."
    brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null
    sleep 2
    
    if ! pg_isready -q; then
        echo "⚠️  Could not start PostgreSQL automatically"
        echo "   Please start it manually: brew services start postgresql"
        exit 1
    fi
fi
echo "✅ PostgreSQL is running"
echo ""

# Check if database exists
echo "🗄️  Checking database..."
DB_EXISTS=$(psql -U postgres -lqt | cut -d \| -f 1 | grep -w campus_rideshare)
if [ -z "$DB_EXISTS" ]; then
    echo "📦 Creating campus_rideshare database..."
    createdb -U postgres campus_rideshare 2>/dev/null || psql -U postgres -c "CREATE DATABASE campus_rideshare;"
    echo "✅ Database created"
else
    echo "✅ Database exists"
fi
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting Backend Server..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend starting on http://localhost:5000 (PID: $BACKEND_PID)"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Start frontend
echo "🎨 Starting Frontend Server..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend starting on http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 5

# Display status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Campus Rideshare is Running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:5000"
echo "🏥 Health:    http://localhost:5000/health"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f $SCRIPT_DIR/backend/backend.log"
echo "   Frontend: tail -f $SCRIPT_DIR/frontend/frontend.log"
echo ""
echo "🧪 Test Login:"
echo "   Phone: Any 10-digit number"
echo "   OTP: 123456"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep script running
wait
