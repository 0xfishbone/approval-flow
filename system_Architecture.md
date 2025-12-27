# ApprovalFlow System Architecture
## Modular Black Box Design

---

## 1. Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Black Box** | Clear APIs, hidden implementation. Modules expose *what*, not *how* |
| **Single Ownership** | Every module writable by 1 person (150-300 lines) |
| **Risk Isolation** | External deps wrapped. Platform changes affect 1 module only |
| **Plugin Architecture** | Minimal core + features as plugins |

**Core Primitive:** `Request` — everything revolves around this (create → route → approve/reject → complete)

---

## 2. Layer Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│     [PWA App]      [Email Templates]      [Admin Dashboard]  │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│         REST API (Express) — Auth, Validation, Routing       │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  CORE MODULES (8 Black Boxes)                │
│                                                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ UserCore │ │ Request  │ │ Workflow │ │Signature │       │
│   │  ~200L   │ │  Core    │ │   Core   │ │   Core   │       │
│   │          │ │  ~250L   │ │  ~300L   │ │  ~200L   │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ Comment  │ │ Notific. │ │ Document │ │  Audit   │       │
│   │  Core    │ │   Core   │ │   Core   │ │   Core   │       │
│   │  ~180L   │ │  ~250L   │ │  ~220L   │ │  ~150L   │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 PLATFORM LAYER (Wrappers)                    │
│                                                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ Database │ │  Email   │ │ Storage  │ │   Push   │       │
│   │ Wrapper  │ │ Wrapper  │ │ Wrapper  │ │ Wrapper  │       │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
└────────┼────────────┼────────────┼────────────┼─────────────┘
         ▼            ▼            ▼            ▼
    PostgreSQL    SendGrid      AWS S3      Firebase
