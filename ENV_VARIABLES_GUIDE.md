# 🔐 Complete Environment Variables Guide for Render Deployment

This guide covers **ALL** environment variables needed for deploying to Render.

---

## 📋 Quick Checklist

Use this checklist when configuring your Render services:

- [ ] **Core Application** (2 variables)
- [ ] **Database** (2 variables)
- [ ] **Authentication** (4 variables)
- [ ] **Email/SMTP** (5 variables)
- [ ] **CORS/Frontend** (3 variables)
- [ ] **Maps & Geocoding** (4 variables)
- [ ] **Ride Matching & Pricing** (5 variables)
- [ ] **Security & Rate Limiting** (2 variables - optional)
- [ ] **Logging** (1 variable - optional)
- [ ] **Feature Flags** (2 variables - optional)

**Total: 30 variables** (20 required + 10 optional)

---

## 1️⃣ Core Application Variables

### `NODE_ENV` (REQUIRED)
- **Value:** `production`
- **Purpose:** Tells the app it's running in production mode
- **Effect:** Disables debug logs, enables optimizations

### `PORT` (REQUIRED)
- **Value:** `3000`
- **Purpose:** Port the backend server listens on
- **Note:** Render may override this, but set it anyway

**Example:**
```bash
NODE_ENV=production
PORT=3000
```

---

## 2️⃣ Database Variables

### `DATABASE_URL` (REQUIRED)
- **Value:** Your Neon or Render PostgreSQL connection string
- **Format:** `postgresql://user:password@host/database?sslmode=require`
- **Purpose:** Main database connection for queries
- **For Neon:** Use the pooled connection string
- **For Render PostgreSQL:** Use the Internal Database URL

### `DIRECT_URL` (REQUIRED)
- **Value:** Direct connection to database (same as DATABASE_URL for Neon)
- **Format:** `postgresql://user:password@host/database?sslmode=require`
- **Purpose:** Used for Prisma migrations
- **For Neon:** Use direct connection (without -pooler)
- **For Render PostgreSQL:** Use the Internal Database URL

**Example (Neon):**
```bash
DATABASE_URL=postgresql://neondb_owner:xxxxx@ep-xxxxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Example (Render PostgreSQL):**
```bash
DATABASE_URL=postgresql://rideshare:xxxxx@dpg-xxxxx-a/rideshare_db
DIRECT_URL=postgresql://rideshare:xxxxx@dpg-xxxxx-a/rideshare_db
```

---

## 3️⃣ Authentication Variables

### `JWT_SECRET` (REQUIRED)
- **Value:** A strong random string (minimum 32 characters)
- **Purpose:** Signs JWT tokens for user authentication
- **Security:** NEVER use the default value in production!
- **Generate:** `openssl rand -base64 32`

### `JWT_EXPIRES_IN` (REQUIRED)
- **Value:** `7d` (7 days)
- **Purpose:** How long JWT tokens remain valid
- **Options:** `1h` (1 hour), `1d` (1 day), `7d` (7 days), `30d` (30 days)

### `OTP_EXPIRY_MINUTES` (REQUIRED)
- **Value:** `5`
- **Purpose:** How long OTP codes are valid (in minutes)
- **Recommendation:** 5-10 minutes for security

### `OTP_LENGTH` (REQUIRED)
- **Value:** `6`
- **Purpose:** Length of OTP code
- **Recommendation:** 6 digits is standard

**Example:**
```bash
JWT_SECRET=your-super-strong-random-secret-min-32-characters-long
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6
```

**Generate a strong JWT secret:**
```bash
openssl rand -base64 32
# Example output: kJ8vN3mP9qR2sT5uV6wX7yZ8aB1cD2eF3gH4iJ5kL6m=
```

---

## 4️⃣ Email/SMTP Variables

### `SMTP_HOST` (REQUIRED)
- **Value:** Your email provider's SMTP host
- **Gmail:** `smtp.gmail.com`
- **Brevo:** `smtp-relay.brevo.com`
- **SendGrid:** `smtp.sendgrid.net`
- **Mailgun:** `smtp.mailgun.org`

### `SMTP_PORT` (REQUIRED)
- **Value:** `587` (TLS) or `465` (SSL)
- **Recommendation:** Use `587` for most providers

### `SMTP_USER` (REQUIRED)
- **Value:** Your email username
- **Gmail:** Your full email address
- **SendGrid:** `apikey`
- **Others:** Check provider docs

### `SMTP_PASS` (REQUIRED)
- **Value:** Your email password or API key
- **Gmail:** Use App Password (NOT your regular password!)
- **Others:** Use SMTP password or API key

### `SMTP_FROM` (REQUIRED)
- **Value:** Sender email and name
- **Format:** `"App Name <email@domain.com>"`
- **Example:** `"RideShare <noreply@rideshare.com>"`

**Example (Gmail):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=RideShare <your-email@gmail.com>
```

