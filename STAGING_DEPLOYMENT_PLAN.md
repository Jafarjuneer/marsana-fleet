# Phase 1.3 Staging Deployment & Verification Plan

**Deployment Date**: 2026-02-03
**Environment**: Staging (Supabase + Vercel Preview)
**Status**: ⏳ IN PROGRESS

## Overview

This document outlines the complete staging deployment process for Marsana Fleet v1.0.0-rc1, including deployment steps, verification procedures, and rollback plans.

## 1. Pre-Deployment Checklist

### Code Readiness
- [x] All unit tests passing (24/24)
- [x] TypeScript compilation clean (0 errors)
- [x] E2E tests configured (22+ tests)
- [x] Documentation complete
- [x] Demo scripts prepared
- [x] Security audit passed

### Infrastructure Readiness
- [x] Staging Supabase project available
- [x] Staging Vercel project configured
- [x] GitHub Actions workflows configured
- [x] Secrets configured in GitHub Actions
- [x] Database backup strategy verified
- [x] Monitoring (Sentry) configured

### Team Readiness
- [x] Deployment plan documented
- [x] Rollback procedures documented
- [x] Incident response plan ready
- [x] On-call rotation established
- [x] Communication channels ready

## 2. Deployment Process

### Phase 2.1: Database Migrations

**Steps**:
1. Connect to staging Supabase project
2. Run database migrations: `pnpm db:push`
3. Verify all tables created
4. Verify RLS policies applied
5. Verify indexes created
6. Verify audit triggers active

**Expected Output**:
```
✓ Migrations applied successfully
✓ 12 tables created/updated
✓ RLS policies enforced
✓ Audit triggers active
```

**Rollback**:
```bash
# Restore from backup if needed
supabase db backups restore <backup-id>
```

### Phase 2.2: Seed Data

**Steps**:
1. Load test data into staging
2. Create test users (super_admin, hq, branch_admin, driver, tech)
3. Create test vehicles (10+ vehicles with various statuses)
4. Create test branches (HQ, Corporate, B2C)
5. Verify data integrity

**Test Data Created**:
- 5 test users with different roles
- 15 test vehicles with various statuses
- 3 test branches
- Sample handshakes, inspections, alerts

### Phase 2.3: Application Deployment

**Steps**:
1. Deploy to Vercel staging environment
2. Verify environment variables set
3. Verify API endpoints accessible
4. Verify database connection working
5. Verify real-time subscriptions active

**Verification Commands**:
```bash
# Check API health
curl https://staging-marsana-fleet.vercel.app/api/health

# Check database connection
curl https://staging-marsana-fleet.vercel.app/api/db-health

# Check real-time connection
curl https://staging-marsana-fleet.vercel.app/api/realtime-health
```

## 3. Automated Testing

### Unit Tests
```bash
pnpm test
```

**Expected Results**:
- 24/24 tests passing
- Duration: < 1 second
- No errors or warnings

### TypeScript Check
```bash
pnpm check
```

**Expected Results**:
- 0 compilation errors
- 0 type warnings
- All types resolved

### Playwright E2E Tests
```bash
pnpm e2e
```

**Test Suites** (22+ tests):
- Authentication (6 tests)
- Vehicles (5 tests)
- Handshakes (4 tests)
- Inspections (3 tests)
- Real-time (2 tests)
- Notifications (2 tests)
- Maps (7 tests)

**Expected Results**:
- All tests passing
- No flaky tests
- Performance acceptable (< 5 minutes total)

## 4. Realtime Verification

### Demo Script Execution
```bash
pnpm tsx scripts/demo-realtime-simulation.ts
```

**Expected Behavior**:
1. Vehicle status changes appear in real-time
2. Handshake events appear without page refresh
3. Alerts appear in Alerts panel immediately
4. No console errors
5. WebSocket connection stable

### Dashboard Verification

**HQ Dashboard**:
- [ ] Vehicle count widget updates live
- [ ] Status distribution chart updates
- [ ] Recent alerts appear instantly
- [ ] Real-time indicator shows "Connected"

**Branch Dashboard**:
- [ ] Branch-specific vehicles update live
- [ ] Status changes reflect immediately
- [ ] Alerts appear without refresh

**Vehicles List**:
- [ ] New vehicles appear instantly
- [ ] Status changes visible immediately
- [ ] Deleted vehicles disappear
- [ ] Real-time indicator shows "Connected"

**Handshakes List**:
- [ ] New handshakes appear instantly
- [ ] Status changes visible immediately
- [ ] Completed handshakes move to history

**Alerts Panel**:
- [ ] New alerts appear instantly
- [ ] Alert count updates immediately
- [ ] Alert details visible

## 5. Email Verification

### Prerequisites
- SENDGRID_API_KEY set in GitHub Actions secrets
- SendGrid account verified and active
- Test email addresses configured

### Demo Script Execution
```bash
SENDGRID_API_KEY=your-key pnpm tsx scripts/demo-sendgrid-test.ts
```

### Trigger Tests

**Handshake Created**:
1. Create new handshake in UI
2. Verify email sent to receiver
3. Verify email contains vehicle info
4. Verify email contains sender name

**Handshake Accepted**:
1. Accept handshake in UI
2. Verify email sent to both parties
3. Verify email contains acceptance timestamp

**Maintenance Ticket**:
1. Create inspection with DAMAGE result
2. Verify maintenance ticket created
3. Verify email sent to assigned tech
4. Verify email contains ticket details

### Expected Results
- All emails delivered successfully
- No bounce or rejection
- SendGrid delivery logs show success
- Email content matches templates

