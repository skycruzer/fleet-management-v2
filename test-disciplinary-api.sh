#!/bin/bash
# Test Disciplinary Form API - November 2, 2025
# Author: Maurice Rondeau

echo "🧪 Testing Disciplinary Form API Fixes"
echo "========================================"

# Get auth token (you'll need to login first)
# This assumes you have a valid session

BASE_URL="http://localhost:3000"
MATTER_ID="610fa8d5-7042-4d68-bb93-8b5fe97bcbe8"  # From dev logs

echo ""
echo "Test 1: Update matter with empty assigned_to (UUID field)"
echo "-----------------------------------------------------------"

curl -X PATCH "${BASE_URL}/api/disciplinary/${MATTER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Matter Update",
    "assigned_to": "",
    "severity": "medium"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "Test 2: Update matter with valid severity (lowercase)"
echo "-----------------------------------------------------------"

curl -X PATCH "${BASE_URL}/api/disciplinary/${MATTER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "high"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "Test 3: Try invalid severity (should fail)"
echo "-----------------------------------------------------------"

curl -X PATCH "${BASE_URL}/api/disciplinary/${MATTER_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "MODERATE"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "========================================"
echo "✅ Tests complete"
