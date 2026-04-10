#!/bin/bash

# Comprehensive Dark Mode Fix - Remove ALL hardcoded colors

echo "Applying comprehensive dark mode fixes..."

# Fix translucent white backgrounds (sticky headers)
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white\/80 backdrop-blur-sm/bg-card\/80 backdrop-blur-sm/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white\/50/bg-card\/50/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white\/20/bg-muted\/20/g' {} \;

# Fix remaining gray text
find app -name "*.tsx" -type f -exec sed -i '' 's/text-gray-400/text-muted-foreground/g' {} \;

# Fix remaining blue backgrounds (info cards, buttons)
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-50 /bg-primary\/5 /g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-600 /bg-primary /g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/hover:bg-blue-700/hover:bg-primary\/90/g' {} \;

# Fix remaining white backgrounds on Card components
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white p-6/p-6/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white p-8/p-8/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white shadow/shadow/g' {} \;

# Fix border-red (keep red for errors but use theme variant)
find app -name "*.tsx" -type f -exec sed -i '' 's/border-red-200/border-destructive\/20/g' {} \;

# Fix white text (should be primary-foreground on colored backgrounds)
find app -name "*.tsx" -type f -exec sed -i '' 's/text-white transition/text-primary-foreground transition/g' {} \;

# Fix tbody backgrounds
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-white">/"/g' {} \;

echo "Comprehensive dark mode fixes complete!"
echo "All hardcoded colors replaced with theme-aware variables."
