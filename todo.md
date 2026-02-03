# Marsana Fleet - Project TODO

## Phase 1: Database Schema & Infrastructure
- [x] Create database schema with all required tables (branches, users, vehicles, handshakes, inspections, rentals, corporates, alerts, audit_logs, telemetry)
- [x] Set up RLS policies for role-based access control
- [x] Create helper functions (current_user_role, current_user_branch)
- [ ] Set up storage buckets (vehicle-docs, inspection-photos, handshake-docs, contracts)
- [x] Create audit trigger for audit_logs
- [x] Seed initial data (branches, roles, test users)

## Phase 2: Authentication & Authorization
- [x] Configure Supabase Auth integration
- [x] Implement role-based access control (super_admin, hq, branch_admin, driver, tech, corporate_admin)
- [x] Create protected procedures with role validation
- [ ] Implement login page with email/password and SSO
- [x] Set up session management and logout flow
- [ ] Create role-based route guards

## Phase 3: Core Layout & Navigation
- [ ] Build global layout with top bar (logo, breadcrumb, notifications, user avatar)
- [ ] Create sidebar navigation with role-based menu items
- [ ] Implement branch selector dropdown for branch_admin and driver
- [ ] Build PageShell component with consistent padding and breadcrumbs
- [ ] Set up responsive design for mobile and desktop

## Phase 4: Dashboard Pages
- [x] Build HQ Dashboard (/dashboard/hq) with widgets and real-time updates
- [ ] Build Branch Dashboard (/dashboard/branch) with branch-specific metrics
- [x] Implement dashboard widgets (vehicles count, accidents, maintenance pending, SLA overdue)
- [ ] Add real-time Supabase subscriptions for alerts and handshakes
- [ ] Create Export CSV functionality

## Phase 5: Vehicle Management
- [x] Build Vehicles list page (/vehicles) with search and filters
- [ ] Create Vehicle details page (/vehicles/[id]) with tabs
- [ ] Implement Add Vehicle modal
- [ ] Implement Edit Vehicle modal
- [ ] Implement Change Status modal with state machine validation
- [x] Implement Delete Vehicle with soft-delete
- [ ] Add bulk actions (bulk status change, export selected)
- [ ] Create Documents tab with upload/download/replace/delete
- [ ] Create Service History tab with maintenance tickets
- [ ] Create Telemetry tab with GPS/speed charts
- [ ] Create Movement History tab with handshake timeline

## Phase 6: Handshakes System
- [ ] Build Handshakes list page (/handshakes)
- [ ] Create Create Handshake form with vehicle selector
- [ ] Implement Accept Handshake flow (transactional update)
- [ ] Implement Reject Handshake with reason
- [ ] Implement Complete Handshake flow
- [ ] Add handshake document uploads
- [ ] Create incoming handshake cards with preview

## Phase 7: Inspections Module
- [ ] Build Inspections list page (/inspection)
- [ ] Create Inspection form with vehicle selector and checklist
- [ ] Implement photo upload for inspections
- [ ] Implement result selection (CLEAN, DAMAGE, SERVICE_DUE)
- [ ] Add automatic maintenance ticket creation for DAMAGE/SERVICE_DUE
- [ ] Create inspection history view
- [ ] Implement Reopen inspection functionality
- [ ] Add Download photos functionality

## Phase 8: Rentals Management
- [ ] Build Rentals list page (/rentals)
- [ ] Create Create Rental form with customer info and vehicle selector
- [ ] Implement contract upload functionality
- [ ] Create Active rentals view
- [ ] Implement Return Vehicle flow with odometer/fuel recording
- [ ] Add photos for return condition
- [ ] Implement automatic inspection task creation on return

## Phase 9: Corporates Management
- [ ] Build Corporates list page (/corporates)
- [ ] Create Corporate details page
- [ ] Implement Corporate edit form
- [ ] Add MSA upload functionality
- [ ] Display assigned vehicles for corporate
- [ ] Show corporate rates and active rentals
- [ ] Implement MSA expiry alerts (30/7/3 days)

