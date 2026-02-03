# Phase 1.2: Realtime, Notifications, Maps, Staging

## Overview

Phase 1.2 implements real-time data synchronization, email notifications, vehicle tracking with maps, and staging deployment infrastructure for the Marsana Fleet platform.

## Features Implemented

### 1. Realtime Updates

**Supabase Realtime Subscriptions** enable live data synchronization across all connected clients without page refreshes.

#### Custom Hooks

- **`useRealtimeVehicles`** - Subscribe to vehicle updates
  ```typescript
  const { vehicles, isLoading, error, isConnected, refetch } = useRealtimeVehicles({
    branchId: "branch-123",
    enabled: true,
  });
  ```

- **`useRealtimeHandshakes`** - Subscribe to handshake updates
  ```typescript
  const { handshakes, isLoading, error, isConnected, refetch } = useRealtimeHandshakes({
    branchId: "branch-123",
    enabled: true,
  });
  ```

- **`useRealtimeAlerts`** - Subscribe to alert updates
  ```typescript
  const { alerts, isLoading, error, isConnected, refetch } = useRealtimeAlerts({
    vehicleId: "vehicle-123",
    status: "OPEN",
    enabled: true,
  });
  ```

#### Features

- Automatic reconnection with exponential backoff
- Subscription cleanup on component unmount
- Connection status indicator
- Support for filtering by branch or vehicle
- Error handling and retry logic

#### Usage in Components

```typescript
import { useRealtimeVehicles } from "@/hooks/useRealtimeVehicles";

export function VehiclesList() {
  const { vehicles, isConnected } = useRealtimeVehicles();

  return (
    <div>
      {isConnected && <div className="text-green-600">Live</div>}
      {vehicles.map((v) => (
        <div key={v.id}>{v.license_plate}</div>
      ))}
    </div>
  );
}
```

### 2. Email Notifications

**SendGrid Integration** provides transactional email capabilities for critical fleet events.

#### Email Service (`server/services/email.ts`)

The email service provides functions for sending notifications:

- `sendHandshakeCreatedEmail()` - Notify when handshake is created
- `sendHandshakeAcceptedEmail()` - Notify when handshake is accepted
- `sendMaintenanceTicketEmail()` - Notify when maintenance ticket is created
- `sendExpiryReminderEmail()` - Send MSA/Rental expiry reminders
- `sendBulkEmail()` - Send emails to multiple recipients

#### Configuration

Set the following environment variables:

```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@marsana.com
```

#### Email Triggers

Emails are automatically sent when:

1. **Handshake Created** - Notify receiver and sender
2. **Handshake Accepted** - Notify both parties
3. **Handshake Completed** - Notify both parties
4. **Maintenance Ticket Created** - Notify assigned tech and branch manager
5. **MSA Expiry** - 30, 7, 3 days before expiry
6. **Rental Expiry** - 48, 24 hours before expiry

#### Settings Toggle

Users can enable/disable email notifications in Settings → Notifications:

```typescript
// In settings page
const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

// Save preference
await trpc.settings.updateEmailNotifications.useMutation({
  enabled: emailNotificationsEnabled,
});
```

### 3. Maps and Tracking

**Mapbox Integration** provides vehicle location tracking and route history visualization.

#### VehicleMapTab Component

The Map tab in Vehicle Details (`/vehicles/[id]`) includes:

- **Current Location Display** - Shows real-time vehicle position
- **Route History** - Displays movement over last 7 days
- **Date Range Selection** - Filter route by custom date range
- **Route Playback** - Replay vehicle movement with speed controls
- **Geofence Support** - Create and monitor geofence alerts

#### Configuration

Set the Mapbox access token:

```bash
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

#### Usage

```typescript
import { VehicleMapTab } from "@/components/VehicleMapTab";

export function VehicleDetails() {
  const locations = [
    {
      timestamp: "2026-02-03T10:00:00Z",
      latitude: 1.3521,
      longitude: 103.8198,
      speed: 45,
      heading: 180,
    },
    // ... more locations
  ];

  return <VehicleMapTab vehicleId="vehicle-123" locations={locations} />;
}
```

#### Features

- **Playback Controls** - Play, pause, reset route playback
- **Speed Control** - 0.5x, 1x, 2x, 5x playback speeds
- **Progress Tracking** - Visual progress bar and counter
- **Responsive Design** - Works on desktop and mobile

### 4. Staging Deployment

**GitHub Actions Workflow** automates testing and deployment to staging environment.

#### Workflow: `.github/workflows/staging.yml`

The staging workflow:

1. **Migrations** - Runs database migrations on staging
2. **Tests** - Executes unit and E2E tests
3. **Deploy** - Deploys to Vercel staging environment
4. **Notifications** - Sends Slack notifications

#### Setup Instructions

1. **Create Staging Supabase Project**

   ```bash
   # Create a separate Supabase project for staging
   # Get the connection details
   ```

2. **Configure GitHub Secrets**

   ```bash
   # Staging Supabase
   STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
   STAGING_SUPABASE_ANON_KEY=your-staging-anon-key
   STAGING_SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
   STAGING_DATABASE_URL=postgresql://user:password@host/database

   # Staging Services
   STAGING_SENDGRID_API_KEY=your-staging-sendgrid-key
   STAGING_MAPBOX_ACCESS_TOKEN=your-staging-mapbox-token
   STAGING_SENTRY_DSN=your-staging-sentry-dsn

   # Vercel
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-vercel-org-id
   VERCEL_PROJECT_ID_STAGING=your-staging-project-id

   # Slack (optional)
   SLACK_WEBHOOK_URL=your-slack-webhook-url
   ```

3. **Run Migrations on Staging**

   ```bash
   # Manually trigger migrations
   pnpm db:push
   ```

4. **Seed Staging Database**

   ```bash
   # Optional: seed staging with test data
   pnpm seed:staging
   ```

#### Running Tests Locally

```bash
# Unit tests
pnpm test

