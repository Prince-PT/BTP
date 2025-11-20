# CORS Fix - Complete Deployment Guide

## Issue
Getting CORS error: "The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'"

## Root Cause
The backend wasn't reading the CORS_ORIGIN environment variable correctly on Render.

## Solution Applied

### 1. Backend Code Changes
- Updated to only load `.env` file in development mode
- Added logging to verify CORS configuration
- Added `/api/debug/env` endpoint to check environment variables

### 2. Deployment Steps

#### Step 1: Commit and Push Changes
```bash
cd /Users/rajatsharma/Desktop/BTP
git add .
git commit -m "fix: CORS configuration for production deployment"
git push origin main
```

#### Step 2: Verify Backend Environment Variables on Render
1. Go to https://dashboard.render.com
2. Click on **rideshare-api-fh4j** (backend service)
3. Click **"Environment"** in the left sidebar
4. Verify these variables exist EXACTLY as shown:

```
CORS_ORIGIN=https://btp-a2jl.onrender.com
FRONTEND_URL=https://btp-a2jl.onrender.com
SOCKET_CORS_ORIGIN=https://btp-a2jl.onrender.com
NODE_ENV=production
```

⚠️ **IMPORTANT**: 
- No trailing slashes in URLs
- No quotes around values
- Exact URL match

#### Step 3: Verify Frontend Environment Variables on Render
1. Click on **btp-a2jl** (frontend service)
2. Click **"Environment"** in the left sidebar
3. Verify:

```
VITE_API_URL=https://rideshare-api-fh4j.onrender.com
VITE_WS_URL=https://rideshare-api-fh4j.onrender.com
```

#### Step 4: Force Redeploy Backend
1. Go to backend service (rideshare-api-fh4j)
2. Click **"Manual Deploy"** button
3. Select **"Clear build cache & deploy"**
4. Wait for deployment to complete

#### Step 5: Check Backend Logs
1. Once deployed, click **"Logs"** tab
2. Look for this line in the logs:
```
🔒 CORS Configuration: { origin: 'https://btp-a2jl.onrender.com', ... }
```

3. If you see `origin: 'http://localhost:5173'`, the env variable isn't set correctly

#### Step 6: Test Environment Variables Endpoint
Open this URL in your browser:
```
https://rideshare-api-fh4j.onrender.com/api/debug/env
```

You should see:
```json
{
  "CORS_ORIGIN": "https://btp-a2jl.onrender.com",
  "FRONTEND_URL": "https://btp-a2jl.onrender.com",
  "SOCKET_CORS_ORIGIN": "https://btp-a2jl.onrender.com",
  "NODE_ENV": "production",
  "PORT": "10000",
  "hasDatabase": true
}
```

If any value shows "NOT SET", go back and add that environment variable.

#### Step 7: Force Redeploy Frontend
1. Go to frontend service (btp-a2jl)
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

#### Step 8: Test the Application
1. Open https://btp-a2jl.onrender.com
2. Try to login/register
3. Open browser DevTools → Network tab
4. Check the response headers for the API request
5. You should see:
   - `Access-Control-Allow-Origin: https://btp-a2jl.onrender.com` (NOT `*`)
   - `Access-Control-Allow-Credentials: true`

## Common Issues

### Issue 1: Still seeing wildcard `*`
**Solution**: The CORS_ORIGIN variable isn't set. Double-check spelling and redeploy.

### Issue 2: Environment variable shows "NOT SET"
**Solution**: 
1. Go to Render dashboard
2. Click on the service
3. Go to Environment tab
4. Click **"Add Environment Variable"**
5. Enter the key and value
6. Click **"Save Changes"**
7. Render will auto-redeploy

### Issue 3: Changes not taking effect
**Solution**: 
1. Clear build cache
2. Manual deploy
3. Check logs for the CORS configuration message

### Issue 4: Logs don't show CORS configuration
**Solution**: 
1. Make sure you pushed the latest code
2. Check that Render is pulling from the correct branch
3. Verify build command is correct

## Verification Checklist

- [ ] Backend logs show correct CORS_ORIGIN
- [ ] `/api/debug/env` shows all variables correctly
- [ ] Network tab shows specific origin (not `*`)
- [ ] No CORS errors in browser console
- [ ] Login/Register works without errors

## After Deployment

Once everything works:
1. Remove the `/api/debug/env` endpoint (security)
2. Keep the CORS logging for now (helpful for debugging)

## Need Help?

If still having issues:
1. Share the output of `https://rideshare-api-fh4j.onrender.com/api/debug/env`
2. Share the backend logs (first 50 lines after deployment)
3. Share the browser console errors
