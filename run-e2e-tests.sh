#!/bin/bash

# E2E Test Execution Script with Environment Variables
# Workaround for Playwright not loading .env.test.local

echo "🧪 Starting E2E Test Suite"
echo "================================"

# Load test credentials from .env.test.local
export TEST_ADMIN_EMAIL="mrondeau@airniugini.com.pg"
export TEST_ADMIN_PASSWORD="TestPassword123"
export TEST_PILOT_EMAIL="mrondeau@airniugini.com.pg"
export TEST_PILOT_PASSWORD="TestPassword123"
export TEST_USER_EMAIL="mrondeau@airniugini.com.pg"
export TEST_USER_PASSWORD="TestPassword123"
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:3003"
export TEST_BASE_URL="http://localhost:3003"

echo "✅ Environment variables loaded"
echo "🎯 Running Playwright tests..."
echo ""

# Run Playwright tests with HTML and line reporters
npx playwright test --reporter=html,line --max-failures=10

echo ""
echo "================================"
echo "📊 Test execution complete"
echo "   View report: npx playwright show-report"
