#!/bin/bash

# 🚀 Neon PostgreSQL Migration Script
# This script helps you migrate from local PostgreSQL to Neon

set -e

echo "🚀 Neon PostgreSQL Migration Helper"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Before you begin:${NC}"
echo "1. Create a Neon account at https://neon.tech"
echo "2. Create a new project"
echo "3. Copy your connection string"
echo ""

# Check if Neon connection string is provided
echo -e "${YELLOW}🔗 Please paste your Neon connection string:${NC}"
echo "Example: postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
echo ""
read -p "Connection string: " NEON_URL

if [ -z "$NEON_URL" ]; then
    echo -e "${RED}❌ Error: Connection string cannot be empty${NC}"
    exit 1
fi

# Validate connection string format
if [[ ! "$NEON_URL" =~ ^postgresql:// ]]; then
    echo -e "${RED}❌ Error: Invalid connection string format${NC}"
    echo "It should start with 'postgresql://'"
    exit 1
fi

# Ensure sslmode=require is present
if [[ ! "$NEON_URL" =~ sslmode=require ]]; then
    echo -e "${YELLOW}⚠️  Warning: Adding sslmode=require to connection string${NC}"
    if [[ "$NEON_URL" =~ \? ]]; then
        NEON_URL="${NEON_URL}&sslmode=require"
    else
        NEON_URL="${NEON_URL}?sslmode=require"
    fi
fi

echo ""
echo -e "${GREEN}✓ Connection string validated${NC}"
echo ""

# Backup existing .env files
echo -e "${YELLOW}📦 Backing up existing .env files...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -f ".env" ]; then
    cp .env ".env.backup.$TIMESTAMP"
    echo -e "${GREEN}✓ Backed up .env to .env.backup.$TIMESTAMP${NC}"
fi

if [ -f "apps/api/.env" ]; then
    cp apps/api/.env "apps/api/.env.backup.$TIMESTAMP"
    echo -e "${GREEN}✓ Backed up apps/api/.env to apps/api/.env.backup.$TIMESTAMP${NC}"
fi

echo ""

# Update DATABASE_URL in root .env
echo -e "${YELLOW}📝 Updating .env files...${NC}"

if [ -f ".env" ]; then
    # Check if DATABASE_URL exists
    if grep -q "^DATABASE_URL=" .env; then
        # Update existing DATABASE_URL
        sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL=\"$NEON_URL\"|" .env
        rm -f .env.tmp
        echo -e "${GREEN}✓ Updated DATABASE_URL in .env${NC}"
    else
        # Add DATABASE_URL
        echo "" >> .env
        echo "# Neon PostgreSQL (added by migration script)" >> .env
        echo "DATABASE_URL=\"$NEON_URL\"" >> .env
        echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
    fi
fi

# Update DATABASE_URL in apps/api/.env
if [ -f "apps/api/.env" ]; then
    if grep -q "^DATABASE_URL=" apps/api/.env; then
        sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL=\"$NEON_URL\"|" apps/api/.env
        rm -f apps/api/.env.tmp
        echo -e "${GREEN}✓ Updated DATABASE_URL in apps/api/.env${NC}"
    else
        echo "" >> apps/api/.env
        echo "# Neon PostgreSQL (added by migration script)" >> apps/api/.env
        echo "DATABASE_URL=\"$NEON_URL\"" >> apps/api/.env
        echo -e "${GREEN}✓ Added DATABASE_URL to apps/api/.env${NC}"
    fi
else
    # Create apps/api/.env if it doesn't exist
    cp .env apps/api/.env
    echo -e "${GREEN}✓ Created apps/api/.env${NC}"
fi

echo ""

# Navigate to API directory
cd apps/api

# Test connection
echo -e "${YELLOW}🔌 Testing Neon connection...${NC}"
if npx prisma db execute --stdin < /dev/null 2>&1 | grep -q "Can't reach database server"; then
    echo -e "${RED}❌ Failed to connect to Neon database${NC}"
    echo "Please check your connection string and try again"
    exit 1
fi

echo -e "${GREEN}✓ Successfully connected to Neon!${NC}"
echo ""

# Ask if user wants to run migrations
echo -e "${YELLOW}📊 Do you want to push your Prisma schema to Neon now?${NC}"
echo "This will create all tables in your Neon database."
read -p "Push schema? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🚀 Pushing Prisma schema to Neon...${NC}"
    npx prisma db push
    echo -e "${GREEN}✓ Schema pushed successfully!${NC}"
    echo ""
    
    # Ask about seeding
    if [ -f "prisma/seed.ts" ]; then
        echo -e "${YELLOW}🌱 Seed file found. Do you want to seed the database?${NC}"
        read -p "Run seed? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}🌱 Seeding database...${NC}"
            npx prisma db seed
            echo -e "${GREEN}✓ Database seeded successfully!${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ Migration to Neon PostgreSQL complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "  1. Start your API: cd apps/api && npm run dev"
echo "  2. Test your endpoints"
echo "  3. Open Prisma Studio: npx prisma studio"
echo "  4. Check Neon dashboard: https://console.neon.tech"
echo ""
echo "💾 Your old .env files are backed up as .env.backup.$TIMESTAMP"
echo ""
