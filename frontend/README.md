# ApprovalFlow PWA Frontend

Progressive Web Application built with React 18, TypeScript, and Tailwind CSS for the ApprovalFlow approval workflow management system.

## Tech Stack

- **React 18.2** - Modern React with hooks
- **TypeScript 5.2** - Type safety
- **Vite 5** - Fast build tool and dev server
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Zustand 4.4** - Lightweight state management
- **React Router 6.20** - Client-side routing
- **Axios 1.6** - HTTP client with interceptors
- **date-fns 3.0** - Date formatting
- **vite-plugin-pwa 0.17** - Progressive Web App support

## Features

### Authentication
- Login/Register pages with JWT token management
- Auto token refresh with axios interceptors
- Protected routes with role-based access control

### Dashboard
- Role-specific views for STAFF, MANAGER, CONTROLEUR, DIRECTION, ECONOME
- Stats cards showing pending/approved/rejected requests
- Recent requests overview
- Quick action buttons

### Request Management
- Create new requests with multiple items
- Dynamic form with add/remove items
- Request list with filtering (All, Pending, In Progress, Approved, Rejected)
- Detailed request view with timeline
- Visual workflow progress indicator

### UI Components
- `StatusBadge` - Colored status indicators
- `RequestCard` - Request list item
- `Timeline` - Chronological event history
- `MainLayout` - Responsive sidebar navigation
- `AuthLayout` - Centered auth pages

### PWA Features
- Service worker with Workbox
- Offline support with runtime caching
- Install prompt
- App manifest for home screen installation
- API caching (24h expiration)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AuthLayout.tsx       # Centered layout for auth pages
│   │   │   └── MainLayout.tsx       # Sidebar + content layout
│   │   └── ui/
│   │       ├── RequestCard.tsx      # Request list item
│   │       ├── StatusBadge.tsx      # Status badge component
│   │       └── Timeline.tsx         # Event timeline
│   ├── lib/
│   │   └── api.ts                   # API client with interceptors
│   ├── pages/
│   │   ├── DashboardPage.tsx        # Role-specific dashboard
│   │   ├── LoginPage.tsx            # Login form
│   │   ├── RegisterPage.tsx         # Registration form
│   │   ├── RequestsPage.tsx         # Request list with filters
│   │   ├── RequestDetailPage.tsx    # Request detail + timeline
│   │   ├── NewRequestPage.tsx       # Request creation form
│   │   └── ProfilePage.tsx          # User profile
│   ├── store/
│   │   ├── authStore.ts             # Auth state (Zustand)
│   │   └── requestStore.ts          # Request state (Zustand)
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                      # Router + route guards
│   ├── main.tsx                     # App entry point
│   └── index.css                    # Tailwind + custom styles
├── public/                          # Static assets
├── index.html                       # HTML template
├── vite.config.ts                   # Vite + PWA configuration
├── tailwind.config.js               # Tailwind theme
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies
```

## Development

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Create `.env` file:
```bash
VITE_API_URL=http://localhost:3000/api
```

### Run Development Server
```bash
npm run dev
```
App runs on http://localhost:5173

### Build for Production
```bash
npm run build
```
Output in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

## API Integration

The frontend integrates with the backend API at `/api`:

### Endpoints Used
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user
- `GET /api/requests` - List requests
- `GET /api/requests/:id` - Get request details
- `POST /api/requests` - Create request
- `GET /api/workflows/request/:id` - Get workflow status
- `GET /api/requests/:id/approvals` - Get approval history

### Auth Flow
1. User logs in → receives access token (15min) + refresh token (7 days)
2. Tokens stored in localStorage
3. Axios interceptor adds Bearer token to all requests
4. On 401 error → auto refresh token → retry request
5. If refresh fails → logout + redirect to /login

## Responsive Design

- **Desktop (lg)**: Sidebar navigation + content area
- **Mobile**: Bottom tab navigation + hamburger menu
- Breakpoints: sm (640px), md (768px), lg (1024px)

## Offline Support

Service worker caches:
- Static assets (JS, CSS, HTML, images)
- API responses (24h cache with NetworkFirst strategy)
- Works offline after first visit

## Color Palette

```css
primary: #2563eb (blue-600)
success: #22c55e (green-500)
warning: #f59e0b (yellow-500)
danger: #ef4444 (red-500)
gray-50 to gray-900 (neutral scale)
```

## TypeScript

Strict mode enabled with:
- No implicit any
- Unused locals/parameters checked
- Fallthrough cases checked
- Path aliases: `@/*` → `./src/*`

## Build Output

Production build generates:
- Optimized JS bundle (~266 KB gzipped to 85 KB)
- CSS bundle (~16 KB gzipped to 4 KB)
- Service worker for offline support
- PWA manifest
- Total: ~277 KB precached

## Next Steps (Week 10)

1. **Signature Pad**
   - HTML5 canvas for visual signatures
   - Touch/mouse drawing support
   - Save as PNG to backend

2. **Biometric Authentication**
   - WebAuthn API integration
   - Fingerprint/face recognition
   - Secure credential storage

3. **Comment Thread UI**
   - Real-time comment updates
   - Email notification integration
   - Markdown support

4. **Advanced PWA Features**
   - Background sync
   - Push notifications
   - Install prompt customization
   - Share target API

5. **Mobile Optimization**
   - Touch gesture support
   - Native app-like animations
   - Haptic feedback
   - Camera integration for attachments

6. **E2E Testing**
   - Playwright or Cypress
   - Critical user flows
   - Mobile viewport testing

7. **Performance Optimization**
   - Code splitting by route
   - Image lazy loading
   - Virtual scrolling for long lists
   - Bundle analysis

## License

MIT
