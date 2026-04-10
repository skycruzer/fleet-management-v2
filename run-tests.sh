#!/bin/bash

# Load test environment variables
source .env.test.local

# Run Playwright tests
npx playwright test --reporter=html,line --max-failures=10
