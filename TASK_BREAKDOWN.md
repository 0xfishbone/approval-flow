# ApprovalFlow - Complete Task Breakdown by Priority

**Last Updated:** December 9, 2024
**Phase 1 Status:** ✅ Complete (Weeks 1-2)
**Remaining:** Weeks 3-12 (10 weeks of development)

---

## 🔴 CRITICAL PATH (Must Have for MVP Launch)

These tasks block the MVP launch. Must be completed in order.

### Week 3: RequestCore Module & API (5-7 days)
**Priority:** P0 - BLOCKING

- [ ] **RequestCore Implementation** (~250 lines)
  - [ ] Create request with items (description, quantity, unit)
  - [ ] Get request by ID
  - [ ] Get requests by department (Manager view: ALL dept requests)
  - [ ] Get requests by submitter (Staff view: own requests only)
  - [ ] Get pending requests for approver (company-wide for Contrôleur/Direction/Économe)
  - [ ] Update request status (PENDING → APPROVED/REJECTED/COMPLETED)
  - [ ] Add attachment to request (via StorageWrapper)
  - [ ] Get request timeline (chronological history)

- [ ] **Request API Routes** (4 endpoints)
  - [ ] `POST /api/requests` - Create request (Staff/Manager only)
  - [ ] `GET /api/requests` - List requests (role-based visibility)
  - [ ] `GET /api/requests/:id` - Get single request
  - [ ] `POST /api/requests/:id/attachments` - Upload attachment

- [ ] **Request Validation**
  - [ ] Zod schemas for request creation
  - [ ] File upload validation (max size, allowed types)
  - [ ] Permission checks (can user create for this department?)

- [ ] **Tests**
  - [ ] Unit tests for RequestCore
  - [ ] Integration tests for API routes

**Acceptance Criteria:**
- Staff can create request for their department
- Manager sees ALL requests from their department
- Contrôleur/Direction/Économe see ALL company requests
- Request number auto-generated (REQ-20241209-0001)

---

### Week 4: WorkflowCore Module & Approval Logic (5-7 days)
**Priority:** P0 - BLOCKING

- [ ] **WorkflowCore Implementation** (~300 lines)
  - [ ] Create workflow for new request
  - [ ] Determine initial step based on creator role:
    - Staff → Manager
    - Manager → Contrôleur (skip self)
  - [ ] Get current workflow step
  - [ ] Get current approver (UserCore.getApproverForRole)
  - [ ] Approve step with optional additional data (Contrôleur adds cost)
  - [ ] Reject step with mandatory reason
  - [ ] Advance to next step in sequence
  - [ ] Check if workflow complete (all steps approved)
  - [ ] Get workflow config by company

- [ ] **Workflow State Machine**
  - [ ] Define step sequence: Manager → Contrôleur → Direction → Économe
  - [ ] Implement manager skip logic
  - [ ] Handle rejection (stop workflow, preserve audit)

- [ ] **Approval API Routes** (3 endpoints)
  - [ ] `POST /api/workflows/:id/approve` - Approve current step
  - [ ] `POST /api/workflows/:id/reject` - Reject with reason
  - [ ] `GET /api/workflows/:requestId` - Get workflow status

- [ ] **Validation**
  - [ ] Verify user is current approver
  - [ ] Rejection reason required
  - [ ] Additional data validation (Contrôleur must add cost)

- [ ] **Notification Integration**
  - [ ] Send email to next approver on approval
  - [ ] Send email to submitter on rejection
  - [ ] Send push notification to next approver

- [ ] **Tests**
  - [ ] Unit tests for WorkflowCore
  - [ ] Test manager skip logic
  - [ ] Test rejection flow
  - [ ] Integration tests for approval API

**Acceptance Criteria:**
- Staff request goes to Manager
- Manager request skips to Contrôleur
- Rejection stops workflow and notifies submitter
- Contrôleur cannot approve without adding cost
- Each approval routes to next step automatically

---

