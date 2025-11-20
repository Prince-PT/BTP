# 🚀 Quick Deploy to Render (5 Steps)

**Total Time: ~30 minutes**

> **💡 Already using Neon database?**  
> Use the simplified guide: [`RENDER_WITH_NEON.md`](./RENDER_WITH_NEON.md) (Only 4 steps!)

## Prerequisites
- ✅ Code pushed to GitHub
- ✅ Render account (free): https://render.com

---

## Step 1: Create Database (5 min)

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - Name: `rideshare-db`
   - Region: Choose closest to you
   - Plan: **Free**
4. Click **Create Database**
5. **SAVE THIS**: Copy the **Internal Database URL** (starts with `postgresql://`)

---

## Step 2: Deploy Backend API (10 min)

1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   ```
   Name:          rideshare-api
   Root Dir:      apps/api
   Build:         npm install && npm run build
   Start:         npm start
   Plan:          Free
   ```

4. **Environment Variables** - Click **Add Environment Variable** for each:

   **Core Application (REQUIRED):**
   ```bash
   NODE_ENV=production
   PORT=3000
   ```

   **Database (REQUIRED - from Step 1):**
   ```bash
   DATABASE_URL=<paste Internal Database URL from Step 1>
   DIRECT_URL=<paste Internal Database URL from Step 1>
   ```

   **Authentication (REQUIRED):**
   ```bash
   JWT_SECRET=change-this-to-a-long-random-string-min-32-chars
   JWT_EXPIRES_IN=7d
   OTP_EXPIRY_MINUTES=5
   OTP_LENGTH=6
   ```

   **Email/SMTP (REQUIRED - Gmail example):**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   SMTP_FROM=RideShare <your-email@gmail.com>
   ```
   
   > **Get Gmail App Password:** 
   > 1. Enable 2FA: https://myaccount.google.com/security
   > 2. Create App Password: https://myaccount.google.com/apppasswords

   **CORS/Frontend (REQUIRED - temporary, will update in Step 4):**
   ```bash
   CORS_ORIGIN=*
   SOCKET_CORS_ORIGIN=*
   FRONTEND_URL=https://rideshare-frontend.onrender.com
   ```

   **Maps & Geocoding (REQUIRED - free OpenStreetMap):**
   ```bash
   MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   MAP_ATTRIBUTION=© OpenStreetMap contributors
   NOMINATIM_URL=https://nominatim.openstreetmap.org
   NOMINATIM_USER_AGENT=RideShareApp/1.0
   ```

   **Ride Matching & Pricing (REQUIRED):**
   ```bash
   MAX_OFFSET_KM=3
   MAX_EFFICIENCY_RATIO=0.3
   BASE_FARE=2.50
   RATE_PER_KM=1.20
   OFFSET_RATE_PER_KM=2.00
   ```

   **Security & Rate Limiting (OPTIONAL but recommended):**
   ```bash
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **Logging (OPTIONAL):**
   ```bash
   LOG_LEVEL=info
   ```

   **Feature Flags (OPTIONAL):**
   ```bash
   ENABLE_MOCK_PAYMENTS=true
   ENABLE_EMAIL_VERIFICATION=true
   ```

5. Click **Create Web Service**
6. Wait for deployment (~3-5 min)
7. **SAVE THIS**: Copy your API URL (like `https://rideshare-api-xxxx.onrender.com`)

### Run Database Migration:

Once deployed, click **Shell** tab and run:
```bash
npx prisma migrate deploy
```

---

## Step 3: Deploy Frontend (10 min)

1. Click **New +** → **Static Site**
2. Connect your GitHub repo
3. Configure:
   ```
   Name:          rideshare-frontend
   Root Dir:      apps/frontend
   Build:         npm install && npm run build
   Publish:       dist
   ```

4. **Environment Variables** - Add these:
   ```bash
   VITE_API_URL=<paste your API URL from Step 2>
   VITE_WS_URL=<paste your API URL from Step 2>
   VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   VITE_MAP_ATTRIBUTION=© OpenStreetMap contributors
   VITE_MAP_DEFAULT_ZOOM=13
   VITE_MAP_DEFAULT_CENTER_LAT=28.6139
   VITE_MAP_DEFAULT_CENTER_LNG=77.2090
   VITE_APP_NAME=RideShare
   VITE_APP_VERSION=1.0.0
   ```

5. Click **Create Static Site**
6. Wait for deployment (~2-3 min)
7. **SAVE THIS**: Copy your Frontend URL (like `https://rideshare-frontend.onrender.com`)

---

## Step 4: Update CORS (2 min)

1. Go back to your **API service** (rideshare-api)
2. Click **Environment** tab
3. Update these CORS variables with your actual frontend URL:
   ```bash
   CORS_ORIGIN=https://rideshare-frontend.onrender.com
   SOCKET_CORS_ORIGIN=https://rideshare-frontend.onrender.com
   FRONTEND_URL=https://rideshare-frontend.onrender.com
   ```
4. Service will auto-redeploy (~2 min)

---

## Step 5: Test Everything (5 min)

Visit your frontend URL and test:

- ✅ Landing page loads
- ✅ Sign up with email
- ✅ Receive OTP email
- ✅ Login works
- ✅ Map displays
- ✅ Rider flow works
- ✅ Driver flow works

**If anything fails:**
1. Check API logs: API Service → Logs tab
2. Check Frontend logs: Static Site → Logs tab
3. Open browser console (F12) for errors

---

## 🎉 You're Done!

**Your Live URLs:**
```
Frontend: https://rideshare-frontend.onrender.com
Backend:  https://rideshare-api.onrender.com
```

---

## ⚠️ Important Notes

### Free Tier Limitations:
- **Services sleep after 15 min of inactivity**
- First request after sleep = 30-60 sec delay
- Good for testing, upgrade for production

### Costs:
- Database: Free (1GB)
- Frontend: Free forever
- Backend: Free (with cold starts) or $7/month (always on)

### Keep Awake (Optional):
Use https://uptimerobot.com to ping your API every 14 minutes:
- Monitor: `https://rideshare-api.onrender.com/health`
- Interval: 14 minutes

---

## Next Steps

- [ ] Add custom domain
- [ ] Set up error monitoring (Sentry)
- [ ] Add analytics
- [ ] Upgrade to paid tier for production
- [ ] Set up database backups
- [ ] Configure CI/CD

---

## Need Help?

- 📖 **Full Guide**: See `RENDER_DEPLOYMENT_GUIDE.md`
- 📋 **Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- 🌐 **Render Docs**: https://render.com/docs
- 💬 **Community**: https://community.render.com

---

## Troubleshooting

### "Build failed"
- Check API logs for specific error
- Ensure all dependencies are installed
- Verify build command is correct

### "Cannot connect to database"
- Verify DATABASE_URL is correct
- Run migration: Shell → `npx prisma migrate deploy`
- Check database is "Available"

### Frontend blank page
- Check VITE_API_URL is correct
- Verify CORS_ORIGIN matches frontend URL
- Check browser console for errors

### Emails not sending
- Verify SMTP credentials
- For Gmail: Use App Password, not regular password
- Check API logs for email errors

---

**Pro Tip:** Bookmark your Render dashboard for easy access to logs and settings!

Good luck! 🚀
