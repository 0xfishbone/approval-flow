# Vercel Deployment - Quick Fix for 500 Errors

Your API is returning 500 errors because environment variables aren't configured yet. Follow these steps **in order** to fix it:

---

## Step 1: Add Neon Postgres Database (2 minutes)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your `ApprovalFlow` project
3. Go to the **Storage** tab
4. Click **Create Database**
5. Select **Postgres** (Neon)
6. Click **Continue** → **Create**
7. ✅ This automatically sets `DATABASE_URL` environment variable

---

## Step 2: Generate JWT Secrets (1 minute)

**On your local machine**, run these commands:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

Copy both outputs - you'll need them in Step 3.

---

## Step 3: Add Environment Variables (3 minutes)

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add these variables **one by one**:

### Required Variables (Add these NOW):

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `JWT_SECRET` | (Paste output from Step 2 - first command) | Production, Preview, Development |
| `JWT_REFRESH_SECRET` | (Paste output from Step 2 - second command) | Production, Preview, Development |
| `SENDGRID_API_KEY` | `SG.temp_key_replace_later` | Production, Preview, Development |
| `SENDGRID_FROM_EMAIL` | `noreply@yourdomain.com` | Production, Preview, Development |
| `VITE_API_URL` | `/api` | Production, Preview, Development |

**Note:** We're using temporary SendGrid values for now. Email features won't work until you add real credentials, but the app will run.

---

## Step 4: Initialize Database (2 minutes)

**On your local machine**, run:

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Run database migrations
psql $(grep DATABASE_URL .env.local | cut -d '=' -f2-) -f database/schema.sql
psql $(grep DATABASE_URL .env.local | cut -d '=' -f2-) -f database/seed.sql
```

This creates:
- Database tables (users, requests, workflows, etc.)
- Seed data including test users

---

## Step 5: Redeploy (1 minute)

After adding environment variables, you MUST redeploy:

**Option A: Via Git**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

**Option B: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache**
5. Click **Redeploy**

---

## Step 6: Test Your Deployment (2 minutes)

1. **IMPORTANT:** Use your **production URL**, not the preview URL
   - Production URL format: `https://your-project.vercel.app`
   - Preview URLs are protected by Vercel authentication

2. **Test the API health check:**
   ```bash
   curl https://your-project.vercel.app/api/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-12-29T..."
   }
   ```

3. **Test login with seed user:**
   - Email: `chef@example.com`
   - Password: `password123`

---

## If You Still See 500 Errors

1. **Check Vercel Function Logs:**
   - Go to your project → **Deployments**
   - Click on the latest deployment
   - Click **Functions** tab
   - Click on `/api` function
   - Look for error messages showing missing variables

2. **Verify Environment Variables:**
   - Settings → Environment Variables
   - Confirm all 5 required variables are present
   - Ensure they're enabled for "Production" environment

3. **Check Database Connection:**
   ```bash
   vercel env pull .env.local
   psql $(grep DATABASE_URL .env.local | cut -d '=' -f2-) -c "SELECT COUNT(*) FROM users;"
   ```
   Should return the number of users (at least 5 from seed data)

---

## Getting Real SendGrid Credentials (Optional - for email features)

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name: "ApprovalFlow Production"
5. Select **Full Access**
6. Copy the API key
7. In Vercel, update `SENDGRID_API_KEY` with the real key
8. Update `SENDGRID_FROM_EMAIL` with your verified sender email
9. Redeploy

---

## Summary

**Minimum to get API working:**
- ✅ Neon Postgres database
- ✅ JWT secrets generated
- ✅ 5 environment variables added
- ✅ Database schema initialized
- ✅ Redeploy triggered
- ✅ Test with production URL (not preview URL)

**Total time:** ~10 minutes

After these steps, your 500 errors should be gone and you'll see proper login functionality.