### Week 5: SignatureCore & AuditCore (5-7 days)
**Priority:** P0 - BLOCKING

#### SignatureCore (~200 lines)
- [ ] **Visual Signature**
  - [ ] Capture signature (accept base64 PNG)
  - [ ] Upload to StorageWrapper
  - [ ] Update user visual_signature_url
  - [ ] Get signature image by user ID

- [ ] **Digital Signature**
  - [ ] Generate digital signature (ECDSA + SHA-256)
  - [ ] Capture metadata (device info, IP, location, biometric flag)
  - [ ] Store signature with timestamp
  - [ ] Verify signature integrity

- [ ] **Signature API Routes**
  - [ ] `POST /api/signatures/visual` - Upload visual signature
  - [ ] `GET /api/signatures/:userId/visual` - Get visual signature
  - [ ] `POST /api/signatures/digital` - Create digital signature

#### AuditCore (~150 lines)
- [ ] **Audit Logging**
  - [ ] Log action with metadata
  - [ ] Generate checksum (SHA-256 of entry + previous checksum)
  - [ ] Get audit trail for request
  - [ ] Get audit entries by user
  - [ ] Generate audit report
  - [ ] Verify audit integrity (check checksums)

- [ ] **Audit Events**
  - [ ] REQUEST_CREATED
  - [ ] REQUEST_APPROVED
  - [ ] REQUEST_REJECTED
  - [ ] COMMENT_ADDED
  - [ ] ATTACHMENT_UPLOADED
  - [ ] SIGNATURE_CAPTURED
  - [ ] PDF_GENERATED

- [ ] **Integrate Audit Logging**
  - [ ] Log in RequestCore.createRequest
  - [ ] Log in WorkflowCore.approveStep
  - [ ] Log in WorkflowCore.rejectStep
  - [ ] Log in CommentCore.addComment

- [ ] **Tests**
  - [ ] Unit tests for both modules
  - [ ] Test integrity verification
  - [ ] Test checksum chain

**Acceptance Criteria:**
- Users can upload visual signature during setup
- Digital signature captured on every approval
- Every action logged to audit trail
- Audit trail integrity verifiable
- Cannot tamper with audit logs

---

### Week 6: NotificationCore & Email Integration (5-7 days)
**Priority:** P0 - BLOCKING

- [ ] **NotificationCore Implementation** (~250 lines)
  - [ ] Send email notification (via EmailWrapper)
  - [ ] Send push notification (via PushWrapper)
  - [ ] Create in-app notification record
  - [ ] Get user notifications (unread first)
  - [ ] Mark notification as read
  - [ ] Batch notify participants

- [ ] **Email Templates** (HTML + Text)
  - [ ] Approval needed (French + English)
  - [ ] Approval completed
  - [ ] Request rejected
  - [ ] Comment added
  - [ ] Workflow completed

- [ ] **Notification Routing**
  - [ ] notifyApprovalNeeded → next approver
  - [ ] notifyApprovalComplete → original submitter
  - [ ] notifyRejection → submitter with reason
  - [ ] notifyComment → all participants
  - [ ] notifyWorkflowComplete → all participants + PDF attached

- [ ] **Notification API Routes**
  - [ ] `GET /api/notifications` - Get user notifications
  - [ ] `PUT /api/notifications/:id/read` - Mark as read
  - [ ] `POST /api/devices` - Register device token

- [ ] **Tests**
  - [ ] Unit tests for NotificationCore
  - [ ] Test email template rendering
  - [ ] Test notification routing logic

**Acceptance Criteria:**
- Approver receives email within 30 seconds
- Email contains request details + approve/reject links
- Push notification on mobile devices
- In-app notification badge updates
- Multi-language support (French/English)

---

### Week 7: CommentCore & Email Reply Handling (5-7 days)
**Priority:** P0 - BLOCKING

