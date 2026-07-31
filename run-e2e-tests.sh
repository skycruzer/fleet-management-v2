#!/bin/bash

# E2E Test Execution Script with Environment Variables
# Workaround for Playwright not loading .env.test.local

echo "🧪 Starting E2E Test Suite"
echo "================================"

# Load test credentials from .env.test.local
# Passwords default to a per-run generated value; override via environment or .env.test.local.
# Never hardcode real credentials here (guard: scripts/check-no-hardcoded-credentials.mjs).
E2E_RUN_ID="${E2E_RUN_ID:-$(date +%s)}"
export TEST_ADMIN_EMAIL="${TEST_ADMIN_EMAIL:-mrondeau@airniugini.com.pg}"
export TEST_ADMIN_PASSWORD="${TEST_ADMIN_PASSWORD:-Test!${E2E_RUN_ID}}"
export TEST_PILOT_EMAIL="${TEST_PILOT_EMAIL:-mrondeau@airniugini.com.pg}"
export TEST_PILOT_PASSWORD="${TEST_PILOT_PASSWORD:-Test!${E2E_RUN_ID}}"
export TEST_USER_EMAIL="${TEST_USER_EMAIL:-mrondeau@airniugini.com.pg}"
export TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-Test!${E2E_RUN_ID}}"
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
