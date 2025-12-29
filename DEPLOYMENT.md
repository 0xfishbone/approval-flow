# ApprovalFlow Deployment Guide

## Overview

This guide covers deploying both frontend and backend to production.

- **Frontend**: Vercel (already deployed)
- **Backend**: Railway (recommended) or Render
- **Database**: PostgreSQL on Railway/Render

---

## Backend Deployment (Railway)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway automatically provisions the database
4. Copy the `DATABASE_URL` from the Variables tab

### Step 3: Deploy Backend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select `approval-flow` repository
3. Railway auto-detects Node.js via `nixpacks.toml`
4. **Note**: The monorepo is configured with:
   - `nixpacks.toml` - Explicitly configures Node.js 18 and build commands
   - `railway.json` - Defines health check and restart policies
5. Railway will automatically build and deploy using these configurations

### Step 4: Configure Environment Variables

In Railway dashboard, add these environment variables:

```bash
# Server
PORT=3000
NODE_ENV=production

# CORS - Your Vercel URL
CORS_ORIGIN=https://approval-flow-beryl.vercel.app

# Database (auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secrets (generate new ones!)
JWT_SECRET=<run: openssl rand -base64 32>
JWT_REFRESH_SECRET=<run: openssl rand -base64 32>

# SendGrid (required for emails)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_INBOUND_WEBHOOK_SECRET=your-secret

# Optional: S3/Firebase (leave empty for now)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
FIREBASE_PROJECT_ID=
```

### Step 5: Initialize Database

1. **Option A**: Connect to Railway PostgreSQL via psql
   ```bash
   # Get connection string from Railway dashboard
   psql $DATABASE_URL

   # Run migrations
   \i database/schema.sql
   \i database/seed.sql
   ```

2. **Option B**: Use Railway CLI
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link to project
   railway link

   # Run migrations
   railway run psql $DATABASE_URL -f database/schema.sql
   railway run psql $DATABASE_URL -f database/seed.sql
   ```

### Step 6: Get Backend URL

After deployment, Railway provides a URL like:
```
https://approval-flow-production.up.railway.app
```

Copy this URL - you'll need it for the frontend.

---

## Frontend Configuration

### Step 1: Update Vercel Environment Variables

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add new variable:
   ```
   Name: VITE_API_URL
   Value: https://your-backend.railway.app/api
   ```
3. Select **Production**, **Preview**, and **Development**
4. Save

### Step 2: Redeploy Frontend

Vercel will automatically redeploy when you push, but you can trigger manually:

1. Go to Deployments tab
2. Click the **three dots** on latest deployment
3. Click **Redeploy**

Or push an empty commit:
```bash
git commit --allow-empty -m "Trigger Vercel redeploy with backend URL"
git push
```

---

## Testing Production Deployment

### Test Backend

```bash
# Health check
curl https://your-backend.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Login Flow

1. Go to https://approval-flow-beryl.vercel.app/login
2. Try logging in with seed data:
   - Email: `chef@example.com`
   - Password: `password123`
3. Should successfully authenticate

---

## Alternative: Render Deployment

If you prefer Render over Railway:

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create PostgreSQL Database

1. Click **New +** → **PostgreSQL**
2. Name: `approvalflow-db`
3. Region: Choose closest to your users
4. Free tier is fine for testing
5. Create database
6. Copy **Internal Database URL**

### Step 3: Create Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `approvalflow-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables (same as Railway above)
5. Create Web Service

### Step 4: Run Database Migrations

1. In your Render dashboard, go to your database
2. Click **Connect** → Get psql command
3. Run migrations:
   ```bash
   psql <connection-string> -f database/schema.sql
   psql <connection-string> -f database/seed.sql
   ```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret for access tokens | Generate with `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Generate with `openssl rand -base64 32` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxxx` |
| `SENDGRID_FROM_EMAIL` | Email sender address | `noreply@yourdomain.com` |
| `CORS_ORIGIN` | Allowed frontend URLs | `https://your-frontend.vercel.app` |

### Optional Variables

| Variable | Description | When Needed |
|----------|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | S3 access key | File uploads |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key | File uploads |
| `AWS_S3_BUCKET` | S3 bucket name | File uploads |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Push notifications |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Push notifications |

---

## Troubleshooting

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
1. Check `CORS_ORIGIN` includes your exact Vercel URL
2. Include both production and preview URLs:
   ```
   CORS_ORIGIN=https://approval-flow-beryl.vercel.app,https://approval-flow-*.vercel.app
   ```

### Database Connection Errors

**Problem**: Backend can't connect to PostgreSQL

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check database is running (Railway/Render dashboard)
3. Ensure schema is initialized

### 401 Errors on Login

**Problem**: Authentication fails

**Solution**:
1. Check JWT secrets are set
2. Verify database has users (run seed.sql)
3. Check SendGrid config for email delivery

### Railway Build Error: "npm: command not found"

**Problem**: Railway build fails with exit code 127 and "npm: command not found"

**Solution**:
This happens when Railway's Nixpacks doesn't detect Node.js in a monorepo structure. The repository includes:
- `nixpacks.toml` - Explicitly configures Node.js 18
- `railway.json` - Configures deployment settings

If you still see this error:
1. Ensure `nixpacks.toml` is committed to the repository
2. Check Railway is using the root directory (not `backend` subdirectory)
3. Verify the build logs show "Using Nixpacks"

---

## Production Checklist

- [ ] Backend deployed to Railway/Render
- [ ] PostgreSQL database created
- [ ] Database schema migrated
- [ ] Seed data loaded (optional)
- [ ] All environment variables configured
- [ ] `CORS_ORIGIN` includes Vercel URL
- [ ] Frontend `VITE_API_URL` points to backend
- [ ] Health check endpoint returns 200
- [ ] Test login with seed user
- [ ] Test request creation flow

---

## Next Steps

Once deployed:

1. **Custom Domain**: Add custom domain to both Vercel and Railway
2. **SSL**: Both platforms provide free SSL automatically
3. **Monitoring**: Set up Railway/Render alerts
4. **Backups**: Configure PostgreSQL backups
5. **CDN**: Consider Cloudflare for additional caching

---

## Cost Estimate

**Free Tier (Development)**:
- Railway: $5/month credit (enough for small apps)
- Render: Free tier available
- Vercel: Free for hobby projects
- PostgreSQL: Free tier on both platforms

**Production (Paid)**:
- Railway: ~$10-20/month
- Render: ~$7/month (Starter plan)
- Vercel: Free (unless high traffic)
- PostgreSQL: ~$7/month

**Total**: ~$15-30/month for production-ready setup

---

*Last Updated: December 28, 2024*