- [ ] **CommentCore Implementation** (~180 lines)
  - [ ] Add comment to request
  - [ ] Get comments for request (chronological)
  - [ ] Parse inbound email (EmailWrapper.parseInboundEmail)
  - [ ] Extract request ID from email (subject or reply-to)
  - [ ] Create comment from email
  - [ ] Get participants (all who commented + approvers)

- [ ] **Email Reply Integration**
  - [ ] Configure SendGrid inbound webhook
  - [ ] Webhook endpoint: `POST /api/webhooks/inbound-email`
  - [ ] Verify webhook signature
  - [ ] Parse email body (remove quoted text)
  - [ ] Link reply to correct request

- [ ] **Comment API Routes**
  - [ ] `POST /api/requests/:id/comments` - Add comment
  - [ ] `GET /api/requests/:id/comments` - Get comments
  - [ ] `POST /api/webhooks/inbound-email` - Handle email replies

- [ ] **Notification on Comment**
  - [ ] Notify all participants when comment added
  - [ ] Email subject line preserves request ID
  - [ ] Reply-to address encodes request ID

- [ ] **Tests**
  - [ ] Unit tests for CommentCore
  - [ ] Test email parsing
  - [ ] Test request ID extraction

**Acceptance Criteria:**
- Users can comment in app
- Approvers can reply to email → adds comment
- All participants notified of new comments
- Email thread maintains context
- Comments appear in timeline view

---

### Week 8: DocumentCore & PDF Generation (5-7 days)
**Priority:** P0 - BLOCKING

- [ ] **DocumentCore Implementation** (~220 lines)
  - [ ] Generate PDF from request (match paper format)
  - [ ] Apply company branding (logo, header)
  - [ ] Overlay visual signatures at approval steps
  - [ ] Generate QR code for verification
  - [ ] Upload PDF to StorageWrapper
  - [ ] Create document record
  - [ ] Get document by ID
  - [ ] Get template by company

- [ ] **PDF Layout** (Mirror Paper Format)
  - [ ] Company header with logo
  - [ ] Request number and date
  - [ ] Department and submitter info
  - [ ] Items table (description, quantity, unit)
  - [ ] Approval chain with signatures
  - [ ] Timestamps for each approval
  - [ ] Additional info (cost added by Contrôleur)
  - [ ] QR code for verification

- [ ] **PDF Library Integration**
  - [ ] Choose library: PDFKit or Puppeteer
  - [ ] Design template system
  - [ ] Support custom branding per company

- [ ] **Document API Routes**
  - [ ] `GET /api/requests/:id/pdf` - Download PDF
  - [ ] `GET /api/documents/:id` - Get document
  - [ ] `POST /api/documents/verify` - Verify QR code

- [ ] **Trigger PDF Generation**
  - [ ] Auto-generate when workflow complete
  - [ ] Attach to completion email
  - [ ] Store URL in request record

- [ ] **Tests**
  - [ ] Unit tests for DocumentCore
  - [ ] Test PDF generation
  - [ ] Test QR code verification

**Acceptance Criteria:**
- PDF mirrors paper format exactly
- All visual signatures appear
- Company branding applied
- QR code verifies authenticity
- PDF auto-generated on completion
- PDF emailed to all participants

---

## 🟠 HIGH PRIORITY (Core User Experience)

Must be completed for beta launch.

### Week 9: Frontend PWA - Core UI (7 days)
**Priority:** P1 - HIGH

- [ ] **Project Setup**
  - [ ] Create React 18 + Vite + TypeScript project
  - [ ] Configure Tailwind CSS
  - [ ] Setup Zustand for state management
  - [ ] Configure PWA plugin (manifest + service worker)
  - [ ] Setup React Router

- [ ] **Authentication Flow**
  - [ ] Login screen
  - [ ] Registration screen
  - [ ] Token storage (localStorage)
  - [ ] Auth context provider
  - [ ] Protected route component

