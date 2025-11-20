# CORS Error Troubleshooting Guide

## The Problem

You're seeing this error:
```
Access to XMLHttpRequest at 'https://rideshare-api-fh4j.onrender.com/api/auth/request-otp' 
from origin 'https://btp-a2jl.onrender.com' has been blocked by CORS policy: 
The value of the 'Access-Control-Allow-Origin' header in the response must not be 
the wildcard '*' when the request's credentials mode is 'include'.
```

**Root Cause**: Your frontend sends requests with `withCredentials: true`, which requires the backend to specify the exact origin (not `*`).

---

## ✅ Complete Fix Checklist

### 1️⃣ Backend Environment Variables (rideshare-api-fh4j)

Go to: https://dashboard.render.com → **rideshare-api-fh4j** → **Environment**

Add/Update these variables:

| Key | Value |
|-----|-------|
| `CORS_ORIGIN` | `https://btp-a2jl.onrender.com` |
| `FRONTEND_URL` | `https://btp-a2jl.onrender.com` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `your-neon-database-url` |
| `JWT_SECRET` | `your-secret-key` |
| `RESEND_API_KEY` | `your-resend-key` |
| `PORT` | `3000` |

**After adding these, Render will auto-redeploy the backend.**

---

### 2️⃣ Frontend Environment Variables (btp-a2jl)

Go to: https://dashboard.render.com → **btp-a2jl** → **Environment**

Add/Update this variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://rideshare-api-fh4j.onrender.com` |

**After adding this, Render will auto-redeploy the frontend.**

---

### 3️⃣ Verify Backend CORS Configuration

Your backend `src/index.ts` should have:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

✅ **This is already correct in your code!**

---

### 4️⃣ Wait for Deployments

After setting environment variables:

1. **Backend redeploys** → Wait for it to complete (~2-3 minutes)
2. **Frontend redeploys** → Wait for it to complete (~1-2 minutes)
3. **Test again** → Try logging in/registering

---

## 🧪 How to Test

1. Open https://btp-a2jl.onrender.com
2. Open **Browser DevTools** (F12)
3. Go to **Network** tab
4. Try to login/register
5. Check the request to `/api/auth/request-otp`
6. Look at the **Response Headers**:
   - Should see: `Access-Control-Allow-Origin: https://btp-a2jl.onrender.com`
   - Should NOT see: `Access-Control-Allow-Origin: *`

---

## 🔍 Common Mistakes

❌ **Using wildcard `*` for CORS_ORIGIN**
```
CORS_ORIGIN=*  ← WRONG!
```

✅ **Using exact frontend URL**
```
CORS_ORIGIN=https://btp-a2jl.onrender.com  ← CORRECT!
```

---

❌ **Forgetting to redeploy after env changes**
- Render auto-redeploys, but verify it completed

---

❌ **Setting env in .env file instead of Render dashboard**
- `.env` files are NOT deployed to Render
- Must set in Render dashboard

---

## 📋 Quick Verification Commands

### Check Backend CORS Response

```bash
curl -i -X OPTIONS \
  -H "Origin: https://btp-a2jl.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://rideshare-api-fh4j.onrender.com/api/auth/request-otp
```

**Expected response headers:**
```
Access-Control-Allow-Origin: https://btp-a2jl.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
```

---

## 🚨 If Still Not Working

### 1. Check Render Logs

**Backend logs:**
```
Go to rideshare-api-fh4j → Logs
Look for: "Server running on port 3000"
Check for CORS errors
```

**Frontend logs:**
```
Go to btp-a2jl → Logs
Look for build errors
```

### 2. Hard Refresh Browser

- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)
- Or clear browser cache

### 3. Check Network Response

In Browser DevTools → Network:
- Click on failed request
- Go to **Headers** tab
- Check **Response Headers**
- Verify `Access-Control-Allow-Origin` value

---

## 📞 Still Stuck?

Check these in order:

1. ✅ Backend env has `CORS_ORIGIN=https://btp-a2jl.onrender.com`
2. ✅ Frontend env has `VITE_API_URL=https://rideshare-api-fh4j.onrender.com`
3. ✅ Both services deployed successfully (no build errors)
4. ✅ Backend is responding (visit https://rideshare-api-fh4j.onrender.com/health)
5. ✅ Browser cache cleared / hard refresh done

---

## 🎉 Success Indicators

When working correctly:

- ✅ Login/Register forms submit without CORS errors
- ✅ Network tab shows 200 status codes
- ✅ Console has no CORS-related errors
- ✅ OTP emails are sent/received

---

**Last Updated**: November 20, 2025
