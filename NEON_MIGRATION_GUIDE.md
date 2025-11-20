# 🚀 Neon PostgreSQL Migration Guide

This guide will help you migrate from local PostgreSQL to Neon (serverless PostgreSQL).

## Why Neon?

- ✅ **Free Tier**: 0.5 GB storage, 10 GB data transfer/month
- ✅ **Serverless**: Auto-scales, no server management
- ✅ **Connection Pooling**: Built-in pgBouncer
- ✅ **Instant Branches**: Create database branches for testing
- ✅ **Fast**: Low latency, global edge network
- ✅ **Great DX**: Easy to use, good documentation

---

## Step 1: Create a Neon Account

1. **Visit**: https://neon.tech
2. **Sign up** with GitHub/Google/Email (recommended: GitHub)
3. **Verify** your email if required

---

## Step 2: Create a New Project

1. After logging in, click **"New Project"**
2. Configure your project:
   - **Name**: `rideshare-db` (or any name you prefer)
   - **Region**: Choose closest to you (e.g., `US East (Ohio)`, `Asia Pacific (Singapore)`, etc.)
   - **PostgreSQL Version**: `16` (latest stable)
   - **Compute Size**: Keep default for free tier

3. Click **"Create Project"**

---

## Step 3: Get Your Connection String

After project creation, you'll see your connection details:

### Database Credentials Page:
- **Host**: `ep-xxxxx-xxxxx.us-east-2.aws.neon.tech`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **Password**: `xxxxx` (auto-generated)

### Connection String Format:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Important Options:
1. **Pooled Connection** (Recommended for most apps):
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   - Use this for Prisma with `pgbouncer=true` parameter

2. **Direct Connection** (For migrations):
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 4: Update Your Environment Variables

Copy your connection string and update both `.env` files:

### `/Users/rajatsharma/Desktop/BTP/.env`
```env
# =============================================================================
# DATABASE (Neon PostgreSQL)
# =============================================================================
# For development and production
# Direct connection for migrations
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Optional: Pooled connection for queries (better performance)
# DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
```

### `/Users/rajatsharma/Desktop/BTP/apps/api/.env`
```env
# Same as above - copy the DATABASE_URL
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxxx-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Important Notes:**
- ✅ Keep `sslmode=require` - Neon requires SSL
- ✅ Replace `YOUR_PASSWORD` with your actual password
- ✅ Replace the host `ep-xxxxx-xxxxx.us-east-2.aws.neon.tech` with your actual host
- ⚠️ **Never commit** `.env` files to git!

---

## Step 5: Run Prisma Migrations

Now that you're connected to Neon, push your schema:

```bash
# Navigate to the API directory
cd /Users/rajatsharma/Desktop/BTP/apps/api

# Push the Prisma schema to Neon
npx prisma db push

# Or run migrations (recommended for production)
npx prisma migrate deploy

# Optional: Reset and re-run all migrations from scratch
# npx prisma migrate reset --force
```

---

## Step 6: Seed Your Database (Optional)

If you have seed data:

```bash
cd /Users/rajatsharma/Desktop/BTP/apps/api

# Run the seed file
npx prisma db seed
```

---

## Step 7: Verify Connection

Test the connection:

```bash
cd /Users/rajatsharma/Desktop/BTP/apps/api

# Open Prisma Studio to view your database
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can see your tables.

---

## Step 8: Update Prisma Schema (Optional Optimization)

For better performance with Neon, you can add connection pooling:

### `apps/api/prisma/schema.prisma`
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

Then in your `.env`:
```env
# Pooled connection (for queries)
DATABASE_URL="postgresql://neondb_owner:pass@host/db?sslmode=require&pgbouncer=true&connect_timeout=15"

# Direct connection (for migrations)
DIRECT_URL="postgresql://neondb_owner:pass@host/db?sslmode=require"
```

---

## Troubleshooting

### Error: "SSL connection required"
**Solution**: Make sure your connection string has `sslmode=require`

### Error: "prepared statement already exists"
**Solution**: Add `&pgbouncer=true` to your pooled connection string

### Error: "Connection timeout"
**Solution**: 
- Check your internet connection
- Verify the host and credentials
- Try `&connect_timeout=30` in the connection string

### Error: "Too many connections"
**Solution**: Use the pooled connection string with `pgbouncer=true`

---

## Neon Dashboard Features

### 1. **SQL Editor**
- Run SQL queries directly from the dashboard
- Great for quick data inspection

### 2. **Metrics**
- Monitor database usage
- Check connection count
- View storage usage

### 3. **Branches**
- Create database branches for testing
- Each branch is a full copy of your database
- Perfect for development/staging

### 4. **Backups**
- Automatic daily backups (free tier)
- Point-in-time restore (paid plans)

---

## Cost Optimization Tips

### Free Tier Limits:
- **Storage**: 0.5 GB
- **Compute**: Shared CPU
- **Data Transfer**: 10 GB/month
- **Branches**: 10 branches

### To Stay Within Free Tier:
1. ✅ Use one project for dev/prod
2. ✅ Enable auto-suspend (default)
3. ✅ Delete unused branches
4. ✅ Monitor your usage in dashboard

---

## Migration Checklist

- [ ] Create Neon account
- [ ] Create new project
- [ ] Copy connection string
- [ ] Update `.env` files (both root and apps/api)
- [ ] Run `npx prisma db push` or `npx prisma migrate deploy`
- [ ] Verify with `npx prisma studio`
- [ ] Test your API endpoints
- [ ] Update production environment variables
- [ ] Delete local PostgreSQL database (optional)

---

## Next Steps

After successful migration:

1. **Test OTP Flow**: 
   ```bash
   curl -X POST http://localhost:3000/api/auth/request-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "your@email.com", "role": "user"}'
   ```

2. **Start Your API**:
   ```bash
   cd /Users/rajatsharma/Desktop/BTP/apps/api
   npm run dev
   ```

3. **Monitor**: Check Neon dashboard for connection stats

---

## Quick Reference

### Neon Dashboard
- **URL**: https://console.neon.tech
- **SQL Editor**: Run queries directly
- **Branches**: Create test databases
- **Metrics**: Monitor usage

### Useful Prisma Commands
```bash
npx prisma studio          # View database
npx prisma db push         # Push schema changes
npx prisma migrate deploy  # Run migrations
npx prisma migrate reset   # Reset database
npx prisma generate        # Generate Prisma Client
```

---

## Support

- **Neon Docs**: https://neon.tech/docs
- **Neon Discord**: https://discord.gg/neon
- **Prisma Docs**: https://www.prisma.io/docs

---

**That's it!** 🎉 Your app is now using Neon PostgreSQL instead of local PostgreSQL.