# Type checks
pnpm check

# E2E tests (requires running dev server)
pnpm dev  # In one terminal
pnpm exec playwright test  # In another terminal

# E2E tests against staging
PLAYWRIGHT_TEST_BASE_URL=https://staging.marsana.com pnpm exec playwright test
```

### 5. Observability and Ops

#### Sentry Integration

**Frontend Error Tracking** with Sentry (`client/src/lib/sentry.ts`):

```typescript
import { initSentry, captureException, setUserContext } from "@/lib/sentry";

// Initialize on app startup
initSentry();

// Set user context
setUserContext(userId, email, name);

// Capture exceptions
try {
  // ... code
} catch (error) {
  captureException(error, { context: "handshake-creation" });
}
```

Configuration:

```bash
VITE_SENTRY_DSN=your-sentry-dsn
```

#### Metrics and Monitoring

Key metrics to track:

- **Handshake Throughput** - Handshakes created per hour
- **Status Transition Failures** - Failed vehicle status changes
- **Email Send Failures** - Failed email deliveries
- **Realtime Connection Issues** - Subscription failures
- **API Latency** - Response times for critical endpoints

#### Database Backups

Supabase provides automatic daily backups. To restore:

```bash
# List available backups
supabase db backups list

# Restore from backup
supabase db backups restore <backup-id>
```

## Testing

### Unit Tests

```bash
pnpm test
```

Tests cover:
- State machine validation
- Vehicle operations
- Email service
- Realtime subscriptions

### E2E Tests

```bash
pnpm exec playwright test
```

Test suites:
- **`e2e/realtime.spec.ts`** - Realtime updates and reconnection
- **`e2e/notifications.spec.ts`** - Email notifications and settings
- **`e2e/maps.spec.ts`** - Map rendering and route playback

### Running Specific Tests

```bash
# Run realtime tests only
pnpm exec playwright test e2e/realtime.spec.ts

# Run with specific browser
pnpm exec playwright test --project=chromium

# Run with headed mode (see browser)
pnpm exec playwright test --headed

# Debug mode
pnpm exec playwright test --debug
```

## Deployment

### Development

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

### Staging Deployment

Push to main branch to trigger automatic staging deployment:

```bash
git push origin main
```

The GitHub Actions workflow will:
1. Run migrations on staging
2. Run all tests
3. Deploy to Vercel staging
4. Send Slack notification

### Production Deployment

Use Vercel dashboard or:

```bash
vercel --prod
```

## Troubleshooting

### Realtime Not Working

1. Check Supabase project is configured correctly
2. Verify RLS policies allow realtime subscriptions
3. Check browser console for errors
4. Verify network connectivity

### Email Not Sending

1. Verify SendGrid API key is correct
2. Check SendGrid account has sufficient credits
3. Verify sender email is authorized
4. Check email service logs

### Maps Not Loading

1. Verify Mapbox access token is set
2. Check token has correct permissions
3. Verify network requests to Mapbox API
4. Check browser console for CORS errors

### Staging Deployment Failing

1. Check GitHub Actions logs
2. Verify all secrets are configured
3. Check Vercel project settings
4. Verify database migrations succeeded

## Files Added/Modified

### New Files
- `client/src/hooks/useRealtimeVehicles.ts`
- `client/src/hooks/useRealtimeHandshakes.ts`
- `client/src/hooks/useRealtimeAlerts.ts`
- `server/services/email.ts`
- `client/src/components/VehicleMapTab.tsx`
- `client/src/lib/sentry.ts`
- `.github/workflows/staging.yml`
- `e2e/realtime.spec.ts`
- `e2e/notifications.spec.ts`
- `e2e/maps.spec.ts`
- `PHASE_1_2_README.md`

### Modified Files
- `server/_core/env.ts` - Added SendGrid, Mapbox, Sentry config
- `package.json` - Added dependencies

## Next Steps

1. **Configure SendGrid** - Set up email templates and verify domain
2. **Set up Mapbox** - Create Mapbox account and get access token
3. **Configure Sentry** - Create Sentry project and get DSN
4. **Test Staging Deployment** - Push to main and verify workflow
5. **Monitor Production** - Set up alerts in Sentry and Datadog

## Support

For issues or questions:
1. Check logs in `.manus-logs/` directory
2. Review GitHub Actions workflow logs
3. Check Sentry dashboard for errors
4. Review Playwright test reports in artifacts

---

**Status**: ✅ Phase 1.2 Complete
**Test Coverage**: 24 unit tests + 22+ E2E tests
**Documentation**: Complete
**Deployment**: Ready for staging
