# Complete Render Deployment Guide

This guide will walk you through deploying your ride-sharing application to Render.com.

## Overview

Your application consists of:
1. **Backend API** (Node.js/Express + Prisma + Socket.IO)
2. **Frontend** (React + Vite)
3. **Database** (PostgreSQL)

## Prerequisites

- [ ] GitHub account with your code pushed to a repository
- [ ] Render account (sign up at https://render.com)
- [ ] Email service credentials (Gmail App Password or Brevo/SendGrid)

---

## Part 1: Database Setup (PostgreSQL)

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard: https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `rideshare-db` (or your preferred name)
   - **Database**: `rideshare_db`
   - **User**: `rideshare` (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **"Create Database"**
5. Wait for database to provision (1-2 minutes)

### Step 2: Save Database Credentials

Once created, you'll see:
- **Internal Database URL**: Use this for your API service
- **External Database URL**: Use for local connections/migrations

Copy the **Internal Database URL** - it looks like:
```
postgresql://rideshare:xxxxxxxxxxxx@dpg-xxxxx-a/rideshare_db
```

Also note the **External Database URL** for running migrations.

---

## Part 2: Backend API Deployment

### Step 1: Prepare Backend for Deployment

Create a build script that includes Prisma generation:

**File: `apps/api/package.json`**

Make sure your scripts include:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "prisma generate && tsc",
    "start": "node dist/index.js",
    "postinstall": "prisma generate"
  }
}
```

### Step 2: Create Web Service for API

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `rideshare-api`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid)

### Step 3: Configure Environment Variables

Click **"Environment"** tab and add these variables:

```bash
# Node Environment
NODE_ENV=production

# Database (use Internal Database URL from Step 1.2)
DATABASE_URL=postgresql://rideshare:xxxxxxxxxxxx@dpg-xxxxx-a/rideshare_db
DIRECT_URL=postgresql://rideshare:xxxxxxxxxxxx@dpg-xxxxx-a/rideshare_db

# JWT Authentication (CHANGE THESE!)
JWT_SECRET=your-strong-random-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6

# CORS - Will update after frontend deployment
CORS_ORIGIN=https://your-frontend-url.onrender.com

# Email Configuration (Choose one option below)

# Option A: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=RideShare <your-email@gmail.com>

# Option B: Brevo (formerly Sendinblue)
# SMTP_HOST=smtp-relay.brevo.com
# SMTP_PORT=587
# SMTP_USER=your-brevo-email
# SMTP_PASS=your-brevo-smtp-key
# SMTP_FROM=RideShare <your-brevo-email>

# Option C: SendGrid
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your-sendgrid-api-key
# SMTP_FROM=RideShare <verified-sender@yourdomain.com>
```

### Step 4: Run Database Migrations

After the service deploys successfully:

1. Go to your API service in Render
2. Click **"Shell"** tab (left sidebar)
3. Run migration command:
```bash
npx prisma migrate deploy
```

Or connect from your local machine using the External Database URL:
```bash
cd apps/api
DATABASE_URL="external-database-url-here" npx prisma migrate deploy
```

### Step 5: Get Your API URL

Once deployed, copy your API URL:
```
https://rideshare-api.onrender.com
```

---

## Part 3: Frontend Deployment

### Step 1: Create Static Site for Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `rideshare-frontend`
   - **Branch**: `main`
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Step 2: Configure Frontend Environment Variables

Click **"Environment"** tab and add:

```bash
# API URL (use your actual API URL from Part 2, Step 5)
VITE_API_URL=https://rideshare-api.onrender.com

# WebSocket URL (same as API URL)
VITE_WS_URL=https://rideshare-api.onrender.com

# Map Configuration
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=© OpenStreetMap contributors
VITE_MAP_DEFAULT_ZOOM=13
VITE_MAP_DEFAULT_CENTER_LAT=28.6139
VITE_MAP_DEFAULT_CENTER_LNG=77.2090

