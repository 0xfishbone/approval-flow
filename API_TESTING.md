# API Testing Guide

## Setup

**IMPORTANT**: The backend is configured to use the production Neon PostgreSQL database. Make sure `backend/.env` contains the correct DATABASE_URL and JWT secrets.

1. Start the backend server:
```bash
cd backend
npm run dev
```

Backend runs on **port 3000** (not 3001).

2. Get an access token by logging in:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chef@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response to use in subsequent requests.

## Recent Bug Fix

**Issue**: Notifications were not being sent when Staff users created requests.

**Root Cause**: The workflow was being created on request creation, but no notification was sent to the first approver (Manager).

**Fix**: Modified `backend/src/api/routes/request.routes.ts` to send notification to first approver immediately after workflow creation. Also wrapped email/push notification calls in try-catch blocks to prevent development environment errors from breaking the flow.

**Files Modified**:
- `backend/src/api/routes/request.routes.ts`: Added notification sending after workflow creation
- `backend/src/app.ts`: Passed NotificationCore to request routes
- `backend/src/core/notification/notification.core.ts`: Added error handling for email/push failures

## Notification API Tests

### 1. Get All Notifications
```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Get Unread Notifications Only
```bash
curl http://localhost:3000/api/notifications?unreadOnly=true \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get Unread Count
```bash
curl http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Mark Notification as Read
```bash
curl -X PATCH http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Mark All Notifications as Read
```bash
curl -X PATCH http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Register Device for Push Notifications
```bash
curl -X POST http://localhost:3000/api/notifications/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "deviceToken": "test-device-token-123"
  }'
```

## Document API Tests

### 1. Generate PDF for Request
```bash
curl -X POST http://localhost:3000/api/documents/generate-pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "requestId": "REQUEST_ID",
    "includeSignatures": true
  }'
```

### 2. Get Document by ID
```bash
curl http://localhost:3000/api/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get All Documents for a Request
```bash
curl http://localhost:3000/api/documents/request/REQUEST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Workflow Integration Tests

### 1. Create a Request (triggers initial workflow and Manager notification)
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "departmentId": "660e8400-e29b-41d4-a716-446655440001",
    "items": [
      {
        "description": "Fresh vegetables",
        "quantity": 10,
        "unit": "kg",
        "estimatedCost": 5000
      }
    ],
    "notes": "Testing notification flow"
  }'
```

**Important**: When a Staff user creates a request, the workflow starts at the MANAGER step, and the department Manager receives a notification immediately.

### 2. Approve Request (triggers notification to next approver)
```bash
curl -X POST http://localhost:3000/api/workflows/REQUEST_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer APPROVER_ACCESS_TOKEN" \
  -d '{
    "digitalSignature": "signature-hash-123"
  }'
```

After approval, check notifications:
```bash
# Check notifications for the next approver
curl http://localhost:3000/api/notifications?unreadOnly=true \
  -H "Authorization: Bearer NEXT_APPROVER_TOKEN"
```

### 3. Reject Request (triggers notification to submitter)
```bash
curl -X POST http://localhost:3000/api/workflows/REQUEST_ID/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer APPROVER_ACCESS_TOKEN" \
  -d '{
    "digitalSignature": "signature-hash-123",
    "rejectionReason": "Budget exceeded"
  }'
```

After rejection, check notifications for the submitter:
```bash
curl http://localhost:3000/api/notifications?unreadOnly=true \
  -H "Authorization: Bearer SUBMITTER_TOKEN"
```

## Test Seed Data Users

All users have password: `password123`

**Staff (can create requests):**
- chef@example.com (Kitchen Staff)
- housekeeper@example.com (Housekeeping Staff)

**Managers (can approve department requests):**
- kitchen.manager@example.com
- housekeeping.manager@example.com

**Approvers (company-level):**
- controleur@example.com (First approval tier)
- direction@example.com (Second approval tier)
- econome@example.com (Final approval tier)

## Expected Notification Flow

**CORRECTED WORKFLOW** (after bug fix):

1. **Staff creates request** → ✅ **Manager receives notification** (workflow starts at MANAGER step)
2. **Manager approves** → Contrôleur receives notification (workflow moves to CONTROLEUR step)
3. **Contrôleur approves** → Direction receives notification (workflow moves to DIRECTION step)
4. **Direction approves** → Économe receives notification (workflow moves to ECONOME step)
5. **Économe approves** → Original submitter receives notification (workflow complete)
6. **Any rejection at any step** → Original submitter receives notification

**Key Points**:
- Notifications are sent ONLY to the current approver in the workflow
- Contrôleur will ONLY see requests that have been approved by the Manager
- Each approver sees only requests at their step in the workflow
- Staff users can only see their own requests
- Managers can see all requests in their department

## Troubleshooting

### No notifications appearing?
- **Check the workflow step**: Notifications are sent only to the user whose role matches the current workflow step
- Example: If a Contrôleur user sees no notifications, it's likely because no requests have reached the CONTROLEUR step yet (Manager hasn't approved them)
- Verify the workflow was created: Check `currentStep` field in the request object
- Check server logs for notification errors
- In development: Email and push notification errors are expected and handled gracefully

### Contrôleur/Direction/Économe seeing no requests?
- **This is EXPECTED** if the Manager hasn't approved the requests yet
- Check the request's `currentStep` field - it should match your role to see the request
- Workflow flow: MANAGER → CONTROLEUR → DIRECTION → ECONOME
- To test: Login as Manager and approve a request, then check Contrôleur's queue

### Token expired?
- Access tokens expire after 15 minutes
- Use the refresh token endpoint to get a new token:
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Database not seeded?
```bash
cd database
psql -d approvalflow -f seed.sql
```

## Frontend Testing

1. Start frontend:
```bash
cd frontend
npm run dev
```

2. Navigate to http://localhost:5173

3. Login with any test user

4. Test the notification bell icon:
   - Should show unread count badge
   - Badge updates every 30 seconds
   - Clicking navigates to /notifications

5. Test NotificationsPage:
   - Filter by All/Unread
   - Click notification to view request
   - Mark as read functionality
   - Mark all as read button

6. Test DocumentsPage:
   - Navigate to a request detail
   - Go to Documents tab or /documents?requestId=XXX
   - Generate PDF button
   - View/download documents

## Success Criteria

✅ Backend compiles without errors
✅ Frontend builds successfully
✅ All API endpoints return proper responses
✅ Notifications are created on approve/reject
✅ Unread count is accurate
✅ Mark as read works
✅ PDF generation succeeds
✅ Real-time polling updates badge every 30s
✅ Navigation shows notification badge with count
