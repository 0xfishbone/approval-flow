#!/bin/bash

# ApprovalFlow - Vercel Setup Helper Script
# This script helps you set up the Vercel deployment

set -e  # Exit on error

echo "======================================"
echo "ApprovalFlow - Vercel Setup Helper"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI is installed${NC}"
echo ""

# Step 1: Generate JWT Secrets
echo "======================================"
echo "Step 1: Generate JWT Secrets"
echo "======================================"
echo ""
echo "Generating JWT_SECRET..."
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}JWT_SECRET:${NC} $JWT_SECRET"
echo ""

echo "Generating JWT_REFRESH_SECRET..."
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}JWT_REFRESH_SECRET:${NC} $JWT_REFRESH_SECRET"
echo ""

# Save to temporary file for easy copying
echo "JWT_SECRET=$JWT_SECRET" > .env.secrets.tmp
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> .env.secrets.tmp
echo -e "${YELLOW}💾 Secrets saved to .env.secrets.tmp${NC}"
echo ""

# Step 2: Instructions for Vercel Dashboard
echo "======================================"
echo "Step 2: Add Environment Variables"
echo "======================================"
echo ""
echo "Go to your Vercel dashboard and add these environment variables:"
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your ApprovalFlow project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the following variables (one by one):"
echo ""
echo -e "${YELLOW}Variable: JWT_SECRET${NC}"
echo "Value: $JWT_SECRET"
echo "Environments: Production, Preview, Development"
echo ""
echo -e "${YELLOW}Variable: JWT_REFRESH_SECRET${NC}"
echo "Value: $JWT_REFRESH_SECRET"
echo "Environments: Production, Preview, Development"
echo ""
echo -e "${YELLOW}Variable: SENDGRID_API_KEY${NC}"
echo "Value: SG.temp_key_replace_later"
echo "Environments: Production, Preview, Development"
echo ""
echo -e "${YELLOW}Variable: SENDGRID_FROM_EMAIL${NC}"
echo "Value: noreply@yourdomain.com"
echo "Environments: Production, Preview, Development"
echo ""
echo -e "${YELLOW}Variable: VITE_API_URL${NC}"
echo "Value: /api"
echo "Environments: Production, Preview, Development"
echo ""
echo -e "${RED}⚠️  Don't forget to add Neon Postgres database in Storage tab!${NC}"
echo ""

# Step 3: Pull environment and initialize database
echo "======================================"
echo "Step 3: Initialize Database"
echo "======================================"
echo ""
read -p "Have you added all environment variables and Neon Postgres? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Pulling environment variables from Vercel..."
    vercel env pull .env.local

    if [ -f .env.local ]; then
        echo -e "${GREEN}✅ Environment variables pulled successfully${NC}"
        echo ""

        # Extract DATABASE_URL
        DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-)

        if [ -z "$DATABASE_URL" ]; then
            echo -e "${RED}❌ DATABASE_URL not found in .env.local${NC}"
            echo "Make sure you added the Neon Postgres database in Vercel Storage tab"
            exit 1
        fi

        echo "Running database schema..."
        psql "$DATABASE_URL" -f database/schema.sql
        echo -e "${GREEN}✅ Schema created${NC}"
        echo ""

        echo "Running database seed..."
        psql "$DATABASE_URL" -f database/seed.sql
        echo -e "${GREEN}✅ Seed data inserted${NC}"
        echo ""

        echo -e "${GREEN}✅ Database initialization complete!${NC}"
        echo ""

        # Show seed users
        echo "======================================"
        echo "Test Users Created"
        echo "======================================"
        echo ""
        echo "Chef (STAFF):"
        echo "  Email: chef@example.com"
        echo "  Password: password123"
        echo ""
        echo "Manager (MANAGER):"
        echo "  Email: manager@example.com"
        echo "  Password: password123"
        echo ""

    else
        echo -e "${RED}❌ Failed to pull environment variables${NC}"
        exit 1
    fi
else
    echo ""
    echo "Please add the environment variables first, then run this script again."
    exit 0
fi

# Step 4: Trigger redeploy
echo "======================================"
echo "Step 4: Redeploy Application"
echo "======================================"
echo ""
read -p "Do you want to trigger a redeploy now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Triggering empty commit to redeploy..."
    git commit --allow-empty -m "chore: redeploy after environment setup"
    git push
    echo -e "${GREEN}✅ Redeploy triggered!${NC}"
    echo ""
fi

# Final instructions
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Wait for Vercel deployment to complete (1-2 minutes)"
echo "2. Test your production URL (not preview URL):"
echo "   curl https://your-project.vercel.app/api/health"
echo ""
echo "3. Test login at:"
echo "   https://your-project.vercel.app/login"
echo "   Email: chef@example.com"
echo "   Password: password123"
echo ""
echo -e "${YELLOW}💡 Tip: Your JWT secrets are saved in .env.secrets.tmp${NC}"
echo ""
echo "======================================"
echo -e "${GREEN}✅ All done!${NC}"
echo "======================================"