- [ ] **Shared Components**
  - [ ] RequestCard (status badge, time, submitter)
  - [ ] Timeline (vertical progress with steps)
  - [ ] BottomTabNavigation (role-specific tabs)
  - [ ] StatusBadge (color-coded: green/amber/red)
  - [ ] Button (primary, secondary, danger)
  - [ ] Input (text, number, textarea)
  - [ ] Modal
  - [ ] Loading states (skeleton screens)

- [ ] **Role-Specific Dashboards**
  - [ ] ManagerDashboard (2 sections: pending approvals + all dept requests)
  - [ ] ApproverDashboard (1 section: company-wide pending)
  - [ ] Filters (by department for company-level users)

- [ ] **Request Submission Form**
  - [ ] Department auto-selected (from user)
  - [ ] Date auto-filled
  - [ ] Add items (description, quantity)
  - [ ] Remove items
  - [ ] Notes field (optional)
  - [ ] Attachment upload
  - [ ] Preview before submit
  - [ ] Success animation

- [ ] **Request Detail View**
  - [ ] Request info card
  - [ ] Items list
  - [ ] Vertical timeline showing progress
  - [ ] Comment thread
  - [ ] Action buttons (Approve/Reject/Comment)

**Acceptance Criteria:**
- Clean, mobile-first UI
- Role-based navigation
- Request creation < 60 seconds
- Approval action < 90 seconds
- Works on iOS Safari, Android Chrome

---

### Week 10: PWA Polish & Signatures (7 days)
**Priority:** P1 - HIGH

- [ ] **Signature Components**
  - [ ] SignaturePad (HTML5 canvas)
  - [ ] Draw with touch/mouse
  - [ ] Clear and redo
  - [ ] Upload photo of signature option
  - [ ] Preview signature
  - [ ] Save to profile

- [ ] **Biometric Authentication**
  - [ ] BiometricPrompt component
  - [ ] WebAuthn API integration
  - [ ] Face ID / Touch ID / Fingerprint
  - [ ] Fallback to PIN if unsupported
  - [ ] Capture biometric metadata

- [ ] **Comment & Discussion**
  - [ ] CommentThread component
  - [ ] Email indicator (envelope icon)
  - [ ] Add comment form
  - [ ] Real-time updates (polling or WebSocket)
  - [ ] Participant list

- [ ] **PWA Features**
  - [ ] Service worker (offline caching)
  - [ ] Cache strategies (API: network-first, Assets: cache-first)
  - [ ] Offline queue (IndexedDB)
  - [ ] Sync when reconnected
  - [ ] Install prompt
  - [ ] App icons (all sizes)
  - [ ] Splash screens

- [ ] **Mobile Optimization**
  - [ ] Thumb-zone optimization (bottom 60% screen)
  - [ ] 60px minimum tap targets
  - [ ] Responsive breakpoints (mobile: <640px, tablet: <1024px)
  - [ ] Pull-to-refresh
  - [ ] Swipe gestures (back, refresh)
  - [ ] Haptic feedback

- [ ] **Performance**
  - [ ] Lazy load routes (React.lazy)
  - [ ] Code splitting
  - [ ] Image optimization
  - [ ] Load time < 2s on 3G

- [ ] **E2E Testing**
  - [ ] Staff creates request
  - [ ] Manager approves
  - [ ] Contrôleur adds cost and approves
  - [ ] Direction approves
  - [ ] Économe releases material
  - [ ] PDF generated and distributed

**Acceptance Criteria:**
- PWA installable on mobile
- Works offline with sync
- Biometric approval works on supported devices
- Load time < 2s on 3G
- All E2E scenarios pass

---

## 🟡 MEDIUM PRIORITY (Enhanced Features)

Important but not blocking MVP. Can be in v1.1 or v1.2.

### Phase 2.1: Offline Mode & Sync (3-5 days)
**Priority:** P2 - MEDIUM

- [ ] **Offline Detection**
  - [ ] Network status indicator
  - [ ] Offline banner
  - [ ] Queue pending actions

