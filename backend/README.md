# ApprovalFlow Backend

Node.js + Express API with modular black box architecture.

## Architecture

### 4-Layer Design

1. **Presentation Layer** - PWA, Email Templates, Admin Dashboard
2. **API Gateway** - Express with middleware (this layer)
3. **Core Modules** - 8 black box modules (~200 lines each)
4. **Platform Layer** - External service wrappers

### Core Modules (8)

- **UserCore** - Authentication, roles, permissions ✅
- **RequestCore** - CRUD operations, status
- **WorkflowCore** - Sequential approval routing
- **SignatureCore** - Digital + visual signatures
- **CommentCore** - Discussion threads, email parsing
- **NotificationCore** - Push + email notifications
- **DocumentCore** - PDF generation
- **AuditCore** - Immutable audit trail

### Platform Wrappers (4) ✅

- **DatabaseWrapper** - PostgreSQL
- **EmailWrapper** - SendGrid
- **StorageWrapper** - AWS S3 / Cloudflare R2
- **PushWrapper** - Firebase Cloud Messaging

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
# Create database
createdb approvalflow

# Run schema
psql -d approvalflow -f ../database/schema.sql

# Seed data (development)
psql -d approvalflow -f ../database/seed.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### Authentication ✅

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token

### Health Check ✅

- `GET /health` - Server health status

### Coming Soon

- `POST /api/requests` - Create request
- `GET /api/requests` - List requests (role-based visibility)
- `POST /api/workflows/:id/approve` - Approve step
- `POST /api/workflows/:id/reject` - Reject step
- `POST /api/comments` - Add comment
- `GET /api/requests/:id/pdf` - Download PDF

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Project Structure

```
backend/src/
├── core/                 # Core modules (black boxes)
│   ├── user/            # UserCore ✅
│   ├── request/
│   ├── workflow/
│   ├── signature/
│   ├── comment/
│   ├── notification/
│   ├── document/
│   └── audit/
├── platform/            # Platform wrappers ✅
│   ├── database/
│   ├── email/
│   ├── storage/
│   └── push/
├── api/                 # API Gateway ✅
│   ├── middleware/
│   └── routes/
├── app.ts              # Express app setup ✅
└── index.ts            # Entry point ✅
```

## Development Progress

✅ Week 1-2: Foundation
- [x] Monorepo structure
- [x] Database schema
- [x] Platform wrappers
- [x] UserCore module
- [x] API Gateway setup
- [x] Authentication routes

🚧 Week 3-5: Core Workflow
- [ ] RequestCore
- [ ] WorkflowCore
- [ ] SignatureCore
- [ ] AuditCore

⏳ Week 6-7: Communication
- [ ] NotificationCore
- [ ] CommentCore

⏳ Week 8-10: Polish
- [ ] DocumentCore
- [ ] Frontend PWA

## Module Development Guidelines

Each core module should:

1. Be ~150-300 lines
2. Have a clear interface (types file)
3. Be testable in isolation
4. Export only through index.ts
5. Not call other core modules directly
6. Use platform wrappers for external services

## Security

- JWT authentication with refresh tokens
- Bcrypt password hashing (12 rounds)
- Rate limiting on all routes
- Helmet.js security headers
- CORS configuration
- Input validation with Zod

## License

MIT
