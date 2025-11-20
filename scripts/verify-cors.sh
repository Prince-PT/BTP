#!/bin/bash

# CORS Verification Script
# This script helps verify your CORS configuration is working

echo "🔍 CORS Configuration Verification"
echo "===================================="
echo ""

BACKEND_URL="https://rideshare-api-fh4j.onrender.com"
FRONTEND_URL="https://btp-a2jl.onrender.com"

echo "📋 Configuration:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is not responding"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: CORS Preflight
echo "2️⃣  Testing CORS Preflight (OPTIONS)..."
echo "   Checking /api/auth/request-otp endpoint..."

CORS_RESPONSE=$(curl -i -s -X OPTIONS \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  "$BACKEND_URL/api/auth/request-otp")

echo "$CORS_RESPONSE" | head -20

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin: $FRONTEND_URL"; then
    echo "   ✅ CORS origin header is correct"
elif echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin: \*"; then
    echo "   ❌ CORS is using wildcard (*) - THIS IS THE PROBLEM!"
    echo "   Fix: Set CORS_ORIGIN=$FRONTEND_URL in backend env"
else
    echo "   ❌ No CORS header found"
fi

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Credentials: true"; then
    echo "   ✅ Credentials allowed"
else
    echo "   ⚠️  Credentials not allowed"
fi

echo ""

# Test 3: POST Request
echo "3️⃣  Testing Actual POST Request..."
POST_RESPONSE=$(curl -i -s -X POST \
  -H "Origin: $FRONTEND_URL" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  "$BACKEND_URL/api/auth/request-otp")

echo "$POST_RESPONSE" | head -20

if echo "$POST_RESPONSE" | grep -q "Access-Control-Allow-Origin: $FRONTEND_URL"; then
    echo "   ✅ POST request returns correct CORS header"
else
    echo "   ❌ POST request CORS header missing or incorrect"
fi

echo ""
echo "===================================="
echo ""

# Summary
echo "📝 Summary & Next Steps:"
echo ""
echo "If you see ❌ errors above:"
echo ""
echo "1. Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "2. Click on 'rideshare-api-fh4j' service"
echo ""
echo "3. Click 'Environment' → Add/Update:"
echo "   CORS_ORIGIN = $FRONTEND_URL"
echo ""
echo "4. Wait for auto-redeploy (2-3 minutes)"
echo ""
echo "5. Run this script again to verify"
echo ""
echo "If you see ✅ all green:"
echo "   Your CORS is configured correctly!"
echo "   Try your app again and hard-refresh browser (Cmd+Shift+R)"
echo ""