- [ ] **IndexedDB Storage**
  - [ ] Store requests locally
  - [ ] Store user profile
  - [ ] Store pending actions queue

- [ ] **Sync Engine**
  - [ ] Detect network restoration
  - [ ] Process queued actions
  - [ ] Conflict resolution (last-write-wins)
  - [ ] Retry failed actions
  - [ ] Sync status indicator

- [ ] **Optimistic UI**
  - [ ] Show action immediately
  - [ ] Revert if sync fails
  - [ ] Toast notifications for sync status

**Acceptance Criteria:**
- App works without internet
- Actions queued and synced when online
- User sees sync status clearly
- No data loss on offline usage

---

### Phase 2.2: Analytics Dashboard (3-5 days)
**Priority:** P2 - MEDIUM

- [ ] **Metrics Collection**
  - [ ] Average approval time per step
  - [ ] Requests by department
  - [ ] Requests by status
  - [ ] Top requesters
  - [ ] Rejection rate and reasons

- [ ] **Dashboard UI**
  - [ ] KPI cards (total requests, avg time, completion rate)
  - [ ] Charts (line: requests over time, bar: by department, pie: by status)
  - [ ] Filters (date range, department, status)
  - [ ] Export to CSV

- [ ] **Analytics API**
  - [ ] `GET /api/analytics/overview` - High-level KPIs
  - [ ] `GET /api/analytics/requests` - Detailed stats
  - [ ] `GET /api/analytics/performance` - Approval times

**Acceptance Criteria:**
- Contrôleur/Direction see company-wide analytics
- Managers see department analytics
- Data updates in real-time
- Export functionality works

---

### Phase 2.3: SMS Notification Backup (2-3 days)
**Priority:** P2 - MEDIUM

