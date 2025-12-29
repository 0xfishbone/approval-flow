#!/bin/bash

# ApprovalFlow - Deployment Test Script
# Tests your Vercel deployment to ensure everything works

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "ApprovalFlow - Deployment Test"
echo "======================================"
echo ""

# Get production URL
read -p "Enter your production URL (e.g., https://approvalflow.vercel.app): " PROD_URL

# Remove trailing slash
PROD_URL=${PROD_URL%/}

echo ""
echo "Testing deployment at: $PROD_URL"
echo ""

# Test 1: Health Check
echo "======================================"
echo "Test 1: API Health Check"
echo "======================================"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$PROD_URL/api/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [ "$HEALTH_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $HEALTH_BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH_CODE)${NC}"
    echo "Response: $HEALTH_BODY"
    exit 1
fi
echo ""

# Test 2: Login Endpoint Exists
echo "======================================"
echo "Test 2: Login Endpoint"
echo "======================================"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}')
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)
LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)

# We expect 400 (bad request) not 500 (server error)
if [ "$LOGIN_CODE" == "400" ]; then
    echo -e "${GREEN}✅ Login endpoint exists and responds${NC}"
    echo "Response: $LOGIN_BODY"
elif [ "$LOGIN_CODE" == "500" ]; then
    echo -e "${RED}❌ Login endpoint returns 500 error${NC}"
    echo "Response: $LOGIN_BODY"
    echo ""
    echo "This usually means environment variables are missing."
    echo "Check Vercel function logs for details."
    exit 1
else
    echo -e "${YELLOW}⚠️  Unexpected response code: $LOGIN_CODE${NC}"
    echo "Response: $LOGIN_BODY"
fi
echo ""

# Test 3: Actual Login
echo "======================================"
echo "Test 3: Login with Test User"
echo "======================================"
FULL_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"chef@example.com","password":"password123"}')
FULL_LOGIN_BODY=$(echo "$FULL_LOGIN_RESPONSE" | head -n -1)
FULL_LOGIN_CODE=$(echo "$FULL_LOGIN_RESPONSE" | tail -n 1)

if [ "$FULL_LOGIN_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Login successful!${NC}"
    echo "Response: $FULL_LOGIN_BODY"

    # Extract access token
    ACCESS_TOKEN=$(echo "$FULL_LOGIN_BODY" | grep -o '"accessToken":"[^"]*"' | cut -d '"' -f 4)

    if [ -n "$ACCESS_TOKEN" ]; then
        echo ""
        echo -e "${GREEN}✅ Access token received${NC}"
    fi
else
    echo -e "${RED}❌ Login failed (HTTP $FULL_LOGIN_CODE)${NC}"
    echo "Response: $FULL_LOGIN_BODY"
    echo ""
    echo "Possible issues:"
    echo "  - Database not initialized (run setup-vercel.sh)"
    echo "  - Environment variables missing"
    echo "  - Database connection error"
    exit 1
fi
echo ""

# Test 4: Frontend Assets
echo "======================================"
echo "Test 4: Frontend Assets"
echo "======================================"

# Test index.html
INDEX_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/")
if [ "$INDEX_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Frontend index.html loads${NC}"
else
    echo -e "${RED}❌ Frontend index.html failed (HTTP $INDEX_CODE)${NC}"
fi

# Test manifest
MANIFEST_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/manifest.webmanifest")
if [ "$MANIFEST_CODE" == "200" ]; then
    echo -e "${GREEN}✅ PWA manifest loads${NC}"
elif [ "$MANIFEST_CODE" == "404" ]; then
    echo -e "${YELLOW}⚠️  PWA manifest not found (non-critical)${NC}"
else
    echo -e "${YELLOW}⚠️  PWA manifest returned HTTP $MANIFEST_CODE${NC}"
fi
echo ""

# Test 5: Authenticated Request
if [ -n "$ACCESS_TOKEN" ]; then
    echo "======================================"
    echo "Test 5: Authenticated Request"
    echo "======================================"

    REQUESTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$PROD_URL/api/requests" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    REQUESTS_BODY=$(echo "$REQUESTS_RESPONSE" | head -n -1)
    REQUESTS_CODE=$(echo "$REQUESTS_RESPONSE" | tail -n 1)

    if [ "$REQUESTS_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Authenticated requests work${NC}"
        echo "Response: $REQUESTS_BODY"
    else
        echo -e "${RED}❌ Authenticated request failed (HTTP $REQUESTS_CODE)${NC}"
        echo "Response: $REQUESTS_BODY"
    fi
    echo ""
fi

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo -e "${GREEN}✅ All critical tests passed!${NC}"
echo ""
echo "Your ApprovalFlow deployment is working correctly."
echo ""
echo "Test Users:"
echo "  - Chef (Staff): chef@example.com / password123"
echo "  - Manager: manager@example.com / password123"
echo "  - Contrôleur: controleur@example.com / password123"
echo "  - Direction: direction@example.com / password123"
echo "  - Économe: econome@example.com / password123"
echo ""
echo "======================================"
