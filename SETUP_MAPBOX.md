# How to Get Mapbox Access Token

Mapbox is used for displaying vehicle locations on maps, route history, and geofencing features.

## Step-by-Step Guide

### 1. Create Mapbox Account
- Go to https://www.mapbox.com/
- Click **"Sign Up"** button
- Choose sign-up method:
  - Email and password
  - Google account
  - GitHub account
- Fill in your details
- Click **"Create Account"**
- Verify your email (check inbox for verification link)

### 2. Access Tokens Page
- Log in to Mapbox at https://account.mapbox.com/
- In the left sidebar, click **"Tokens"**
- Or directly visit: https://account.mapbox.com/tokens/

### 3. Create New Access Token
- Click the **"Create a token"** button
- Fill in token details:
  - **Name**: `Marsana Fleet Production`
  - **Scopes**: Select the following:
    - ✅ `styles:read` - Read map styles
    - ✅ `fonts:read` - Read fonts
    - ✅ `datasets:read` - Read datasets
    - ✅ `maps:read` - Read maps
    - ✅ `geospatial:read` - Read geospatial data (for geofencing)
  - **Resource restrictions** (optional):
    - Leave blank for now (or restrict to your domain later)
  - **Public/Secret**: Choose **Public** (for frontend use)

### 4. Copy the Access Token
- Click **"Create token"**
- The token will appear in the list
- Click the token to view it
- Copy the token value (starts with `pk.`)
- It will look like: `pk.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. Test the Token (Optional)
You can test the token in Mapbox Studio:
- Go to https://studio.mapbox.com/
- Create a new style or edit existing
- The token should work automatically

## Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add New"**
4. Enter:
   - **Name**: `VITE_MAPBOX_ACCESS_TOKEN`
   - **Value**: `pk.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your access token)
   - **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

## Features Enabled by Mapbox

With Mapbox integrated, Marsana Fleet can:
- **Vehicle Tracking**: Display current vehicle location on map
- **Route History**: Show vehicle movement history for last 7 days
- **Route Playback**: Replay vehicle routes with timestamp controls
- **Geofencing**: Create polygons and get alerts when vehicles enter/exit
- **Map Controls**: Zoom, pan, and reset map view
- **Multiple Layers**: Show traffic, satellite, terrain views

## Pricing

- **Free Tier**: 
  - 50,000 map views/month
  - 5 uploads/month
  - Perfect for development and testing

- **Paid Plans**:
  - Starting at $5/month
  - Unlimited map views
  - More uploads and features

Check pricing: https://www.mapbox.com/pricing/

## Troubleshooting

**"Invalid access token" error**
- Verify you copied the entire token correctly
- Check that the token starts with `pk.`
- Ensure no extra spaces before/after the token
- Verify token has correct scopes (maps:read, geospatial:read)

**Map not loading**
- Check browser console for errors
- Verify token is public (not secret)
- Check that token hasn't expired
- Verify domain is allowed (if restrictions set)

**Geofencing not working**
- Ensure `geospatial:read` scope is enabled
- Check that polygons are created correctly
- Verify telemetry data is being sent

**Rate limiting**
- Free tier: 50,000 map views/month
- Each map load = 1 view
- Upgrade to paid plan if needed

## Support

- Mapbox Docs: https://docs.mapbox.com
- Mapbox Support: https://support.mapbox.com
- Mapbox Studio: https://studio.mapbox.com/

## API Reference

Mapbox GL JS (used in Marsana Fleet):
- Documentation: https://docs.mapbox.com/mapbox-gl-js/
- Examples: https://docs.mapbox.com/mapbox-gl-js/examples/
- API Reference: https://docs.mapbox.com/mapbox-gl-js/api/
