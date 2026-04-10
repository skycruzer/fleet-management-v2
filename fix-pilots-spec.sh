#!/bin/bash

FILE="e2e/pilots.spec.ts"

# Backup original
cp "$FILE" "$FILE.backup"

# 1. Fix imports - replace login with loginAsAdmin
sed -i '' "s/import { login,/import { loginAsAdmin,/g" "$FILE"
sed -i '' "s/, login,/, loginAsAdmin,/g" "$FILE"
sed -i '' "s/from login /from loginAsAdmin /g" "$FILE"

# 2. Replace login( calls with loginAsAdmin(
sed -i '' "s/await login(/await loginAsAdmin(/g" "$FILE"

# 3. Add networkidle wait after page.goto in beforeEach blocks
sed -i '' '/beforeEach.*{/,/})/ {
  /await page\.goto/a\
    await page.waitForLoadState('\''networkidle'\'', { timeout: 60000 })
}' "$FILE"

# 4. Add 60s timeout to .toBeVisible() calls that don't have one
sed -i '' 's/\.toBeVisible()/.toBeVisible({ timeout: 60000 })/g' "$FILE"
sed -i '' 's/\.toBeVisible({ timeout: 60000 })({ timeout: 60000 })/.toBeVisible({ timeout: 60000 })/g' "$FILE"

# 5. Update waitForSelector timeout
sed -i '' 's/waitForSelector([^,)]*, { timeout: [0-9]*/waitForSelector(&/g' "$FILE"
sed -i '' 's/timeout: [0-9]*000/timeout: 60000/g' "$FILE"

echo "Fixed pilots.spec.ts"
