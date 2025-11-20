#!/bin/bash

# Environment Variables Validation Script
echo "🔍 Validating Environment Variables..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend validation
echo "📦 Backend API (.env)"
echo "===================="

if [ -f "apps/api/.env" ]; then
    echo -e "${GREEN}✓${NC} apps/api/.env exists"
    
    # Check critical variables
    if grep -q "DATABASE_URL=" apps/api/.env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL is set"
    else
        echo -e "${RED}✗${NC} DATABASE_URL is missing"
    fi
    
    if grep -q "DIRECT_URL=" apps/api/.env; then
        echo -e "${GREEN}✓${NC} DIRECT_URL is set"
    else
        echo -e "${RED}✗${NC} DIRECT_URL is missing"
    fi
    
    if grep -q "JWT_SECRET=" apps/api/.env; then
        echo -e "${GREEN}✓${NC} JWT_SECRET is set"
    else
        echo -e "${RED}✗${NC} JWT_SECRET is missing"
    fi
    
    if grep -q "SMTP_HOST=" apps/api/.env; then
        echo -e "${GREEN}✓${NC} SMTP_HOST is set"
    else
        echo -e "${YELLOW}⚠${NC} SMTP_HOST is missing (will use Ethereal)"
    fi
    
    if grep -q "FRONTEND_URL=" apps/api/.env; then
        echo -e "${GREEN}✓${NC} FRONTEND_URL is set"
    else
        echo -e "${RED}✗${NC} FRONTEND_URL is missing"
    fi
    
    if grep -q "CORS_ORIGIN=" apps/api/.env; then
        echo -e "${GREEN}✓${NC} CORS_ORIGIN is set"
    else
        echo -e "${YELLOW}⚠${NC} CORS_ORIGIN is missing (will default to localhost:5173)"
    fi
else
    echo -e "${RED}✗${NC} apps/api/.env does not exist"
    echo "  Run: cp apps/api/.env.example apps/api/.env"
fi

echo ""
echo "🎨 Frontend (.env)"
echo "===================="

if [ -f "apps/frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} apps/frontend/.env exists"
    
    if grep -q "VITE_API_URL=" apps/frontend/.env; then
        echo -e "${GREEN}✓${NC} VITE_API_URL is set"
    else
        echo -e "${RED}✗${NC} VITE_API_URL is missing"
    fi
    
    if grep -q "VITE_WS_URL=" apps/frontend/.env; then
        echo -e "${GREEN}✓${NC} VITE_WS_URL is set"
    else
        echo -e "${YELLOW}⚠${NC} VITE_WS_URL is missing"
    fi
else
    echo -e "${RED}✗${NC} apps/frontend/.env does not exist"
    echo "  Run: cp apps/frontend/.env.example apps/frontend/.env"
fi

echo ""
echo "🔗 Integration Check"
echo "===================="

# Extract URLs
BACKEND_PORT=$(grep "PORT=" apps/api/.env 2>/dev/null | cut -d'=' -f2)
FRONTEND_URL=$(grep "FRONTEND_URL=" apps/api/.env 2>/dev/null | cut -d'=' -f2)
VITE_API_URL=$(grep "VITE_API_URL=" apps/frontend/.env 2>/dev/null | cut -d'=' -f2)
CORS_ORIGIN=$(grep "CORS_ORIGIN=" apps/api/.env 2>/dev/null | cut -d'=' -f2)

echo "Backend Port: ${BACKEND_PORT:-3000}"
echo "Frontend URL (in backend): ${FRONTEND_URL}"
echo "API URL (in frontend): ${VITE_API_URL}"
echo "CORS Origin: ${CORS_ORIGIN}"

if [ "$VITE_API_URL" = "http://localhost:${BACKEND_PORT:-3000}" ]; then
    echo -e "${GREEN}✓${NC} Frontend is pointing to correct backend"
else
    echo -e "${YELLOW}⚠${NC} Frontend API URL might be incorrect"
fi

if [ "$CORS_ORIGIN" = "$FRONTEND_URL" ]; then
    echo -e "${GREEN}✓${NC} CORS is configured correctly"
else
    echo -e "${YELLOW}⚠${NC} CORS origin might need adjustment"
fi

echo ""
echo "✅ Validation complete!"
