# ApprovalFlow

Mobile-First Approval Workflow Platform for SMBs in Hospitality, Construction, and Service Industries.

## Project Structure

```
Approval_Flow/
├── backend/          # Node.js + Express API
├── frontend/         # React PWA (Vite + TypeScript)
├── shared/           # Shared TypeScript types
├── database/         # Migrations and schema
└── docs/             # Documentation
```

## Architecture

This project follows a **Modular Black Box Design** with 8 core modules:

1. **UserCore** - Authentication, roles, permissions
2. **RequestCore** - CRUD operations, status management
3. **WorkflowCore** - Sequential approval routing
4. **SignatureCore** - Digital + visual signatures
5. **CommentCore** - Discussion threads, email parsing
6. **NotificationCore** - Push + email notifications
7. **DocumentCore** - PDF generation
8. **AuditCore** - Immutable audit trail

See `system_Architecture.md` for detailed architecture documentation.

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup (Coming in Week 9)

```bash
cd frontend
npm install
npm run dev
```

## Development Roadmap

- **Weeks 1-2**: Foundation & Platform Layer
- **Weeks 3-5**: Core Workflow Modules
- **Weeks 6-7**: Communication Layer
- **Weeks 8-10**: Documents & Frontend

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)

**Infrastructure:**
- SendGrid (email)
- AWS S3 / Cloudflare R2 (storage)
- Firebase Cloud Messaging (push notifications)

## License

MIT