**Example (Brevo):**
```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM=RideShare <noreply@yourdomain.com>
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Create app password for "Mail"
5. Copy the 16-character password

---

## 5️⃣ CORS/Frontend Variables

### `CORS_ORIGIN` (REQUIRED)
- **Value:** Your frontend URL
- **Initially:** `*` (allow all origins for testing)
- **After deployment:** `https://your-frontend.onrender.com`
- **Purpose:** Allows frontend to make API requests

### `SOCKET_CORS_ORIGIN` (REQUIRED)
- **Value:** Same as CORS_ORIGIN
- **Purpose:** Allows WebSocket connections from frontend
- **Must match:** Frontend URL exactly

### `FRONTEND_URL` (REQUIRED)
- **Value:** Your frontend URL
- **Purpose:** Used for email links and redirects
- **Must include:** `https://` protocol

**Example (initial setup):**
```bash
CORS_ORIGIN=*
SOCKET_CORS_ORIGIN=*
FRONTEND_URL=https://rideshare-frontend.onrender.com
```

**Example (after frontend deployment):**
```bash
CORS_ORIGIN=https://rideshare-frontend.onrender.com
SOCKET_CORS_ORIGIN=https://rideshare-frontend.onrender.com
FRONTEND_URL=https://rideshare-frontend.onrender.com
```

**For custom domain:**
```bash
CORS_ORIGIN=https://app.yourdomain.com
SOCKET_CORS_ORIGIN=https://app.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
```

---

## 6️⃣ Maps & Geocoding Variables

### `MAP_TILE_URL` (REQUIRED)
- **Value:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Purpose:** Map tiles for displaying maps
- **Provider:** OpenStreetMap (free, no API key)
- **Alternative:** Use Mapbox or Google Maps (requires API key)

### `MAP_ATTRIBUTION` (REQUIRED)
- **Value:** `© OpenStreetMap contributors`
- **Purpose:** Legal attribution for map data
- **Required by:** OpenStreetMap terms of service

### `NOMINATIM_URL` (REQUIRED)
- **Value:** `https://nominatim.openstreetmap.org`
- **Purpose:** Geocoding service (address → coordinates)
- **Free:** Yes, but please add user agent
- **Alternative:** Use Google Geocoding API (paid)

### `NOMINATIM_USER_AGENT` (REQUIRED)
- **Value:** `RideShareApp/1.0`
- **Purpose:** Identifies your app to Nominatim
- **Required by:** Nominatim usage policy
- **Format:** `AppName/Version`

**Example:**
```bash
MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
MAP_ATTRIBUTION=© OpenStreetMap contributors
NOMINATIM_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=RideShareApp/1.0
```

**Note:** These are free services with usage limits. For production with high traffic, consider:
- **Mapbox:** https://www.mapbox.com (free tier: 50k requests/month)
- **Google Maps:** https://cloud.google.com/maps-platform (free tier: $200 credit/month)

---

## 7️⃣ Ride Matching & Pricing Variables

### `MAX_OFFSET_KM` (REQUIRED)
- **Value:** `3` (kilometers)
- **Purpose:** Maximum detour distance for shared rides
- **Meaning:** Driver can detour max 3km to pick up additional passengers
- **Recommendation:** 2-5 km for urban areas

### `MAX_EFFICIENCY_RATIO` (REQUIRED)
- **Value:** `0.3` (30%)
- **Purpose:** Maximum extra distance as ratio of original route
- **Meaning:** Detour can't be more than 30% of original distance
- **Example:** 10km trip → max 3km detour

### `BASE_FARE` (REQUIRED)
- **Value:** `2.50` (USD or your currency)
- **Purpose:** Base fare for every ride
- **Adjust:** Based on your market rates

