# Phase 1.1: Auth, Documents & E2E Tests

## Overview

This phase completes the core authentication system, vehicle documents management, and comprehensive end-to-end testing for Marsana Fleet. The implementation includes Supabase Auth integration, role-based redirect logic, transactional handshakes and inspections, and a complete Playwright test suite.

## Key Features Implemented

### 1. Supabase Authentication
- **Email/Password Login**: Users can sign in with email and password
- **Magic Link Authentication**: Alternative login method via email link
- **Session Management**: Automatic session handling and refresh
- **Role-Based Redirect**: After login, users are redirected based on their role:
  - `super_admin` or `hq` → `/dashboard/hq`
  - `branch_admin` → `/dashboard/branch`
  - `driver` → `/driver`

### 2. Logout Flow
- **Confirmation Modal**: "Confirm Logout" dialog with Cancel and Logout buttons
- **Transactional Logout**: 
  - Calls `supabase.auth.signOut()`
  - Clears client-side state (localStorage, sessionStorage)
  - Writes audit log entry
  - Redirects to `/login`

### 3. Vehicle Documents Management
- **Upload**: Upload documents to Supabase Storage with automatic path generation
- **Download**: Generate signed URLs for secure downloads (1-hour expiry)
- **Delete**: Delete documents with confirmation modal
- **Storage Path Pattern**: `{bucket}/{year}/{month}/{entity}/{uuid}_{filename}`
- **Audit Logging**: All upload/delete operations logged

### 4. Change Status Endpoint
- **State Machine Validation**: Validates transitions against canonical state machine
- **Transactional Updates**: Updates vehicle, creates maintenance tickets/alerts, logs audit
- **Reason Requirement**: Enforces reason field for ACCIDENT and MAINTENANCE statuses
- **Side Effects**: Automatically creates maintenance tickets and alerts when needed

### 5. Handshakes & Inspections
- **Handshake Accept**: Transactional update with status change to IN_TRANSIT
- **Handshake Complete**: Updates vehicle branch and status to PENDING_INSPECTION
- **Inspection Creation**: Photo upload to inspection-photos bucket
- **Automatic Ticket Creation**: Creates maintenance tickets for DAMAGE/SERVICE_DUE results

### 6. End-to-End Testing
- **Playwright Configuration**: Multi-browser testing (Chrome, Firefox, Safari, Mobile)
- **Auth Tests**: Login/logout flow, mode switching, error handling
- **Vehicle Tests**: Details page navigation, status transitions, document upload
- **Handshakes Tests**: Accept/reject/complete flows, status validation
- **Inspections Tests**: Creation, result tracking, integration tests

## Running the Application

### Prerequisites
- Node.js 22+
- pnpm 10.4+
- Supabase account with project configured
- Environment variables set in `.env`

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
pnpm db:push

# Seed initial data (if needed)
pnpm seed
```

### Development Server

```bash
# Start dev server
pnpm dev

# Server runs on http://localhost:3000
```

### Running Tests

```bash
# Run unit tests
pnpm test

# Run E2E tests (requires dev server running)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Debug E2E tests
pnpm test:e2e:debug
```

## Test Coverage

### Unit Tests (24 tests)
- State machine validation (valid/invalid transitions)
- Mileage updates and validation
- Vehicle filtering and pagination
- Supabase connection verification
- Auth logout functionality

### E2E Tests (30+ tests)
- **Auth (6 tests)**
  - Login page display
  - Password/magic link mode toggle
  - Empty credentials validation
  - Email format validation
  - Logout modal display and cancellation
  - Complete logout flow

- **Vehicles (8 tests)**
  - Vehicles list display
  - Vehicle details navigation
  - Tab navigation (Overview, Documents, Service, Telemetry, History)
  - Change Status modal
  - State machine transition validation
  - Reason requirement for ACCIDENT status
  - Document upload
  - Back navigation

- **Handshakes (8 tests)**
  - Handshakes list display
  - Handshake card rendering
  - Accept button visibility
  - Accept handshake action
  - Complete button visibility
  - Complete handshake action
  - Integration test (handshake → inspection)

- **Inspections (8 tests)**
  - Inspections list display
  - Inspection card rendering
  - Result badge display
  - New Inspection button
  - Damage icon for damaged inspections
  - Maintenance icon for service due
  - Navigation to details
  - Integration test with handshakes

## Database Schema

### Key Tables
- `users`: User accounts with role and branch assignment
- `vehicles`: Fleet vehicles with status tracking
- `handshakes`: Vehicle transfers between branches
- `inspections`: Vehicle condition checks with photos
- `maintenance_tickets`: Service and repair tracking
- `alerts`: System alerts and notifications
- `audit_logs`: Complete audit trail of all changes
- `vehicle_documents`: Document metadata and storage references

### RLS Policies
All tables have Row Level Security (RLS) policies enforcing:
- Role-based access (super_admin, hq, branch_admin, driver, tech, corporate_admin)
- Branch-level isolation for branch_admin and driver roles
- Audit trail for all modifications

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/magic-link` - Send magic link
- `POST /api/auth/logout` - Sign out user

### Vehicles
- `GET /api/vehicles` - List vehicles (with filters)
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles/:id/change-status` - Change vehicle status
- `GET /api/vehicles/:id/documents` - List vehicle documents

### Handshakes
- `GET /api/handshakes` - List handshakes
- `POST /api/handshakes/:id/accept` - Accept handshake
- `POST /api/handshakes/:id/complete` - Complete handshake

### Inspections
- `GET /api/inspections` - List inspections
- `POST /api/inspections` - Create inspection
- `POST /api/inspections/:id/upload-photos` - Upload inspection photos

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marsana

# Auth
JWT_SECRET=your-jwt-secret

# OAuth (if using Manus OAuth)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

## Deployment

### Vercel Deployment
```bash
# Build
pnpm build

# Deploy
vercel deploy
```

### GitHub Actions CI/CD
The project includes GitHub Actions workflows for:
- Unit tests on every push/PR
- E2E tests on every push/PR
- Type checking
- Playwright report generation

## Known Limitations & Future Work

1. **Authentication**: Currently uses Supabase Auth. Manus OAuth integration pending.
2. **Real-time Updates**: Supabase Realtime subscriptions not yet implemented for live dashboard updates.
3. **Notifications**: Email and in-app notifications system pending.
4. **Maps Integration**: Google Maps integration for vehicle tracking pending.
5. **File Storage**: S3 storage integration pending (currently using Supabase Storage).

## Troubleshooting

### Tests Failing
- Ensure dev server is running: `pnpm dev`
- Check Supabase credentials in `.env`
- Clear Playwright cache: `rm -rf .playwright`

### Auth Not Working
- Verify Supabase URL and keys in `.env`
- Check browser console for auth errors
- Ensure user exists in Supabase Auth

### Documents Upload Failing
- Verify Supabase Storage bucket exists: `vehicle-docs`
- Check storage permissions in Supabase dashboard
- Ensure file size < 50MB

## Support & Questions

For issues or questions, please:
1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check Playwright documentation: https://playwright.dev/docs

## Next Steps

1. **Implement Real-time Features**: Add Supabase Realtime subscriptions for live dashboard updates
2. **Email Notifications**: Set up email notifications for alerts and handshakes
3. **Google Maps Integration**: Add vehicle tracking and geofencing
4. **Mobile App**: Build React Native mobile app for drivers
5. **Advanced Analytics**: Add analytics dashboard with fleet metrics

---

**Phase 1.1 Status**: ✅ Complete
**Test Coverage**: 24 unit tests + 30+ E2E tests
**Last Updated**: 2026-02-03
