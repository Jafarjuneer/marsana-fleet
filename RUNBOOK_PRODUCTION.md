# Production Runbook

Comprehensive guide for deploying, monitoring, and maintaining Marsana Fleet in production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Process](#deployment-process)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [72-Hour Monitoring](#72-hour-monitoring)
5. [Incident Response](#incident-response)
6. [Rollback Procedures](#rollback-procedures)
7. [Maintenance Windows](#maintenance-windows)

## Pre-Deployment Checklist

### 48 Hours Before Deployment

- [ ] Verify all staging tests pass
- [ ] Review release notes and changelog
- [ ] Confirm database migration plan
- [ ] Verify backup strategy
- [ ] Notify stakeholders of deployment window
- [ ] Prepare rollback plan
- [ ] Schedule on-call engineers

### 24 Hours Before Deployment

- [ ] Final staging verification
- [ ] Database backup on production
- [ ] Review monitoring dashboards
- [ ] Verify alert configurations
- [ ] Test communication channels
- [ ] Confirm deployment credentials

### 1 Hour Before Deployment

- [ ] Final code review
- [ ] Verify all secrets are configured
- [ ] Confirm deployment environment
- [ ] Start monitoring dashboard
- [ ] Notify team in Slack
- [ ] Prepare rollback scripts

## Deployment Process

### Step 1: Database Migration

```bash
# 1. Backup current database
supabase db backups create --name "pre-v1.0.0-rc1"

# 2. Run migrations in production
# Via Vercel deployment or manual:
DATABASE_URL=<prod-db> pnpm db:push

# 3. Verify migration success
# Check for any migration errors in logs
# Verify schema changes in Supabase dashboard
```

### Step 2: Application Deployment

```bash
# Option A: Via Vercel (Recommended)
# 1. Merge PR to main branch
# 2. Vercel automatically deploys
# 3. Monitor deployment in Vercel dashboard

# Option B: Manual Deployment
# 1. Build application
pnpm build

# 2. Deploy to Vercel
vercel --prod

# 3. Monitor deployment progress
```

### Step 3: Verify Deployment

```bash
# 1. Check application health
curl https://app.marsana.com/api/health

# 2. Verify database connectivity
# Check Supabase dashboard for active connections

# 3. Test critical flows
# - Login
# - Vehicle list
# - Handshake creation
# - Document upload

# 4. Check error tracking
# Verify Sentry is receiving events
```

## Post-Deployment Verification

### Immediate (0-15 minutes)

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Application Health | `curl /api/health` | 200 OK |
| Database Connection | Check Supabase dashboard | Connected |
| Error Rate | Check Sentry dashboard | < 1% |
| API Latency | Check Vercel metrics | < 500ms p95 |
| Realtime Subscriptions | Check Supabase dashboard | Active |

### Short-term (15 minutes - 1 hour)

- [ ] Monitor error rate in Sentry
- [ ] Check database query performance
- [ ] Verify email notifications are sending
- [ ] Test handshake workflow end-to-end
- [ ] Verify document upload/download
- [ ] Check realtime updates on dashboard

### Medium-term (1 hour - 24 hours)

- [ ] Monitor for any performance degradation
- [ ] Verify all scheduled jobs are running
- [ ] Check email delivery rates
- [ ] Monitor database backup completion
- [ ] Verify monitoring alerts are working

## 72-Hour Monitoring

### Hour 1-24: Critical Monitoring

**Every 15 minutes:**
- Check error rate in Sentry
- Verify API response times
- Monitor database connections
- Check realtime subscription health

**Every hour:**
- Review application logs
- Check database query performance
- Verify email delivery
- Monitor system resources

**Every 4 hours:**
- Full system health check
- Verify all integrations working
- Check backup completion
- Review user feedback

### Hour 24-48: Standard Monitoring

**Every hour:**
- Check error rate
- Monitor API latency
- Verify database health
- Check scheduled jobs

**Every 4 hours:**
- Review logs for anomalies
- Verify backup completion
- Check integration health

### Hour 48-72: Transition to Normal Operations

**Every 4 hours:**
- Standard health checks
- Error rate monitoring
- Performance metrics review

**Daily:**
- Review logs
- Check backup completion
- Verify all systems operational

## Incident Response

### Error Rate Spike (> 5%)

1. **Immediate Actions**
   - Page on-call engineer
   - Check Sentry for error patterns
   - Review recent deployments
   - Check system resources

2. **Investigation**
   - Identify affected endpoints
   - Check database performance
   - Review error logs
   - Check third-party services

3. **Mitigation**
   - Scale up application if needed
   - Disable non-critical features
   - Implement rate limiting
   - Prepare rollback if necessary

### Database Performance Degradation

1. **Immediate Actions**
   - Check active connections
   - Review slow query logs
   - Check database size
   - Monitor CPU/memory

2. **Investigation**
   - Identify slow queries
   - Check for table locks
   - Review recent migrations
   - Check index usage

3. **Mitigation**
   - Kill long-running queries
   - Optimize queries
   - Add indexes if needed
   - Scale database if necessary

### Third-Party Service Failure (SendGrid, Mapbox, Sentry)

1. **Immediate Actions**
   - Verify service status
   - Check API credentials
   - Review error logs
   - Notify users if critical

2. **Investigation**
   - Check service status page
   - Verify API keys
   - Review request logs
   - Check rate limits

3. **Mitigation**
   - Implement fallback behavior
   - Queue failed requests
   - Use cached data if available
   - Notify users of degradation

## Rollback Procedures

### Quick Rollback (< 5 minutes)

```bash
# 1. Revert Vercel deployment to previous version
vercel rollback

# 2. Verify application is back online
curl https://app.marsana.com/api/health

# 3. Notify team
# Post in Slack #incidents channel
```

### Database Rollback (if migration failed)

```bash
# 1. Restore from backup
supabase db backups restore <backup-id>

# 2. Verify database integrity
# Check schema in Supabase dashboard

# 3. Redeploy application
vercel --prod

# 4. Verify all systems operational
```

### Full Rollback (application + database)

```bash
# 1. Restore database from backup
supabase db backups restore <backup-id>

# 2. Revert application deployment
vercel rollback

# 3. Verify all systems
curl https://app.marsana.com/api/health

# 4. Investigate root cause
# Review logs and error reports

# 5. Notify stakeholders
# Send incident report
```

## Maintenance Windows

### Scheduled Maintenance

**Frequency**: Monthly (first Sunday, 2-4 AM UTC)

**Activities**:
- Database optimization
- Index maintenance
- Log cleanup
- Security patches
- Dependency updates

**Communication**:
- Announce 1 week in advance
- Post maintenance banner
- Send email notification
- Monitor during window

### Emergency Maintenance

**Trigger**: Security vulnerability, critical bug, data corruption

**Process**:
1. Assess severity and impact
2. Notify stakeholders immediately
3. Prepare hotfix
4. Deploy to staging
5. Verify fix
6. Deploy to production
7. Monitor closely
8. Send post-incident report

## Monitoring Dashboards

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error Rate | < 0.5% | > 1% |
| API Latency (p95) | < 500ms | > 1000ms |
| Database Latency | < 100ms | > 200ms |
| Uptime | > 99.9% | < 99.5% |
| Email Delivery Rate | > 99% | < 95% |
| Realtime Latency | < 100ms | > 500ms |

### Dashboard URLs

- **Sentry**: https://sentry.io/organizations/marsana/
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://app.supabase.com/
- **Datadog**: https://app.datadoghq.com/ (if configured)

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Engineer | TBD | TBD | TBD |
| DevOps Lead | TBD | TBD | TBD |
| Product Manager | TBD | TBD | TBD |
| CEO | TBD | TBD | TBD |

## Post-Deployment Report Template

```markdown
# Deployment Report - v1.0.0-rc1

**Date**: 2026-02-03
**Deployed By**: [Name]
**Duration**: [Time]

## Changes
- [List of changes]

## Database Migrations
- [List of migrations]

## Verification Results
- [ ] Health checks passed
- [ ] Critical flows tested
- [ ] Error rate normal
- [ ] Performance acceptable

## Issues Encountered
- [Any issues and resolutions]

## Monitoring Status
- Error rate: [X]%
- API latency: [X]ms
- Uptime: [X]%

## Next Steps
- [Any follow-up items]

## Sign-off
- Deployed by: [Name]
- Verified by: [Name]
- Approved by: [Name]
```

---

**Last Updated**: 2026-02-03
**Status**: ✅ Ready for Production
**Review Frequency**: Quarterly
