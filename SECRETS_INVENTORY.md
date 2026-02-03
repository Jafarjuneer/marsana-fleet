# Secrets Inventory

This document lists all required environment variables and secrets for Marsana Fleet. Each secret is categorized by environment and usage.

## Secret Categories

### Core Application Secrets

| Secret Name | Environment | Purpose | Required | Exposure |
|-------------|-------------|---------|----------|----------|
| `VITE_APP_ID` | All | Manus OAuth application identifier | Yes | Public (client) |
| `JWT_SECRET` | All | Session cookie signing secret | Yes | Server-side only |
| `OAUTH_SERVER_URL` | All | Manus OAuth server base URL | Yes | Server-side only |
| `VITE_OAUTH_PORTAL_URL` | All | Manus OAuth login portal URL | Yes | Public (client) |
| `OWNER_OPEN_ID` | All | Owner's Manus OpenID | Yes | Server-side only |
| `OWNER_NAME` | All | Owner's display name | Yes | Server-side only |

### Database Secrets

| Secret Name | Environment | Purpose | Required | Exposure |
|-------------|-------------|---------|----------|----------|
| `DATABASE_URL` | All | Primary database connection string | Yes | Server-side only |
| `VITE_SUPABASE_URL` | All | Supabase project URL | Yes | Public (client) |
| `VITE_SUPABASE_ANON_KEY` | All | Supabase anonymous key (RLS enforced) | Yes | Public (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Supabase service role key (admin) | Yes | Server-side only |

### Third-Party API Secrets

| Secret Name | Environment | Purpose | Required | Exposure |
|-------------|-------------|---------|----------|----------|
| `SENDGRID_API_KEY` | Staging, Production | SendGrid email API key | No | Server-side only |
| `SENDGRID_FROM_EMAIL` | Staging, Production | SendGrid sender email address | No | Server-side only |
| `VITE_MAPBOX_ACCESS_TOKEN` | Staging, Production | Mapbox API access token | No | Public (client) |
| `VITE_SENTRY_DSN` | Staging, Production | Sentry error tracking DSN | No | Public (client) |

### Built-in Forge API Secrets

| Secret Name | Environment | Purpose | Required | Exposure |
|-------------|-------------|---------|----------|----------|
| `BUILT_IN_FORGE_API_URL` | All | Manus built-in APIs base URL | Yes | Server-side only |
| `BUILT_IN_FORGE_API_KEY` | All | Manus built-in APIs bearer token | Yes | Server-side only |
| `VITE_FRONTEND_FORGE_API_URL` | All | Manus built-in APIs URL for frontend | Yes | Public (client) |
| `VITE_FRONTEND_FORGE_API_KEY` | All | Manus built-in APIs key for frontend | Yes | Public (client) |

### Analytics & Monitoring Secrets

| Secret Name | Environment | Purpose | Required | Exposure |
|-------------|-------------|---------|----------|----------|
| `VITE_ANALYTICS_ENDPOINT` | All | Analytics service endpoint | No | Public (client) |
| `VITE_ANALYTICS_WEBSITE_ID` | All | Analytics website identifier | No | Public (client) |

## Environment-Specific Configuration

### Development

All secrets are configured in the Manus platform and automatically injected. No manual configuration needed.

### Staging

All secrets must be configured in GitHub Actions secrets with `STAGING_` prefix:

```
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_SERVICE_ROLE_KEY
STAGING_DATABASE_URL
STAGING_SENDGRID_API_KEY
STAGING_MAPBOX_ACCESS_TOKEN
STAGING_SENTRY_DSN
```

### Production

All secrets must be configured in:
1. **GitHub Actions** - For CI/CD pipeline
2. **Vercel** - For runtime environment
3. **Supabase** - For database access

## Security Verification Checklist

- [ ] **No secrets in code** - Verify no hardcoded secrets in source files
- [ ] **No secrets in git history** - Check git log for accidentally committed secrets
- [ ] **Server-side only enforcement** - Verify `SUPABASE_SERVICE_ROLE_KEY` is only used in server code
- [ ] **Client bundle audit** - Verify no private keys in client bundles
- [ ] **Rotation schedule** - Implement quarterly secret rotation
- [ ] **Access control** - Limit secret access to authorized personnel
- [ ] **Audit logging** - Enable audit logs for secret access

## Secret Rotation

### Quarterly Rotation Schedule

1. **Database Credentials** - Rotate `SUPABASE_SERVICE_ROLE_KEY` quarterly
2. **API Keys** - Rotate `SENDGRID_API_KEY`, `VITE_MAPBOX_ACCESS_TOKEN` quarterly
3. **JWT Secret** - Rotate `JWT_SECRET` semi-annually (requires session invalidation)

### Rotation Steps

1. Generate new secret in the respective service
2. Update GitHub Actions secrets
3. Update Vercel environment variables
4. Deploy to staging and verify
5. Deploy to production
6. Revoke old secret after 24-hour grace period

## Audit Trail

| Date | Secret | Action | By |
|------|--------|--------|-----|
| 2026-02-03 | All | Initial setup | System |
| TBD | TBD | Quarterly rotation | DevOps |

## Compliance Notes

- All secrets are encrypted at rest in GitHub and Vercel
- Secrets are never logged or printed to console
- Access to secrets is restricted to authorized CI/CD and deployment systems
- Secrets are rotated quarterly per security policy
- All secret access is audited and monitored

## Emergency Contact

For secret compromise or security incidents:
1. Immediately revoke the compromised secret
2. Contact security team
3. Rotate all related secrets
4. Review audit logs for unauthorized access
5. Deploy patches to all environments

---

**Last Updated**: 2026-02-03
**Status**: ✅ Complete
**Review Frequency**: Quarterly
