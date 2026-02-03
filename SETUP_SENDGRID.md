# How to Get SendGrid API Key

SendGrid is used for sending email notifications (handshake confirmations, maintenance reminders, rental expiry alerts, etc.).

## Step-by-Step Guide

### 1. Create SendGrid Account
- Go to https://sendgrid.com/
- Click **"Sign Up"** button
- Fill in your details:
  - Email address
  - Password (min 8 characters)
  - Company name (optional)
- Click **"Create Account"**
- Verify your email address (check your inbox for verification link)

### 2. Access API Keys Section
- Log in to SendGrid at https://app.sendgrid.com/
- In the left sidebar, go to **Settings** → **API Keys**
- Or directly visit: https://app.sendgrid.com/settings/api_keys

### 3. Create New API Key
- Click the **"Create API Key"** button (top right)
- Choose API Key type: **Full Access** (or select specific permissions)
- Give it a name: `Marsana Fleet Production` or similar
- Click **"Create & View"**

### 4. Copy the API Key
- **IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
- The key will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Store it safely (copy to your Vercel environment variables)

### 5. Verify Sender Email (Optional but Recommended)
To avoid emails going to spam, verify your sender email:

- In SendGrid dashboard, go to **Settings** → **Sender Authentication**
- Click **"Verify a Single Sender"**
- Fill in sender details:
  - From Email: `noreply@marsana.com` (or your domain)
  - From Name: `Marsana Fleet`
  - Reply To Email: `support@marsana.com`
- Click **"Create"**
- SendGrid will send a verification email to the address you specified
- Click the verification link in the email
- Status will change to "Verified"

### 6. Test Email Sending (Optional)
To verify everything works:

```bash
# Install SendGrid CLI (optional)
npm install -g @sendgrid/cli

# Or test via API
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [
      {
        "to": [{"email": "your-email@example.com"}],
        "subject": "Test Email from Marsana Fleet"
      }
    ],
    "from": {"email": "noreply@marsana.com"},
    "content": [
      {
        "type": "text/plain",
        "value": "This is a test email from Marsana Fleet!"
      }
    ]
  }'
```

## Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Enter:
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your API key)
   - **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

## Email Templates Used in Marsana Fleet

The application sends emails for:
- **Handshake Created**: Notifies receiver of new handshake request
- **Handshake Accepted**: Confirms handshake acceptance
- **Handshake Completed**: Confirms handshake completion
- **Maintenance Ticket Created**: Alerts about vehicle maintenance needed
- **MSA Expiry Reminder**: 30/7/3 days before expiry
- **Rental Expiry Reminder**: 48/24 hours before rental ends

## Troubleshooting

**"Invalid API Key" error**
- Verify you copied the entire API key correctly
- Check that the key starts with `SG.`
- Ensure no extra spaces before/after the key

**Emails not sending**
- Check SendGrid dashboard → Email Activity for delivery logs
- Verify sender email is verified (if using custom domain)
- Check spam folder in recipient's email

**Rate limiting**
- SendGrid free tier: 100 emails/day
- Paid plans: Higher limits
- Upgrade if needed: https://sendgrid.com/pricing/

## Support

- SendGrid Docs: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com
