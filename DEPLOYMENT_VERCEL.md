# ApprovalFlow - Vercel Full-Stack Deployment Guide

## Overview

This guide covers deploying the complete ApprovalFlow application on Vercel.

- **Frontend**: React + Vite (static files)
- **Backend**: Express API (serverless functions)
- **Database**: Vercel Postgres (Neon)
- **Platform**: 100% on Vercel

---

## Why Vercel Full-Stack?

✅ **Single Platform** - Frontend + Backend + Database in one place
✅ **Zero CORS Issues** - API accessible at `/api` (same domain)
✅ **Auto-Deploy** - Push to GitHub = automatic deployment
✅ **Free Tier** - Generous limits for development
✅ **Simple Setup** - No complex configuration needed

---

## Prerequisites

1. GitHub account with the `approval-flow` repository
2. Vercel account (sign up at [vercel.com](https://vercel.com))
3. Git installed locally

---

## Step 1: Deploy to Vercel

### 1.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `approval-flow` repository
4. Click **Import**

### 1.2 Configure Project

Vercel will auto-detect the configuration from `vercel.json`. The setup includes:

- **Framework**: None (custom configuration)
- **Root Directory**: `/` (monorepo)
- **Build Command**: Auto-detected from vercel.json
- **Output Directory**: `frontend/dist`
- **Install Command**: Installs both frontend and backend dependencies

### 1.3 Deploy

Click **"Deploy"** - Vercel will build and deploy your application.

**Note**: The first deployment will fail because environment variables aren't set yet. This is expected!

---

## Step 2: Add Vercel Postgres Database

### 2.1 Create Database

1. In your Vercel project dashboard, go to the **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"** (powered by Neon)
4. Choose a database name: `approvalflow-db`
5. Select region closest to your users
6. Click **"Create"**

### 2.2 Connect to Project

1. Vercel automatically adds `POSTGRES_*` environment variables
2. These variables are available in your serverless functions
3. The `DATABASE_URL` is automatically formatted for PostgreSQL clients

---

## Step 3: Configure Environment Variables

### 3.1 Required Variables

In your Vercel project → Settings → Environment Variables, add:

```bash
# Database (auto-added by Vercel Postgres)
DATABASE_URL=$POSTGRES_URL

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=<your-super-secret-jwt-key-min-32-chars>
JWT_REFRESH_SECRET=<your-super-secret-refresh-key-min-32-chars>

# SendGrid Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_INBOUND_WEBHOOK_SECRET=your-webhook-secret

# CORS (not needed with Vercel full-stack, but keep for local dev)
CORS_ORIGIN=*

# Frontend API URL
VITE_API_URL=/api
```

### 3.2 Optional Variables (for file uploads/push notifications)

```bash
# AWS S3 / Cloudflare R2 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=approvalflow-production
AWS_ENDPOINT=

# Firebase Cloud Messaging (Optional - for push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

### 3.3 Apply to All Environments

For each variable:
1. Click **"Add New"**
2. Enter Name and Value
3. Select **Production**, **Preview**, and **Development**
4. Click **"Save"**

---

## Step 4: Initialize Database Schema

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Login to Vercel

```bash
vercel login
```

### 4.3 Link to Project

```bash
# In your project directory
vercel link
```

Follow the prompts to link to your Vercel project.

### 4.4 Run Database Migrations

```bash
# Pull environment variables locally
vercel env pull .env.local

# Run migrations using the DATABASE_URL
psql $(grep DATABASE_URL .env.local | cut -d '=' -f2-) -f database/schema.sql
psql $(grep DATABASE_URL .env.local | cut -d '=' -f2-) -f database/seed.sql
```

**Alternative**: Use Vercel Postgres dashboard to run SQL directly:
1. Go to Storage → Your Database → Query
2. Copy contents of `database/schema.sql` and run
3. Copy contents of `database/seed.sql` and run

---

## Step 5: Redeploy

After setting environment variables and initializing the database:

1. Go to **Deployments** tab in Vercel dashboard
2. Find the latest deployment
3. Click the **3 dots menu** → **Redeploy**
4. Check **"Use existing Build Cache"** if available
5. Click **"Redeploy"**

---

## Step 6: Verify Deployment

### 6.1 Test Frontend

Visit your Vercel deployment URL (e.g., `https://approval-flow-xxx.vercel.app`)

You should see the ApprovalFlow login page.

### 6.2 Test API

Test the health endpoint:

```bash
curl https://approval-flow-xxx.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-29T...",
    "version": "1.0.0"
  }
}
```

### 6.3 Test Login

1. Go to `https://approval-flow-xxx.vercel.app/login`
2. Try logging in with seed data:
   - Email: `chef@example.com`
   - Password: `password123`
3. Should successfully authenticate and redirect to dashboard

---

## Architecture: How It Works

### Frontend

- Built with Vite → static files in `frontend/dist`
- Served by Vercel's edge network
- API calls go to `/api/*` (same domain)

### Backend

- Express app wrapped in serverless function (`api/index.ts`)
- All `/api/*` requests routed to this function
- Function initializes Express app on cold start
- Cached between invocations for performance

### Database

- Vercel Postgres (Neon) = serverless PostgreSQL
- Connection pooling handled automatically
- Auto-scales based on usage

---

## Local Development

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Run Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your local DATABASE_URL and secrets
npm install
npm run dev
```

Backend runs on `http://localhost:3000`

### Frontend connects to local backend

The frontend `.env.local` should have:
```
VITE_API_URL=http://localhost:3000/api
```

---

## Troubleshooting

### Error: "Missing required environment variable"

**Problem**: Serverless function can't start

**Solution**:
1. Check all required env vars are set in Vercel dashboard
2. Verify `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
3. Redeploy after adding variables

### Error: Database connection failed

**Problem**: Can't connect to Postgres

**Solution**:
1. Verify Vercel Postgres is created and linked to project
2. Check `DATABASE_URL` is set correctly
3. Try connecting manually using Vercel CLI: `vercel env pull && psql $DATABASE_URL`

### Error: 401 Unauthorized on login

**Problem**: Authentication fails

**Solution**:
1. Ensure database schema is initialized (`database/schema.sql`)
2. Check seed data is loaded (`database/seed.sql`)
3. Verify JWT secrets are set

### Frontend can't reach API

**Problem**: Network errors calling `/api/*`

**Solution**:
1. Check `VITE_API_URL=/api` in Vercel environment variables
2. Verify `vercel.json` has correct rewrites configuration
3. Check browser Network tab for actual request URL

---

## Production Checklist

- [ ] Vercel project created and deployed
- [ ] Vercel Postgres database created
- [ ] All environment variables configured
- [ ] Database schema migrated
- [ ] Seed data loaded (optional)
- [ ] Health check endpoint returns 200
- [ ] Test login with seed user
- [ ] Test request creation flow
- [ ] Custom domain configured (optional)

---

## Next Steps

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel provides free SSL automatically

### Monitoring

1. Go to Analytics tab to see traffic
2. Check Functions tab to see API performance
3. Set up log drains for advanced monitoring

### CI/CD

Vercel automatically deploys when you push to GitHub:
- **main branch** → Production
- **other branches** → Preview deployments

---

## Cost Estimate

**Free Tier (Hobby)**:
- Frontend: Unlimited bandwidth
- Backend: 100GB-hrs serverless execution
- Database: 256MB storage, 60 hours compute
- **Total: $0/month** (perfect for development)

**Pro Tier** (if you exceed free limits):
- Vercel Pro: $20/month
- Postgres Pro: $10/month
- **Total: ~$30/month**

---

## Comparison: Vercel vs Railway

| Feature | Vercel | Railway |
|---------|--------|---------|
| Frontend hosting | ✅ Excellent | ❌ No |
| Serverless functions | ✅ Yes | ❌ No |
| Traditional server | ⚠️ Via functions | ✅ Native |
| Database | ✅ Postgres (Neon) | ✅ Postgres |
| CORS issues | ✅ None (same domain) | ⚠️ Need config |
| Setup complexity | ✅ Simple | ⚠️ Moderate |
| Free tier | ✅ Generous | ⚠️ $5 credit |
| Auto-deploy | ✅ Yes | ✅ Yes |

**Verdict**: Vercel is simpler for full-stack deployments when you're already using it for frontend.

---

*Last Updated: December 29, 2024*
