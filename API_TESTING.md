# API Testing Guide

## Setup

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Get an access token by logging in:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chef@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response to use in subsequent requests.

## Notification API Tests

### 1. Get All Notifications
```bash
curl http://localhost:3001/api/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Get Unread Notifications Only
```bash
curl http://localhost:3001/api/notifications?unreadOnly=true \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get Unread Count
```bash
curl http://localhost:3001/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Mark Notification as Read
```bash
curl -X PATCH http://localhost:3001/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Mark All Notifications as Read
```bash
curl -X PATCH http://localhost:3001/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Register Device for Push Notifications
```bash
curl -X POST http://localhost:3001/api/notifications/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "deviceToken": "test-device-token-123"
  }'
```

## Document API Tests

### 1. Generate PDF for Request
```bash
curl -X POST http://localhost:3001/api/documents/generate-pdf \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "requestId": "REQUEST_ID",
    "includeSignatures": true
  }'
```

### 2. Get Document by ID
```bash
curl http://localhost:3001/api/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get All Documents for a Request
```bash
curl http://localhost:3001/api/documents/request/REQUEST_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Workflow Integration Tests

### 1. Create a Request (triggers initial workflow)
```bash
curl -X POST http://localhost:3001/api/requests \
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

### 2. Approve Request (triggers notification to next approver)
```bash
curl -X POST http://localhost:3001/api/workflows/REQUEST_ID/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer APPROVER_ACCESS_TOKEN" \
  -d '{
    "digitalSignature": "signature-hash-123"
  }'
```

After approval, check notifications:
```bash
# Check notifications for the next approver
curl http://localhost:3001/api/notifications?unreadOnly=true \
  -H "Authorization: Bearer NEXT_APPROVER_TOKEN"
```

### 3. Reject Request (triggers notification to submitter)
```bash
curl -X POST http://localhost:3001/api/workflows/REQUEST_ID/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer APPROVER_ACCESS_TOKEN" \
  -d '{
    "digitalSignature": "signature-hash-123",
    "rejectionReason": "Budget exceeded"
  }'
```

After rejection, check notifications for the submitter:
```bash
curl http://localhost:3001/api/notifications?unreadOnly=true \
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

1. **Staff creates request** → No notification
2. **Manager approves** → Notification sent to Contrôleur
3. **Contrôleur approves** → Notification sent to Direction
4. **Direction approves** → Notification sent to Économe
5. **Économe approves** → Notification sent to original submitter (workflow complete)
6. **Any rejection** → Notification sent to original submitter

## Troubleshooting

### No notifications appearing?
- Check that the workflow was created (auto-created on request creation)
- Verify user roles match the expected approval chain
- Check server logs for notification errors

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
