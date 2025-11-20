# CORS Error Fix Guide

## Problem
Getting CORS error: "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'."

## Root Cause
The backend CORS configuration needs the exact frontend URL, not a wildcard `*`. The environment variable `CORS_ORIGIN` must be set to your production frontend URL.

## Solution

### Step 1: Update Backend Environment Variables on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your **backend service** (rideshare-api-fh4j)
3. Click on **"Environment"** in the left sidebar
4. Add or update these environment variables:

```
CORS_ORIGIN=https://btp-a2jl.onrender.com
FRONTEND_URL=https://btp-a2jl.onrender.com
```

5. Click **"Save Changes"**
6. Render will automatically redeploy your backend (wait ~2-3 minutes)

### Step 2: Verify Environment Variables

Make sure ALL required environment variables are set on Render:

**Required Variables:**
- ✅ `DATABASE_URL` - Your Neon database URL
- ✅ `DIRECT_URL` - Your Neon direct connection URL
- ✅ `JWT_SECRET` - Your JWT secret key
- ✅ `CORS_ORIGIN` - **https://btp-a2jl.onrender.com**
- ✅ `FRONTEND_URL` - **https://btp-a2jl.onrender.com**
- ✅ `NODE_ENV` - production
- ✅ `PORT` - 3000
- ✅ `SMTP_HOST` - smtp.gmail.com
- ✅ `SMTP_PORT` - 587
- ✅ `SMTP_USER` - rajatsharma.dev1@gmail.com
- ✅ `SMTP_PASS` - najt xpuq nonb wvju
- ✅ `SMTP_FROM` - "RideShare <rajatsharma.dev1@gmail.com>"

### Step 3: Test

1. Wait for the backend to finish deploying
2. Check backend logs for any errors
3. Try logging in again from your frontend

## How CORS Works

Your backend code (index.ts) is correctly configured:

```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  // ... other options
};
```

This means:
- It reads the `CORS_ORIGIN` environment variable
- If not set, it defaults to `http://localhost:5173` (for local development)
- **On Render, you MUST set `CORS_ORIGIN` to your production frontend URL**

## Common Mistakes

❌ **DON'T** use `*` wildcard with credentials
❌ **DON'T** forget to save environment variables on Render
❌ **DON'T** include trailing slashes in URLs
❌ **DON'T** mix http and https

✅ **DO** use exact frontend URL: `https://btp-a2jl.onrender.com`
✅ **DO** wait for deployment to complete
✅ **DO** check logs for errors

## Troubleshooting

If still getting CORS errors:

1. **Check Backend Logs:**
   - Go to Render backend service → Logs
   - Look for startup errors
   - Verify environment variables are loaded

2. **Verify Environment Variables:**
   ```bash
   # You can add a console.log in index.ts temporarily
   console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
   ```

3. **Clear Browser Cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or open in incognito/private mode

4. **Check Network Tab:**
   - Open DevTools → Network
   - Look at the OPTIONS request (preflight)
   - Check response headers for `Access-Control-Allow-Origin`

## Expected Headers

When working correctly, you should see these headers in the response:

```
Access-Control-Allow-Origin: https://btp-a2jl.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS
```

## Quick Reference

| Environment | CORS_ORIGIN | FRONTEND_URL |
|-------------|-------------|--------------|
| Local Dev | http://localhost:5173 | http://localhost:5173 |
| Production | https://btp-a2jl.onrender.com | https://btp-a2jl.onrender.com |

---

**Note:** After setting environment variables on Render, the deployment takes 2-3 minutes. Be patient and check the logs!