# App Info
VITE_APP_NAME=RideShare
VITE_APP_VERSION=1.0.0
```

### Step 3: Update CORS in Backend

1. Go back to your **API service** in Render
2. Click **"Environment"** tab
3. Update `CORS_ORIGIN` to your frontend URL:
```bash
CORS_ORIGIN=https://rideshare-frontend.onrender.com
```
4. The service will auto-redeploy

### Step 4: Configure Redirects for SPA

Create this file in `apps/frontend/public/`:

**File: `apps/frontend/public/_redirects`**
```
/*    /index.html   200
```

This ensures React Router works properly with direct URL access.

---

## Part 4: Verification & Testing

### Step 1: Check Deployment Status

- ✅ Database: Should show "Available"
- ✅ API: Should show "Live" with green indicator
- ✅ Frontend: Should show "Live" with green indicator

### Step 2: Test Your Application

1. Visit your frontend URL: `https://rideshare-frontend.onrender.com`
2. Test the following:
   - [ ] Landing page loads
   - [ ] Login/Sign up with OTP works
   - [ ] Email OTP is received
   - [ ] Map displays correctly
   - [ ] Rider flow works
   - [ ] Driver flow works
   - [ ] Real-time updates work (Socket.IO)

### Step 3: Check Logs

If something doesn't work:

**API Logs:**
1. Go to API service → **"Logs"** tab
2. Check for errors

**Frontend Logs:**
1. Go to Static Site → **"Logs"** tab
2. Check build logs

**Database Logs:**
1. Go to PostgreSQL → **"Logs"** tab

---

## Part 5: Custom Domain (Optional)

### For Frontend:
1. Go to your Static Site → **"Settings"**
2. Scroll to **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Follow instructions to update DNS records

### For API:
1. Go to your Web Service → **"Settings"**
2. Add custom domain (e.g., `api.yourdomain.com`)
3. Update `VITE_API_URL` in frontend environment variables
4. Update `CORS_ORIGIN` in API environment variables

---

## Important Notes

### 🚨 Free Tier Limitations

Render's free tier has some limitations:

1. **Services spin down after 15 minutes of inactivity**
   - First request after sleep takes 30-60 seconds
   - Consider upgrading to paid plan for production

2. **750 hours/month free** (shared across all services)
   - Database: Always running = ~720 hours/month
   - API: ~30 hours remaining for free tier
   - Solution: Upgrade API to paid ($7/month)

3. **Database storage**: 1 GB free
   - Should be enough for testing/small apps

### 🔒 Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use real email service (not Ethereal)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review CORS settings
- [ ] Set up proper error logging
- [ ] Add rate limiting (already in code)

### 🔄 Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. Make changes locally
2. Commit and push to GitHub
3. Render automatically builds and deploys
4. Monitor deployment in Render dashboard

### 📊 Monitoring

**API Health Check:**
```
https://rideshare-api.onrender.com/health
```

**Check Logs:**
- API: Service → Logs
- Frontend: Static Site → Logs  
- Database: PostgreSQL → Logs

---

## Troubleshooting

### Issue: API shows "Build failed"

**Solutions:**
1. Check build logs for errors
2. Ensure `apps/api/package.json` has correct build script
3. Verify all dependencies are in `dependencies`, not `devDependencies`

### Issue: "Cannot connect to database"

**Solutions:**
1. Verify `DATABASE_URL` is the Internal URL
2. Check database is in "Available" state
3. Ensure database and API are in same region
4. Run migrations: `npx prisma migrate deploy`

### Issue: Frontend shows blank page

**Solutions:**
1. Check browser console for errors
2. Verify `VITE_API_URL` is correct
3. Check CORS settings on API
4. Ensure `_redirects` file exists in `public/`

### Issue: Socket.IO not connecting

**Solutions:**
1. Verify WebSocket URL matches API URL
2. Check CORS includes Socket.IO origins
3. Ensure API is using HTTPS (not HTTP)
4. Check browser console for connection errors

### Issue: Emails not sending

**Solutions:**
1. Verify SMTP credentials are correct
2. For Gmail: Use App Password, not account password
3. Check API logs for email errors
4. Test email service separately

### Issue: First request very slow

**Explanation:** Free tier services sleep after inactivity
**Solutions:**
1. Upgrade to paid tier ($7/month minimum)
2. Use a service like UptimeRobot to ping your API every 14 minutes
3. Accept the cold start delay for development/testing

---

## Upgrade to Production

When ready for production:

1. **Database**: Upgrade to paid plan ($7/month+)
2. **API**: Upgrade to paid plan ($7/month+)
3. **Frontend**: Remains free (or paid for custom domain)
4. **Custom Domain**: Add your domain
5. **Monitoring**: Set up error tracking (Sentry, LogRocket)
6. **Backups**: Enable automated database backups

---

## Quick Reference

### Your URLs
```
Frontend: https://rideshare-frontend.onrender.com
API:      https://rideshare-api.onrender.com
Database: Internal URL only
```

### Quick Commands

**Local Migration:**
```bash
cd apps/api
DATABASE_URL="your-external-db-url" npx prisma migrate deploy
```

**Seed Database:**
```bash
cd apps/api
DATABASE_URL="your-external-db-url" npm run prisma:seed
```

**View Schema:**
```bash
cd apps/api
DATABASE_URL="your-external-db-url" npx prisma studio
```

---

## Support Resources

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Prisma Docs: https://www.prisma.io/docs
- Socket.IO Docs: https://socket.io/docs/v4/

---

## Next Steps

After successful deployment:

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domains
4. ✅ Set up CI/CD pipelines
5. ✅ Implement proper error tracking
6. ✅ Add analytics
7. ✅ Plan for scaling

Good luck with your deployment! 🚀
