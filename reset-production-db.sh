#!/bin/bash
set -e

# Change to project directory
cd /Users/diop/src/experiments/2025-12-09-Approval_Flow

# Load production environment variables
source .env.production.local

echo "Clearing existing data from production database..."
psql "$DATABASE_URL" -c "TRUNCATE users CASCADE;"

echo "Loading seed data with corrected password hashes..."
psql "$DATABASE_URL" -f database/seed.sql

echo ""
echo "✅ Production database reset complete!"
echo ""
echo "You can now login with:"
echo "  Email: chef@example.com"
echo "  Password: password123"
