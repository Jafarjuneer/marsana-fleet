# How to Get Sentry DSN

Sentry is used for error tracking and monitoring. It captures frontend and backend errors, performance issues, and provides real-time alerts.

## Step-by-Step Guide

### 1. Create Sentry Account
- Go to https://sentry.io/
- Click **"Get started"** or **"Sign Up"**
- Choose sign-up method:
  - Email and password
  - GitHub account
  - Google account
- Fill in your details
- Click **"Create Account"**
- Verify your email (check inbox for verification link)

### 2. Create a New Project
- Log in to Sentry at https://sentry.io/
- Click **"Projects"** in the left sidebar
- Or go directly to: https://sentry.io/organizations/your-org/projects/
- Click **"Create Project"** button
- Select platform: Choose **Node.js** (for backend) or **React** (for frontend)
- For Marsana Fleet, create two projects:
  - **Project 1**: `marsana-fleet-frontend` (React)
  - **Project 2**: `marsana-fleet-backend` (Node.js)

### 3. Get the DSN for Frontend Project

**For Frontend (React):**
- After creating the React project, you'll see setup instructions
- Look for the **DSN** (Data Source Name)
- It will look like: `https://your-key@sentry.io/your-project-id`
- Copy this value

**Alternative method:**
- Go to **Settings** → **Client Keys (DSN)**
- Copy the DSN from there

### 4. Get the DSN for Backend Project

**For Backend (Node.js):**
- After creating the Node.js project, you'll see setup instructions
- Look for the **DSN** (Data Source Name)
- Copy this value

### 5. Configure Sentry in Marsana Fleet

The application uses a single DSN for both frontend and backend:
- Use the **Frontend DSN** as `VITE_SENTRY_DSN`
- The backend will automatically use the same DSN

## Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Enter:
   - **Name**: `VITE_SENTRY_DSN`
   - **Value**: `https://your-key@sentry.io/your-project-id` (your DSN)
   - **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

## Features Enabled by Sentry

With Sentry integrated, Marsana Fleet can:
- **Error Tracking**: Capture all JavaScript errors with stack traces
- **Performance Monitoring**: Track API response times and database latency
- **Release Tracking**: Monitor errors by release version
- **User Feedback**: Collect user feedback when errors occur
- **Alerts**: Get notified of critical errors in real-time
- **Dashboards**: Visualize error trends and performance metrics

## Sentry Dashboard Features

After deploying with Sentry, you can:

**View Errors**
- Go to **Issues** to see all captured errors
- Click on an error to see full stack trace
- View affected users and browsers
- See error frequency over time

**Performance Monitoring**
- Go to **Performance** to see transaction traces
- Monitor API endpoint latency
- Identify slow database queries
- Track frontend performance

**Releases**
- Go to **Releases** to track errors by version
- Compare error rates between versions
- Rollback tracking

**Alerts**
- Go to **Alerts** to set up notifications
- Get notified via email, Slack, or PagerDuty
- Set thresholds for error rates

## Pricing

- **Free Tier**:
  - 5,000 errors/month
  - 1 project
  - Perfect for development and testing

- **Paid Plans**:
  - Starting at $29/month
  - Unlimited projects
  - More events and features

Check pricing: https://sentry.io/pricing/

## Troubleshooting

**"Invalid DSN" error**
- Verify you copied the entire DSN correctly
- Check that the DSN starts with `https://`
- Ensure no extra spaces before/after the DSN
- Verify the project is active in Sentry

**Errors not appearing in Sentry**
- Check browser console for Sentry errors
- Verify DSN is correct
- Ensure Sentry is initialized before errors occur
- Check that error sampling rate is not set to 0

**Performance data not showing**
- Verify tracesSampleRate is set to 1.0 (100%) for testing
- In production, set to 0.1 (10%) to reduce costs
- Check that transactions are being created

**Rate limiting**
- Free tier: 5,000 errors/month
- Upgrade to paid plan if needed
- Use sampling to reduce event volume

## Support

- Sentry Docs: https://docs.sentry.io
- Sentry Support: https://support.sentry.io
- Sentry Community: https://forum.sentry.io/

## Monitoring Checklist for Production

After deploying to production with Sentry, monitor:

1. **Error Rate**: Should be < 0.1% (target)
2. **Critical Errors**: Any errors with "critical" tag
3. **Performance**: API latency should be < 500ms
4. **Database**: Query latency should be < 100ms
5. **User Impact**: Number of affected users per error
6. **Release Health**: Compare error rates between versions

## Example: Viewing Your First Error

1. Deploy Marsana Fleet to production
2. Try to trigger an error (e.g., invalid login)
3. Go to Sentry dashboard → **Issues**
4. You should see the error listed
5. Click on it to see full details:
   - Stack trace
   - Affected users
   - Browser/OS info
   - Request headers
   - User context