- [ ] **SMS Provider Integration**
  - [ ] Choose provider (Twilio / Africa's Talking)
  - [ ] Create SMSWrapper (~50 lines)
  - [ ] Add to platform layer

- [ ] **SMS Notification**
  - [ ] Send SMS if email fails
  - [ ] Send SMS if push notification fails
  - [ ] User preference: enable/disable SMS
  - [ ] Rate limiting (max 3 SMS/day per user)

- [ ] **Templates**
  - [ ] Approval needed (short format)
  - [ ] Request rejected
  - [ ] Workflow completed

**Acceptance Criteria:**
- SMS sent if email bounces
- SMS sent if push fails
- Character limit respected (160 chars)
- User can opt-out

---

### Phase 2.4: Multi-Language Support (3-4 days)
**Priority:** P2 - MEDIUM

- [ ] **i18n Setup**
  - [ ] React-i18next integration
  - [ ] Language detection
  - [ ] Language switcher UI

- [ ] **Translations**
  - [ ] English translations (base)
  - [ ] French translations
  - [ ] Email templates in both languages
  - [ ] PDF templates in both languages

- [ ] **User Preference**
  - [ ] Store language preference
  - [ ] API returns content in user's language
  - [ ] Fallback to English

**Acceptance Criteria:**
- Users can switch language
- All UI text translated
- Emails sent in user's preferred language
- PDFs generated in user's language

---

### Phase 2.5: Delegation & Backup Approvers (3-4 days)
**Priority:** P2 - MEDIUM

- [ ] **Delegation Model**
  - [ ] Add delegation table (delegator_id, delegate_id, start_date, end_date)
  - [ ] Temporary delegation (vacation mode)
  - [ ] Permanent backup approver

- [ ] **Delegation Logic**
  - [ ] Check if primary approver has delegate
  - [ ] Route to delegate if active
  - [ ] Notify primary approver (CC on emails)

- [ ] **Delegation UI**
  - [ ] Set delegate in profile settings
  - [ ] Date range picker
  - [ ] View active delegations

**Acceptance Criteria:**
- Manager can delegate to another manager
- Delegate receives approval requests
- Primary approver notified (CC)
- Delegation auto-expires

---

## 🟢 LOW PRIORITY (Nice to Have)

These can wait for v2.0 or later.

### Future: Advanced Workflows (Phase 3)
**Priority:** P3 - LOW

- [ ] **Parallel Approvals**
  - [ ] Multiple approvers at same step
  - [ ] Require all or any to proceed

- [ ] **Conditional Routing**
  - [ ] Amount-based thresholds
  - [ ] Category-based routing
  - [ ] Urgent/priority flags

- [ ] **Custom Workflow Builder**
  - [ ] Admin UI to design workflows
  - [ ] Drag-and-drop step editor
  - [ ] Test workflow before activating

---

### Future: Integrations (Phase 3)
**Priority:** P3 - LOW

- [ ] **ERP Integration**
  - [ ] Push approved requests to ERP
  - [ ] Sync inventory levels
  - [ ] Cost center mapping

- [ ] **Accounting Integration**
  - [ ] Export to QuickBooks
  - [ ] Export to Xero
  - [ ] Expense tracking

- [ ] **Calendar Integration**
  - [ ] Google Calendar
  - [ ] Outlook Calendar
  - [ ] Deadline reminders

---

### Future: AI Features (Phase 3)
**Priority:** P3 - LOW

- [ ] **Smart Pre-fill**
  - [ ] Suggest items based on history
  - [ ] Autocomplete descriptions

- [ ] **Anomaly Detection**
  - [ ] Flag unusual requests
  - [ ] Cost outlier detection

- [ ] **Predicted Approval Time**
  - [ ] ML model for time estimation
  - [ ] Show to submitter

---

### Future: White Label (Phase 3)
**Priority:** P3 - LOW

- [ ] **Multi-tenancy**
  - [ ] Isolate data by tenant
  - [ ] Custom domains

- [ ] **Branding Customization**
  - [ ] Custom logo
  - [ ] Custom colors
  - [ ] Custom email templates

- [ ] **Feature Flags**
  - [ ] Enable/disable features per tenant
  - [ ] A/B testing

---

## 📊 Summary by Priority

| Priority | Tasks | Est. Time | Status |
|----------|-------|-----------|--------|
| P0 - Critical Path | 7 major modules | 7 weeks | 2/7 complete |
| P1 - High | Frontend + Polish | 2 weeks | 0/2 complete |
| P2 - Medium | 5 enhancements | 2-3 weeks | Not started |
| P3 - Low | Future features | 4+ weeks | Not started |

**MVP Timeline:** 9 weeks remaining (Critical Path + High Priority)
**Beta Timeline:** 11-12 weeks (add Medium Priority features)
**v2.0 Timeline:** 15+ weeks (add Low Priority features)

---

## 🎯 Recommended Execution Order

**Weeks 3-8: Critical Path (P0)**
1. Week 3: RequestCore
2. Week 4: WorkflowCore
3. Week 5: SignatureCore + AuditCore
4. Week 6: NotificationCore
5. Week 7: CommentCore
6. Week 8: DocumentCore

**Weeks 9-10: Frontend (P1)**
7. Week 9: PWA Core UI
8. Week 10: PWA Polish + E2E

**Beta Launch** ← Target: End of Week 10

**Weeks 11-12: Medium Priority (P2)** - Pick 2-3:
- Offline mode (most valuable for Africa)
- Analytics dashboard (valuable for management)
- SMS backup (valuable for reliability)

**Public Launch** ← Target: End of Week 12

---

## 🚀 Parallel Development Strategy

Once RequestCore is complete (Week 3), you can parallelize:

**Team A (Backend):**
- WorkflowCore → SignatureCore → AuditCore

**Team B (Communication):**
- NotificationCore → CommentCore

**Team C (Documents):**
- DocumentCore (can start in Week 7)

**Team D (Frontend):**
- PWA UI (can start in Week 8)

This reduces timeline from 10 weeks to **7-8 weeks** with 4 developers.

---

**Next Immediate Task:** Week 3 - RequestCore Implementation 🎯