## 6. Geofence Verification

### Demo Script Execution
```bash
pnpm tsx scripts/demo-geofence-simulation.ts
```

### Expected Behavior
1. Geofence created successfully
2. Telemetry points simulated
3. Entry alert created when vehicle enters
4. Exit alert created when vehicle exits
5. Alerts appear in Alerts panel

### Verification Steps
- [ ] Geofence visible on map
- [ ] Telemetry points displayed
- [ ] Entry/exit alerts created
- [ ] Alert metadata contains coordinates
- [ ] No console errors

## 7. Observability Verification

### Sentry Error Tracking

**Steps**:
1. Trigger a sample error in staging
2. Verify error appears in Sentry dashboard
3. Verify error context captured
4. Verify user context recorded
5. Verify breadcrumbs tracked

**Sample Error Trigger**:
```javascript
// In browser console
throw new Error("Test error for Sentry");
```

**Expected Results**:
- Error appears in Sentry within 5 seconds
- Error context includes user info
- Breadcrumbs show user actions
- Stack trace is readable

### Database Backups

**Verification Steps**:
1. Confirm daily backup schedule enabled
2. List available backups
3. Verify backup size and timestamp
4. Document restore procedure
5. Test restore on test database

**Commands**:
```bash
# List backups
supabase db backups list

# Restore from backup
supabase db backups restore <backup-id>
```

## 8. Performance Verification

### Load Testing
- API response time: < 500ms (p95)
- Database query time: < 100ms
- Real-time latency: < 100ms
- Page load time: < 2 seconds

### Monitoring
- CPU usage: < 50%
- Memory usage: < 70%
- Database connections: < 80% of limit
- Error rate: < 0.1%

## 9. Security Verification

### Secrets Audit
- [ ] No hardcoded secrets in code
- [ ] All secrets in GitHub Actions
- [ ] SUPABASE_SERVICE_ROLE_KEY server-side only
- [ ] No secrets in client bundles
- [ ] API keys properly scoped

### RLS Verification
- [ ] Users can only see own data
- [ ] Branch managers see only branch data
- [ ] Drivers see only assigned vehicles
- [ ] Admins see all data

### Authentication
- [ ] Login works correctly
- [ ] Session persists across refresh
- [ ] Logout clears session
- [ ] Token refresh works
- [ ] Role-based redirect works

## 10. Rollback Plan

### If Deployment Fails

**Immediate Actions**:
1. Revert Vercel deployment to previous version
2. Restore database from backup if needed
3. Notify team of rollback
4. Investigate root cause

**Vercel Rollback**:
```bash
# Revert to previous deployment
vercel rollback
```

**Database Rollback**:
```bash
# Restore from backup
supabase db backups restore <backup-id>
```

### If Tests Fail

**Steps**:
1. Identify failing test
2. Review test logs
3. Fix issue in code
4. Re-run tests
5. Re-deploy if all tests pass

## 11. Post-Deployment Monitoring

### 72-Hour Monitoring Protocol

**Hour 0-1**:
- Monitor error rate
- Monitor API response time
- Monitor database performance
- Verify real-time updates working

**Hour 1-24**:
- Monitor user activity
- Monitor email delivery
- Monitor alert creation
- Check for any issues reported

**Day 1-3**:
- Monitor system stability
- Collect performance metrics
- Review error logs
- Gather user feedback

### Metrics to Monitor
- Error rate (target: < 0.1%)
- API latency (target: < 500ms)
- Database latency (target: < 100ms)
- Real-time latency (target: < 100ms)
- Email delivery rate (target: > 99%)
- Uptime (target: > 99.9%)

## 12. Sign-Off Checklist

### Deployment Team
- [ ] Deployment completed successfully
- [ ] All tests passing
- [ ] No critical issues found
- [ ] Monitoring active
- [ ] Rollback plan ready

**Signed By**: _________________ **Date**: _____________

### QA Team
- [ ] All verification tests passed
- [ ] Real-time updates working
- [ ] Email triggers working
- [ ] Geofencing working
- [ ] No critical bugs found

**Signed By**: _________________ **Date**: _____________

### Product Team
- [ ] Features meet requirements
- [ ] User experience acceptable
- [ ] Performance acceptable
- [ ] Ready for production

**Signed By**: _________________ **Date**: _____________

## Appendix: Troubleshooting

### Common Issues

**Issue**: Database migration fails
**Solution**: Check migration logs, verify database connection, restore from backup if needed

**Issue**: Real-time updates not working
**Solution**: Verify Supabase Realtime enabled, check WebSocket connection, restart dev server

**Issue**: Email not sending
**Solution**: Verify SENDGRID_API_KEY set, check SendGrid dashboard, verify email addresses

**Issue**: Tests failing
**Solution**: Review test logs, check environment variables, run tests locally first

## Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Pre-deployment checks | 30 min | ⏳ |
| 2 | Database migrations | 15 min | ⏳ |
| 3 | Seed data | 10 min | ⏳ |
| 4 | Application deployment | 10 min | ⏳ |
| 5 | Unit tests | 5 min | ⏳ |
| 6 | E2E tests | 10 min | ⏳ |
| 7 | Realtime verification | 15 min | ⏳ |
| 8 | Email verification | 10 min | ⏳ |
| 9 | Geofence verification | 10 min | ⏳ |
| 10 | Observability check | 10 min | ⏳ |
| 11 | Final sign-off | 15 min | ⏳ |
| **Total** | | **2 hours** | |

---

**Plan Version**: 1.0
**Last Updated**: 2026-02-03
**Status**: ⏳ READY FOR EXECUTION
