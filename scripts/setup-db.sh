#!/bin/bash

# Setup script for local PostgreSQL database
# This creates the database and user for the ride-sharing application

echo "🔧 Setting up PostgreSQL database for ride-sharing app..."

# Create database and user
psql -d postgres << EOF
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE rideshare_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rideshare_db')\gexec

-- Connect to the database
\c rideshare_db

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user if it doesn't exist
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'rideshare') THEN
    CREATE USER rideshare WITH PASSWORD 'rideshare123';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE rideshare_db TO rideshare;
GRANT ALL ON SCHEMA public TO rideshare;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rideshare;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rideshare;

EOF

echo "✅ Database setup complete!"
echo ""
echo "Database: rideshare_db"
echo "User: rideshare"
echo "Password: rideshare123"
echo ""
echo "Connection URL: postgresql://rideshare:rideshare123@localhost:5432/rideshare_db"
