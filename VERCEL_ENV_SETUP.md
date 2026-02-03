# Vercel Environment Variables Setup Guide

This guide provides all the environment variables you need to configure for Marsana Fleet deployment on Vercel.

## How to Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter each variable name and value from the sections below
5. Select which environments to apply to (Production, Preview, Development)
6. Click **Save**

---

## Required Environment Variables

### SUPABASE CONFIGURATION (Required)
Get these from your Supabase project settings → API

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- `VITE_SUPABASE_URL`: Supabase Dashboard → Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API → anon (public) key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → service_role (secret) key

---

### AUTHENTICATION & OAUTH (Required)
Get these from Manus platform settings

```
VITE_APP_ID=your-manus-app-id
JWT_SECRET=your-jwt-secret-key-min-32-chars-long
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name
```

**Where to find:**
- Contact Manus support or check your project settings for these credentials

---

### MANUS BUILT-IN APIS (Required)
Get these from Manus platform settings

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

---

### SENDGRID EMAIL SERVICE (Required for notifications)
Get API key from https://app.sendgrid.com/settings/api_keys

```
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@marsana.com
```

**Steps:**
1. Create SendGrid account at https://sendgrid.com
2. Go to Settings → API Keys
3. Create a new API key with Mail Send permissions
4. Copy the key and paste as `SENDGRID_API_KEY`

---

### MAPBOX MAPS INTEGRATION (Required for vehicle tracking)
Get access token from https://account.mapbox.com/tokens/

```
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-access-token
```

**Steps:**
1. Create Mapbox account at https://mapbox.com
2. Go to Account → Tokens
3. Create a new token with public scope
4. Copy the token and paste as `VITE_MAPBOX_ACCESS_TOKEN`

---

### SENTRY ERROR TRACKING (Required for production monitoring)
Get DSN from https://sentry.io/settings/

```
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
```

**Steps:**
1. Create Sentry account at https://sentry.io
2. Create a new project for Node.js + React
3. Go to Settings → Client Keys (DSN)
4. Copy the DSN and paste as `VITE_SENTRY_DSN`

---

### OPTIONAL: ANALYTICS

```
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

---

## Environment Variable Checklist

Use this checklist to verify all variables are set before deploying:

- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] VITE_APP_ID
- [ ] JWT_SECRET
- [ ] OAUTH_SERVER_URL
- [ ] OWNER_OPEN_ID
- [ ] OWNER_NAME
- [ ] BUILT_IN_FORGE_API_URL
- [ ] BUILT_IN_FORGE_API_KEY
- [ ] VITE_FRONTEND_FORGE_API_URL
- [ ] VITE_FRONTEND_FORGE_API_KEY
- [ ] SENDGRID_API_KEY
- [ ] SENDGRID_FROM_EMAIL
- [ ] VITE_MAPBOX_ACCESS_TOKEN
- [ ] VITE_SENTRY_DSN

---

## Vercel Deployment Steps

1. **Connect GitHub Repository**
   - Go to Vercel Dashboard
   - Click "Add New" → "Project"
   - Import `calvinkey7919/marsana-fleet` from GitHub
   - Click "Import"

2. **Configure Environment Variables**
   - In the import dialog, click "Environment Variables"
   - Add all variables from sections above
   - Or add them after deployment in Project Settings

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (5-10 minutes)
   - Vercel will provide your production URL

4. **Verify Deployment**
   - Visit the provided URL
   - Login with test credentials
   - Run smoke tests to verify all systems operational

---

## Troubleshooting

**Build fails with "Missing environment variable"**
- Check that all required variables are set in Vercel
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding variables

**Application shows blank page**
- Check browser console for errors
- Verify Supabase credentials are correct
- Check Sentry for error details

**Email notifications not sending**
- Verify SENDGRID_API_KEY is correct
- Check SendGrid dashboard for delivery logs
- Ensure SENDGRID_FROM_EMAIL is verified in SendGrid

**Maps not loading**
- Verify VITE_MAPBOX_ACCESS_TOKEN is correct
- Check Mapbox account for token status
- Ensure token has public scope

---

## Support

For issues with specific services:
- **Supabase**: https://supabase.com/docs
- **SendGrid**: https://sendgrid.com/docs
- **Mapbox**: https://docs.mapbox.com
- **Sentry**: https://docs.sentry.io
- **Manus**: Contact support at https://help.manus.im