```

---

## 3. Core Modules API

### UserCore (~200 lines)
**Responsibility:** Auth, roles, permissions, profiles
```typescript
interface UserCore {
  createUser(data: UserInput): Promise<User>;
  authenticateUser(email: string, password: string): Promise<AuthToken>;
  getUserById(id: string): Promise<User>;
  getUsersByDepartment(dept: string): Promise<User[]>;
  validatePermission(userId: string, action: Action): boolean;
  getApproverForRole(role: Role, dept?: string): Promise<User>;
  setUserSignature(id: string, signature: Buffer): Promise<void>;
}
```

### RequestCore (~250 lines)
**Responsibility:** CRUD, status, lifecycle
```typescript
interface RequestCore {
  createRequest(data: RequestInput): Promise<Request>;
  getRequestById(id: string): Promise<Request>;
  getRequestsByDepartment(dept: string): Promise<Request[]>;
  getRequestsBySubmitter(userId: string): Promise<Request[]>;
  getPendingForApprover(userId: string): Promise<Request[]>;
  updateRequestStatus(id: string, status: Status): Promise<Request>;
  addAttachment(requestId: string, file: FileInput): Promise<Attachment>;
  getRequestTimeline(id: string): Promise<TimelineEntry[]>;
}
```

### WorkflowCore (~300 lines)
**Responsibility:** Approval routing, progression, steps
```typescript
interface WorkflowCore {
  createWorkflow(requestId: string, submitter: User): Promise<Workflow>;
  getWorkflowForRequest(requestId: string): Promise<Workflow>;
  getCurrentStep(workflowId: string): Promise<WorkflowStep>;
  approveStep(workflowId: string, approverId: string, data?: object): Promise<Workflow>;
  rejectStep(workflowId: string, approverId: string, reason: string): Promise<Workflow>;
  advanceToNextStep(workflowId: string): Promise<WorkflowStep | null>;
  isWorkflowComplete(workflowId: string): boolean;
  getWorkflowConfig(companyId: string): Promise<WorkflowConfig>;
}
```

### SignatureCore (~200 lines)
**Responsibility:** Digital + visual signatures
```typescript
interface SignatureCore {
  captureSignature(userId: string, imageData: Buffer): Promise<Signature>;
  createDigitalSignature(userId: string, requestId: string): Promise<DigitalSig>;
  verifySignature(signatureId: string): Promise<VerificationResult>;
  getSignatureImage(userId: string): Promise<Buffer>;
  generateSignatureMetadata(userId: string, action: string): SignatureMetadata;
  overlaySignatureOnDocument(doc: Buffer, sig: Signature, pos: Position): Buffer;
}
```

### CommentCore (~180 lines)
**Responsibility:** Threads, email parsing
```typescript
interface CommentCore {
  addComment(requestId: string, userId: string, content: string): Promise<Comment>;
  getCommentsForRequest(requestId: string): Promise<Comment[]>;
  parseEmailReply(email: InboundEmail): Promise<ParsedComment>;
  createCommentFromEmail(parsed: ParsedComment): Promise<Comment>;
  getParticipants(requestId: string): Promise<User[]>;
}
```

### NotificationCore (~250 lines)
**Responsibility:** Push, email, in-app alerts
```typescript
interface NotificationCore {
  notifyApprovalNeeded(request: Request, approver: User): Promise<void>;
  notifyApprovalComplete(request: Request, submitter: User): Promise<void>;
  notifyRejection(request: Request, reason: string): Promise<void>;
  notifyComment(comment: Comment, recipients: User[]): Promise<void>;
  notifyWorkflowComplete(request: Request, participants: User[]): Promise<void>;
  sendPushNotification(userId: string, payload: PushPayload): Promise<void>;
  sendEmailNotification(userId: string, template: string, data: object): Promise<void>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
}
```

### DocumentCore (~220 lines)
**Responsibility:** PDF generation, templates
```typescript
interface DocumentCore {
  generateRequestPDF(request: Request, workflow: Workflow): Promise<Buffer>;
  applySignaturesToDocument(doc: Buffer, signatures: SignedStep[]): Promise<Buffer>;
  uploadDocument(requestId: string, file: Buffer, name: string): Promise<string>;
  getDocument(documentId: string): Promise<Buffer>;
  generateQRCode(requestId: string): Promise<Buffer>;
  getDocumentTemplate(companyId: string, type: string): Promise<Template>;
}
```

### AuditCore (~150 lines)
**Responsibility:** Immutable audit trail
```typescript
interface AuditCore {
  logAction(action: AuditAction): Promise<AuditEntry>;
  getAuditTrail(requestId: string): Promise<AuditEntry[]>;
  getAuditByUser(userId: string, dateRange: DateRange): Promise<AuditEntry[]>;
  generateAuditReport(requestId: string): Promise<AuditReport>;
  verifyAuditIntegrity(requestId: string): Promise<IntegrityResult>;
}
```

---

## 4. Platform Wrappers

### DatabaseWrapper (PostgreSQL)
```typescript
interface DatabaseWrapper {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  insert<T>(table: string, data: object): Promise<T>;
  update(table: string, id: string, data: object): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
}
```

### EmailWrapper (SendGrid/Mailgun)
```typescript
interface EmailWrapper {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
  sendTemplateEmail(to: string, templateId: string, data: object): Promise<void>;
  parseInboundEmail(rawEmail: string): InboundEmail;
  registerInboundWebhook(url: string): Promise<void>;
}
```

### StorageWrapper (S3/R2)
```typescript
interface StorageWrapper {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
  downloadFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}
```

### PushWrapper (Firebase)
```typescript
interface PushWrapper {
  sendPush(deviceToken: string, title: string, body: string, data?: object): Promise<void>;
  sendToTopic(topic: string, title: string, body: string): Promise<void>;
  registerDevice(userId: string, token: string): Promise<void>;
  unregisterDevice(userId: string): Promise<void>;
}
```

---

## 5. Data Flows

### Request Submission
```
API Gateway (validate) 
  → UserCore.validatePermission 
  → RequestCore.createRequest 
  → WorkflowCore.createWorkflow 
  → NotificationCore.notifyApprovalNeeded 
  → AuditCore.logAction