### `RATE_PER_KM` (REQUIRED)
- **Value:** `1.20` (USD per km)
- **Purpose:** Cost per kilometer traveled
- **Adjust:** Based on fuel costs, market rates

### `OFFSET_RATE_PER_KM` (REQUIRED)
- **Value:** `2.00` (USD per km)
- **Purpose:** Extra charge for detour distance
- **Meaning:** Higher rate for pickup/dropoff detours
- **Recommendation:** 1.5-2x the regular rate

**Example:**
```bash
MAX_OFFSET_KM=3
MAX_EFFICIENCY_RATIO=0.3
BASE_FARE=2.50
RATE_PER_KM=1.20
OFFSET_RATE_PER_KM=2.00
```

**Fare Calculation Example:**
```
Scenario: 10km direct ride, 2km detour for pickup
- Base fare: $2.50
- Direct distance: 10km × $1.20 = $12.00
- Detour distance: 2km × $2.00 = $4.00
- Total: $2.50 + $12.00 + $4.00 = $18.50
```

---

## 8️⃣ Security & Rate Limiting Variables

### `RATE_LIMIT_WINDOW_MS` (OPTIONAL)
- **Value:** `900000` (15 minutes in milliseconds)
- **Purpose:** Time window for rate limiting
- **Default:** 15 minutes
- **Options:** 
  - `60000` = 1 minute
  - `300000` = 5 minutes
  - `900000` = 15 minutes
  - `3600000` = 1 hour

### `RATE_LIMIT_MAX_REQUESTS` (OPTIONAL)
- **Value:** `100`
- **Purpose:** Max requests per IP in the time window
- **Default:** 100 requests per 15 minutes
- **Recommendation:** 100-500 for normal use

**Example:**
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**What this does:**
- Limits each IP to 100 requests per 15 minutes
- Prevents abuse and DDoS attacks
- Protects your API from excessive usage

---

## 9️⃣ Logging Variables

### `LOG_LEVEL` (OPTIONAL)
- **Value:** `info`
- **Purpose:** Controls logging verbosity
- **Options:**
  - `error` - Only errors
  - `warn` - Warnings and errors
  - `info` - General info, warnings, errors
  - `debug` - Everything (very verbose)
- **Production:** Use `info` or `warn`
- **Development:** Use `debug`

**Example:**
```bash
LOG_LEVEL=info
```

---

## 🔟 Feature Flags Variables

### `ENABLE_MOCK_PAYMENTS` (OPTIONAL)
- **Value:** `true` or `false`
- **Purpose:** Enable mock payment system (no real payments)
- **Development:** `true`
- **Production:** `false` (when you integrate real payments)

### `ENABLE_EMAIL_VERIFICATION` (OPTIONAL)
- **Value:** `true` or `false`
- **Purpose:** Require email verification before login
- **Recommendation:** `true` for production

**Example:**
```bash
ENABLE_MOCK_PAYMENTS=true
ENABLE_EMAIL_VERIFICATION=true
```

---

## 📝 Complete Environment Variable Template

Copy and paste this into Render's environment variables section:

```bash
# ============================================
# CORE APPLICATION (REQUIRED)
# ============================================
NODE_ENV=production
PORT=3000

# ============================================
# DATABASE (REQUIRED)
# ============================================
DATABASE_URL=postgresql://your-connection-string
DIRECT_URL=postgresql://your-connection-string

# ============================================
# AUTHENTICATION (REQUIRED)
# ============================================
JWT_SECRET=your-super-strong-random-secret-min-32-characters-long
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6

# ============================================
# EMAIL/SMTP (REQUIRED)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=RideShare <your-email@gmail.com>

# ============================================
# CORS/FRONTEND (REQUIRED)
# ============================================
CORS_ORIGIN=*
SOCKET_CORS_ORIGIN=*
FRONTEND_URL=https://rideshare-frontend.onrender.com

# ============================================
# MAPS & GEOCODING (REQUIRED)
# ============================================
MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
MAP_ATTRIBUTION=© OpenStreetMap contributors
NOMINATIM_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=RideShareApp/1.0

# ============================================
# RIDE MATCHING & PRICING (REQUIRED)
# ============================================
MAX_OFFSET_KM=3
MAX_EFFICIENCY_RATIO=0.3
BASE_FARE=2.50
RATE_PER_KM=1.20
OFFSET_RATE_PER_KM=2.00

# ============================================
# SECURITY & RATE LIMITING (OPTIONAL)
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# LOGGING (OPTIONAL)
# ============================================
LOG_LEVEL=info

# ============================================
# FEATURE FLAGS (OPTIONAL)
# ============================================
ENABLE_MOCK_PAYMENTS=true
ENABLE_EMAIL_VERIFICATION=true
```

