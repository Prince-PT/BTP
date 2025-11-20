-- PostgreSQL 18 Initialization Script
-- This script runs automatically when the container is first created

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Enable PostGIS for advanced geospatial queries
-- Uncomment if needed in the future
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Create initial schema (Prisma will manage tables)
-- This file is mainly for extensions and initial setup