```

### Approval Flow
```
API Gateway (validate) 
  → UserCore.validatePermission 
  → SignatureCore.createDigitalSignature 
  → WorkflowCore.approveStep 
  → WorkflowCore.advanceToNextStep 
  → IF next: NotificationCore.notifyApprovalNeeded
  → IF complete: DocumentCore.generatePDF + NotificationCore.notifyComplete
  → AuditCore.logAction
```

### Email Reply
```
Webhook 
  → EmailWrapper.parseInboundEmail 
  → CommentCore.parseEmailReply 
  → UserCore.getUserById (validate) 
  → CommentCore.createCommentFromEmail 
  → NotificationCore.notifyComment 
  → AuditCore.logAction
```

---

## 6. Module Dependency Matrix

|                  | User | Req | Work | Sig | Com | Notif | Doc | Audit |
|------------------|:----:|:---:|:----:|:---:|:---:|:-----:|:---:|:-----:|
| **UserCore**     |  -   |  ✗  |  ✗   |  ✗  |  ✗  |   ✗   |  ✗  |   ✗   |
| **RequestCore**  |  ✓   |  -  |  ✗   |  ✗  |  ✗  |   ✗   |  ✗  |   ✗   |
| **WorkflowCore** |  ✓   |  ✓  |  -   |  ✗  |  ✗  |   ✗   |  ✗  |   ✗   |
| **SignatureCore**|  ✓   |  ✗  |  ✗   |  -  |  ✗  |   ✗   |  ✗  |   ✗   |
| **CommentCore**  |  ✓   |  ✓  |  ✗   |  ✗  |  -  |   ✗   |  ✗  |   ✗   |
| **NotificationCore**| ✓ |  ✓  |  ✗   |  ✗  |  ✗  |   -   |  ✗  |   ✗   |
| **DocumentCore** |  ✗   |  ✓  |  ✓   |  ✓  |  ✗  |   ✗   |  -  |   ✗   |
| **AuditCore**    |  ✗   |  ✗  |  ✗   |  ✗  |  ✗  |   ✗   |  ✗  |   -   |

**Rules:**
- UserCore is foundational — called by most, never calls others
- AuditCore is isolated — only receives data (append-only)
- No circular dependencies
- API Gateway orchestrates complex flows

---

## 7. Project Structure
```
approvalflow/
├── src/
│   ├── core/                    # Black Box Modules
│   │   ├── user/
│   │   │   ├── index.ts         # Public API
│   │   │   ├── user.core.ts     # Implementation
│   │   │   ├── user.types.ts    # Interfaces
│   │   │   └── user.test.ts     # Tests
│   │   ├── request/
│   │   ├── workflow/
│   │   ├── signature/
│   │   ├── comment/
│   │   ├── notification/
│   │   ├── document/
│   │   └── audit/
│   │
│   ├── platform/                # Dependency Wrappers
│   │   ├── database/postgres.wrapper.ts
│   │   ├── email/sendgrid.wrapper.ts
│   │   ├── storage/s3.wrapper.ts
│   │   └── push/firebase.wrapper.ts
│   │
│   ├── api/                     # API Gateway
│   │   ├── routes/
│   │   └── middleware/
│   │
│   └── shared/types/
│
├── frontend/                    # PWA (React + Vite)
└── database/migrations/
```

---

## 8. Implementation Roadmap (10 Weeks)

| Phase | Weeks | Focus |
|-------|-------|-------|
| **1. Foundation** | 1-2 | Monorepo setup, Platform wrappers, PostgreSQL, UserCore |
| **2. Core Logic** | 3-5 | RequestCore, WorkflowCore, SignatureCore, AuditCore |
| **3. Communication** | 6-7 | NotificationCore, CommentCore, Email templates |
| **4. Polish** | 8-10 | DocumentCore, PWA frontend, E2E tests, Deploy |

---

## Summary

| Metric | Value |
|--------|-------|
| Core Modules | 8 |
| Platform Wrappers | 4 |
| Avg Module Size | ~200 lines |
| Total Est. Backend | ~1,750 lines |
| Parallel Dev Capacity | 8 developers |
| Provider Lock-in | Zero (all wrapped) |