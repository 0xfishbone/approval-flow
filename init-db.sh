#!/bin/bash
set -e

# Load environment variables
source .env.local

echo "Initializing database schema..."
psql "$DATABASE_URL" -f database/schema.sql

echo "Loading seed data..."
psql "$DATABASE_URL" -f database/seed.sql

echo "✓ Database initialized successfully!"
echo ""
echo "Test users created:"
echo "  - Chef (Staff): chef@example.com / password123"
echo "  - Manager: manager@example.com / password123"
echo "  - Contrôleur: controleur@example.com / password123"
echo "  - Direction: direction@example.com / password123"
echo "  - Économe: econome@example.com / password123"
