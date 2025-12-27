# ApprovalFlow - Quick Start Guide

## What's Been Built (Phase 1 - Weeks 1-2) ✅

### Architecture
- ✅ Monorepo structure (backend/frontend/shared/database)
- ✅ Complete database schema (PostgreSQL)
- ✅ 4 Platform Wrappers (Database, Email, Storage, Push)
- ✅ UserCore module with JWT authentication
- ✅ API Gateway with Express + middleware
- ✅ Authentication endpoints

### File Structure
```
Approval_Flow/
├── backend/
│   ├── src/
│   │   ├── core/user/          # UserCore (~200 lines) ✅
│   │   ├── platform/           # 4 wrappers ✅
│   │   ├── api/                # Routes + middleware ✅
│   │   ├── app.ts              # Express setup ✅
│   │   └── index.ts            # Entry point ✅
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── shared/
│   └── types.ts                # Shared TypeScript types ✅
├── database/
│   ├── schema.sql              # Complete DB schema ✅
│   ├── seed.sql                # Test data ✅
│   └── README.md
├── system_Architecture.md      # Your architecture doc
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup PostgreSQL Database

```bash
# Create database
createdb approvalflow

# Run schema
psql -d approvalflow -f ../database/schema.sql

# Seed test data (optional)
psql -d approvalflow -f ../database/seed.sql
```

### 3. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set at minimum:
```env
DATABASE_URL=postgresql://localhost:5432/approvalflow
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@approvalflow.com
```

### 4. Start Development Server

```bash
npm run dev
```

Server starts on `http://localhost:3001`

## Test the API

### Health Check
```bash
curl http://localhost:3001/health
```

### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "STAFF",
    "companyId": "550e8400-e29b-41d4-a716-446655440000",
    "departmentId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response includes:
- `accessToken` - Use for authenticated requests (expires in 15 min)
- `refreshToken` - Use to get new access token (expires in 7 days)
- `user` - User profile data

### Use Authenticated Endpoints (coming in Phase 2)
```bash
curl http://localhost:3001/api/requests \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Test Users (if you seeded the database)

All passwords: `password123`

**Department-Level (Requesters):**
- chef@example.com (Staff - Kitchen)
- kitchen.manager@example.com (Manager - Kitchen)
- housekeeper@example.com (Staff - Housekeeping)
- housekeeping.manager@example.com (Manager - Housekeeping)

**Company-Level (Approvers):**
- controleur@example.com (Contrôleur)
- direction@example.com (Direction)
- econome@example.com (Économe)

## Next Steps (Phase 2 - Weeks 3-5)

Ready to implement:

1. **RequestCore** (~250 lines)
   - Create request with items
   - Role-based visibility queries
   - Department/company-scoped access

2. **WorkflowCore** (~300 lines)
   - Sequential approval routing
   - Manager skip logic
   - Approve/reject with reasons

3. **SignatureCore** (~200 lines)
   - Visual signature capture
   - Digital signatures (ECDSA)
   - Biometric metadata

4. **AuditCore** (~150 lines)
   - Immutable logging
   - Integrity verification

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `brew services list` (macOS)
- Verify DATABASE_URL in .env
- Test connection: `psql approvalflow`

### TypeScript Errors
```bash
npm run build
```

### Port Already in Use
Change PORT in .env or kill the process:
```bash
lsof -ti:3001 | xargs kill
```

## Architecture Notes

- **Black Box Design**: Each module ~200 lines, single ownership
- **Risk Isolation**: External deps wrapped, swappable
- **No Circular Dependencies**: UserCore is foundational
- **Clean APIs**: Modules expose interfaces, hide implementation

See `system_Architecture.md` for full technical architecture.
