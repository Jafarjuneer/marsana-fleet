#!/bin/bash

echo "🚀 Marsana Fleet Production Deployment Recovery"
echo "================================================"
echo ""

# Step 1: Verify build
echo "✅ Step 1: Verifying local build..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deployment."
  exit 1
fi
echo "✅ Build successful"
echo ""

# Step 2: Verify git status
echo "✅ Step 2: Verifying git status..."
git status
echo ""

# Step 3: Deploy to production
echo "✅ Step 3: Deploying to production..."
echo "Note: This requires Vercel CLI and proper authentication"
echo ""
echo "To deploy manually:"
echo "  1. Install Vercel CLI: npm i -g vercel"
echo "  2. Authenticate: vercel login"
echo "  3. Deploy: vercel deploy --prod"
echo ""
echo "Or use GitHub Actions to trigger deployment from main branch"
echo ""

# Step 4: Verify deployment
echo "✅ Step 4: After deployment, verify:"
echo "  1. Check production URL: https://marsana-fleet.vercel.app"
echo "  2. Run smoke tests: pnpm tsx scripts/smoke-tests.ts"
echo "  3. Monitor Sentry for errors"
echo ""

echo "✅ Deployment recovery script complete"