---

## 🔄 How to Add Variables in Render

### Method 1: One by One (Recommended)

1. Go to your service in Render
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Enter key and value
5. Click **"Add"**
6. Repeat for each variable

### Method 2: Bulk Add (Advanced)

1. Click **"Environment"** tab
2. Click **"Add from .env"**
3. Paste all variables at once
4. Click **"Add"**

---

## ✅ Verification Checklist

After adding all variables:

- [ ] **20 required variables** added
- [ ] **Database URLs** are correct (test connection)
- [ ] **JWT_SECRET** is strong and unique (32+ chars)
- [ ] **SMTP credentials** are working (test email)
- [ ] **CORS_ORIGIN** set to `*` initially
- [ ] **Pricing values** match your market
- [ ] **Feature flags** set appropriately
- [ ] **No typos** in variable names
- [ ] **No extra spaces** in values
- [ ] **Saved** all changes

---

## 🚨 Common Mistakes

### ❌ Wrong:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
**Issue:** Using the default/example value

### ✅ Correct:
```bash
JWT_SECRET=kJ8vN3mP9qR2sT5uV6wX7yZ8aB1cD2eF3gH4iJ5kL6m=
```

---

### ❌ Wrong:
```bash
SMTP_PASS=your-regular-gmail-password
```
**Issue:** Using regular Gmail password

### ✅ Correct:
```bash
SMTP_PASS=abcd efgh ijkl mnop
```
**Note:** Use App Password (16 characters with spaces)

---

### ❌ Wrong:
```bash
DATABASE_URL=postgresql://...
DIRECT_URL=
```
**Issue:** Missing DIRECT_URL

### ✅ Correct:
```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

---

### ❌ Wrong:
```bash
CORS_ORIGIN=rideshare-frontend.onrender.com
```
**Issue:** Missing `https://`

### ✅ Correct:
```bash
CORS_ORIGIN=https://rideshare-frontend.onrender.com
```

---

## 🔐 Security Best Practices

1. **Never commit** `.env` files to Git
2. **Use strong** JWT secrets (32+ characters)
3. **Rotate secrets** periodically
4. **Use App Passwords** for Gmail, not regular passwords
5. **Update CORS** from `*` to specific domain after deployment
6. **Enable rate limiting** to prevent abuse
7. **Use HTTPS** for all production URLs
8. **Review logs** regularly for suspicious activity

---

## 📊 Priority Guide

If you're short on time, add these **in order**:

### Priority 1 (Must Have):
1. NODE_ENV
2. DATABASE_URL
3. DIRECT_URL
4. JWT_SECRET
5. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
6. CORS_ORIGIN

### Priority 2 (Needed for Full Functionality):
7. All Maps & Geocoding variables
8. All Ride Matching & Pricing variables
9. SOCKET_CORS_ORIGIN
10. FRONTEND_URL

### Priority 3 (Nice to Have):
11. Rate limiting variables
12. LOG_LEVEL
13. Feature flags

---

## 🆘 Troubleshooting

### "Build failed"
**Check:** All required variables are set

### "Cannot connect to database"
**Check:** DATABASE_URL and DIRECT_URL are correct

### "Emails not sending"
**Check:** SMTP credentials are correct

### "CORS error"
**Check:** CORS_ORIGIN matches frontend URL

### "Maps not loading"
**Check:** MAP_TILE_URL and NOMINATIM_URL are set

### "Pricing incorrect"
**Check:** All pricing variables are numbers (not strings with quotes)

---

## 📚 Related Guides

- **Deployment:** `RENDER_WITH_NEON.md` or `QUICK_DEPLOY.md`
- **Email Setup:** `EMAIL_SETUP_GUIDE.md`
- **Complete Reference:** `DEPLOYMENT_SUMMARY.md`

---

**Last Updated:** 20 November 2025
