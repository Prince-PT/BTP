# Render Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] All tests pass locally
- [ ] Environment variables are documented
- [ ] Email service credentials are ready (Gmail App Password or Brevo/SendGrid)
- [ ] Render account is created

## Database Setup

- [ ] PostgreSQL database created on Render
- [ ] Internal Database URL copied
- [ ] External Database URL copied (for migrations)

## Backend API Setup

- [ ] Web Service created for API
- [ ] Root directory set to `apps/api`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] All environment variables configured:
  - [ ] NODE_ENV=production
  - [ ] DATABASE_URL (Internal)
  - [ ] DIRECT_URL (Internal)
  - [ ] JWT_SECRET (strong random string)
  - [ ] JWT_EXPIRES_IN
  - [ ] OTP_EXPIRY_MINUTES
  - [ ] OTP_LENGTH
  - [ ] CORS_ORIGIN (will update after frontend)
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_USER
  - [ ] SMTP_PASS
  - [ ] SMTP_FROM
- [ ] Service deployed successfully
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] API URL copied

## Frontend Setup

- [ ] Static Site created for frontend
- [ ] Root directory set to `apps/frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] All environment variables configured:
  - [ ] VITE_API_URL (from backend)
  - [ ] VITE_WS_URL (same as API URL)
  - [ ] VITE_MAP_TILE_URL
  - [ ] VITE_MAP_ATTRIBUTION
  - [ ] VITE_MAP_DEFAULT_ZOOM
  - [ ] VITE_MAP_DEFAULT_CENTER_LAT
  - [ ] VITE_MAP_DEFAULT_CENTER_LNG
  - [ ] VITE_APP_NAME
  - [ ] VITE_APP_VERSION
- [ ] `_redirects` file exists in `apps/frontend/public/`
- [ ] Site deployed successfully
- [ ] Frontend URL copied

## Post-Deployment

- [ ] Update CORS_ORIGIN in backend with frontend URL
- [ ] Backend redeployed with updated CORS
- [ ] All services showing "Live" status

## Testing

- [ ] Frontend loads correctly
- [ ] Can register/login
- [ ] OTP emails are received
- [ ] Maps display properly
- [ ] Rider booking flow works
- [ ] Driver flow works
- [ ] Real-time updates work (Socket.IO)
- [ ] Mobile responsive design works

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified
- [ ] Error tracking setup (Sentry)
- [ ] Analytics added (Google Analytics, Mixpanel)
- [ ] Monitoring configured (UptimeRobot)
- [ ] Backup strategy implemented

## Production Readiness

- [ ] Upgraded from free tier (if needed)
- [ ] Database backups enabled
- [ ] Rate limiting tested
- [ ] Security headers verified
- [ ] GDPR/Privacy policy added
- [ ] Terms of service added
- [ ] Contact/support page added

## Troubleshooting Checks

If something doesn't work:

- [ ] Check all service logs
- [ ] Verify all environment variables
- [ ] Ensure database is accessible
- [ ] Confirm migrations ran successfully
- [ ] Check browser console for errors
- [ ] Verify CORS settings
- [ ] Test email service separately
- [ ] Check Socket.IO connection

## Important URLs

```
Frontend:  https://rideshare-frontend.onrender.com
Backend:   https://rideshare-api.onrender.com
Health:    https://rideshare-api.onrender.com/health
Dashboard: https://dashboard.render.com
```

## Quick Commands

### Run migrations from local machine:
```bash
cd apps/api
DATABASE_URL="your-external-database-url" npx prisma migrate deploy
```

### Seed database:
```bash
cd apps/api
DATABASE_URL="your-external-database-url" npm run prisma:seed
```

### View database (Prisma Studio):
```bash
cd apps/api
DATABASE_URL="your-external-database-url" npx prisma studio
```

### Check API health:
```bash
curl https://rideshare-api.onrender.com/health
```

## Support

- 📖 Full Guide: `RENDER_DEPLOYMENT_GUIDE.md`
- 🌐 Render Docs: https://render.com/docs
- 💬 Render Community: https://community.render.com

---

**Estimated Time:** 30-45 minutes for complete deployment

**Cost (Free Tier):**
- Database: Free (1GB)
- API: Free (with cold starts) or $7/month
- Frontend: Free

Good luck! 🚀
