#!/bin/bash

# Email Configuration Test Script
# This script helps you test your SMTP email configuration

echo "🔧 Email Configuration Test"
echo "============================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  Please configure your SMTP settings in .env file:"
    echo "   - For Gmail: Set SMTP_HOST, SMTP_USER, SMTP_PASS"
    echo "   - See EMAIL_SETUP_GUIDE.md for instructions"
    echo ""
    exit 1
fi

# Source .env file
export $(cat .env | grep -v '^#' | xargs)

echo "📧 Current Email Configuration:"
echo "==============================="
echo "SMTP_HOST: ${SMTP_HOST:-'Not set (using Ethereal)'}"
echo "SMTP_PORT: ${SMTP_PORT:-'Not set'}"
echo "SMTP_USER: ${SMTP_USER:-'Not set'}"
echo "SMTP_FROM: ${SMTP_FROM:-'Not set'}"
echo ""

if [ -z "$SMTP_HOST" ] || [ -z "$SMTP_USER" ] || [ -z "$SMTP_PASS" ]; then
    echo "⚠️  Warning: Real SMTP not configured"
    echo "📧 Emails will use Ethereal (preview URLs only)"
    echo ""
    echo "To send REAL emails, configure SMTP in .env:"
    echo ""
    echo "For Gmail (Easiest):"
    echo "  1. Enable 2FA: https://myaccount.google.com/security"
    echo "  2. Create App Password: https://myaccount.google.com/apppasswords"
    echo "  3. Add to .env:"
    echo "     SMTP_HOST=smtp.gmail.com"
    echo "     SMTP_PORT=587"
    echo "     SMTP_USER=your-email@gmail.com"
    echo "     SMTP_PASS=your-app-password"
    echo ""
    echo "📖 See EMAIL_SETUP_GUIDE.md for more options"
else
    echo "✅ Real SMTP configured!"
    echo "📧 Emails will be sent to actual inboxes"
fi

echo ""
echo "🚀 Starting server..."
echo ""

# Start the API server
cd apps/api && npm run dev
