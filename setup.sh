#!/bin/bash

echo "🚀 Setting up Campus Rideshare Application..."
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first."
    echo "On macOS: brew install postgresql@14"
    echo "On Ubuntu: sudo apt-get install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Database setup
echo "📦 Setting up database..."
echo "Please enter your PostgreSQL username (default: postgres):"
read -r DB_USER
DB_USER=${DB_USER:-postgres}

# Create database
echo "Creating database 'campus_rideshare'..."
psql -U "$DB_USER" -c "CREATE DATABASE campus_rideshare;" 2>/dev/null || echo "Database might already exist"

echo ""
echo "✅ Database setup complete"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend || exit

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env 2>/dev/null || cat > .env << EOF
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=$DB_USER
DB_PASSWORD=
DB_DATABASE=campus_rideshare

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
EOF
    echo "✅ Backend .env created"
else
    echo "⚠️  .env already exists, skipping..."
fi

echo "Installing backend dependencies..."
npm install

echo ""
echo "✅ Backend setup complete"
echo ""

# Frontend setup
echo "🎨 Setting up frontend..."
cd ../frontend || exit

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF
    echo "✅ Frontend .env.local created"
else
    echo "⚠️  .env.local already exists, skipping..."
fi

echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📝 Demo credentials:"
echo "   - Phone: Any 10-digit number"
echo "   - OTP: 123456"
echo ""
echo "Happy coding! 🚀"
