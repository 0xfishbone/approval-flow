# ApprovalFlow Database

PostgreSQL database schema and migrations for ApprovalFlow.

## Setup

### 1. Install PostgreSQL

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-14
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Create database
createdb approvalflow

# Or using psql
psql postgres
CREATE DATABASE approvalflow;
\q
```

### 3. Run Schema

```bash
# Run the schema file
psql -d approvalflow -f database/schema.sql

# Or from within psql
psql approvalflow
\i database/schema.sql
```

### 4. Seed Data (Development Only)

```bash
psql -d approvalflow -f database/seed.sql
```

This creates:
- 1 company (Dakar Hotel Group)
- 3 departments (Kitchen, Housekeeping, Maintenance)
- 7 users with different roles

**Test Credentials** (all passwords: `password123`):
- chef@example.com (Staff - Kitchen)
- kitchen.manager@example.com (Manager - Kitchen)
- housekeeper@example.com (Staff - Housekeeping)
- housekeeping.manager@example.com (Manager - Housekeeping)
- controleur@example.com (Contrôleur - Company-wide)
- direction@example.com (Direction - Company-wide)
- econome@example.com (Économe - Company-wide)

## Schema Overview

### Core Tables
- `companies` - Organizations using the platform
- `departments` - Departments within companies
- `users` - All system users with role-based access
- `requests` - Approval requests with items and status
- `workflows` - Workflow state for each request
- `approvals` - Individual approval steps with signatures

### Supporting Tables
- `attachments` - Files attached to requests
- `signatures` - Visual signatures for users
- `digital_signatures` - Cryptographic signatures
- `comments` - Discussion threads on requests
- `notifications` - In-app and push notifications
- `user_devices` - FCM device tokens
- `documents` - Generated PDFs and uploads
- `audit_logs` - Immutable audit trail
- `refresh_tokens` - JWT refresh token storage

## Database Connection

Update your `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/approvalflow
DB_HOST=localhost
DB_PORT=5432
DB_NAME=approvalflow
DB_USER=your_username
DB_PASSWORD=your_password
```

## Migrations

For production, consider using a migration tool:
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate)
- [Knex.js](https://knexjs.org/)
- [Prisma](https://www.prisma.io/)

Current approach is simplified for MVP development.
