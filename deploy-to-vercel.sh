#!/bin/bash

echo "🚀 Fleet Management V2 - Vercel Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Pre-Deployment Checklist${NC}"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo -e "${GREEN}✅${NC} .env.local found"
else
    echo -e "${RED}❌${NC} .env.local NOT found"
    exit 1
fi

# Check build
echo ""
echo -e "${YELLOW}🔨 Checking build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Build succeeds"
else
    echo -e "${RED}❌${NC} Build failed - fix errors before deploying"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Vercel Environment Variables${NC}"
echo ""
echo "Before deploying, ensure these are set in Vercel Dashboard:"
echo "  → Vercel Dashboard → Settings → Environment Variables"
echo ""
echo "Required variables:"
echo "  • NEXT_PUBLIC_SUPABASE_URL"
echo "  • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  • SUPABASE_SERVICE_ROLE_KEY"
echo "  • UPSTASH_REDIS_REST_URL"
echo "  • UPSTASH_REDIS_REST_TOKEN"
echo "  • RESEND_API_KEY"
echo "  • RESEND_FROM_EMAIL"
echo "  • CRON_SECRET (use: QQJB_NOXnUAlTMUJFkim5eFoFx4utHEw7eh9R6v0rd8)"
echo "  • NEXT_PUBLIC_APP_URL (your production URL)"
echo ""
echo -e "${YELLOW}Have you set all environment variables in Vercel? (y/n)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Please set environment variables first:"
    echo "  1. Go to: https://vercel.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Settings → Environment Variables"
    echo "  4. Add all variables listed above"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Starting deployment...${NC}"
echo ""

# Deploy to production
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test admin login at your production URL"
    echo "  2. Run verification: PRODUCTION_URL=https://your-app.vercel.app node verify-deployment.mjs"
    echo "  3. Monitor logs: vercel logs --prod"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check Vercel logs for details"
    exit 1
fi