## Phase 10: Alerts & Notifications
- [ ] Build Alerts list page (/alerts)
- [ ] Create Alert detail modal
- [ ] Implement Acknowledge alert functionality
- [ ] Implement Assign alert to user
- [ ] Implement Escalate alert to HQ
- [ ] Add alert history view
- [ ] Set up real-time alert notifications
- [ ] Create toast notifications for critical alerts

## Phase 11: Driver Portal
- [ ] Build Driver Portal page (/driver) with mobile-optimized UI
- [ ] Create active task card display
- [ ] Implement checklist functionality
- [ ] Add photo upload for driver tasks
- [ ] Implement Mark Task Completed with confirmation
- [ ] Add offline photo queueing (optional)
- [ ] Implement sync status indicator

## Phase 12: State Machine & Business Logic
- [ ] Implement vehicle status state machine validation
- [ ] Create server-side transition validation
- [ ] Add side effects for status transitions (create alerts, maintenance tickets)
- [ ] Implement handshake transactional logic
- [ ] Add rental return inspection task creation
- [ ] Create maintenance ticket generation

## Phase 13: Real-time Features
- [ ] Set up Supabase Realtime subscriptions for alerts
- [ ] Implement real-time handshake updates
- [ ] Add real-time vehicle status updates
- [ ] Create toast notifications for real-time events
- [ ] Implement optimistic UI updates

## Phase 14: File Storage & Documents
- [ ] Configure S3 storage buckets
- [ ] Implement signed URL generation for downloads
- [ ] Create document upload handlers
- [ ] Implement file naming pattern {bucket}/{year}/{month}/{entity}/{uuid}_{filename}
- [ ] Add thumbnail generation for photos
- [ ] Create document preview functionality

## Phase 15: Audit & Logging
- [ ] Implement audit log trigger on database
- [ ] Create audit log viewer
- [ ] Add audit logging to all mutations
- [ ] Implement user action tracking
- [ ] Create audit trail for vehicle transfers

## Phase 16: Testing
- [ ] Write unit tests for state machine validation
- [ ] Write integration tests for vehicle operations
- [ ] Write integration tests for handshakes
- [ ] Write E2E tests for critical flows (login, vehicle creation, handshake)
- [ ] Write E2E tests for role-based access
- [ ] Create test fixtures and seed data

## Phase 17: CI/CD & Deployment
- [ ] Configure GitHub Actions for migrations
- [ ] Set up GitHub Actions for tests
- [ ] Configure Vercel deployment
- [ ] Set up environment variables
- [ ] Create deployment documentation

## Phase 18: Documentation & Delivery
- [ ] Create API documentation
- [ ] Write deployment guide
- [ ] Create user manual for different roles
- [ ] Document state machine transitions
- [ ] Create database schema documentation

## Completed Items
(None yet)

## Phase 1.1: Auth, Vehicle Details, and Handshakes/Inspections (Priority)
- [x] Integrate Supabase Auth with email/password and magic link (auth middleware created)
- [x] Map auth.uid() to users.id in database (sync function implemented)
- [ ] Add server session handling and client session refresh
- [ ] Implement role-based redirect after login (super_admin/hq -> /dashboard/hq, branch_admin -> /dashboard/branch, driver -> /driver)
- [ ] Create protected route wrapper with role-based access enforcement
- [x] Build login page UI with error handling
- [ ] Add logout modal with Confirm/Cancel behavior
- [x] Create Vehicle Details page (/vehicles/[id]) with tabs (Overview, Documents, Service History, Telemetry, Movement History)
- [x] Implement Change Status modal with state machine validation and reason field
- [ ] Create server endpoint POST /api/vehicles/:id/change-status with transactional logic
- [ ] Implement Documents tab with upload/download/delete via Supabase Storage
- [x] Build Handshakes list page with Create form and Incoming cards
- [x] Implement Accept Handshake transactional flow (update status, set IN_TRANSIT, audit log, notify)
- [x] Implement Complete Handshake flow (update status, change branch, set PENDING_INSPECTION)
- [x] Build Inspections form with checklist, photo upload, and result selection
- [x] Implement automatic maintenance ticket and alert creation for DAMAGE/SERVICE_DUE
- [ ] Add Playwright E2E tests for login/logout, vehicle details, Change Status, handshakes, inspections
- [ ] Add unit tests for server endpoints and state machine validation
- [ ] Commit to GitHub and create PR with documentation
