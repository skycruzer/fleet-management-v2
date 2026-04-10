#!/bin/bash

# Fix Dark Mode Readability - Replace all hardcoded gray colors with theme variables

echo "Fixing dark mode readability across the project..."

# Replace text colors
find app -name "*.tsx" -type f -exec sed -i '' 's/text-gray-900/text-foreground/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/text-gray-800/text-foreground/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/text-gray-700/text-card-foreground/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/text-gray-600/text-muted-foreground/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/text-gray-500/text-muted-foreground/g' {} \;

# Replace background colors
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-gray-50/bg-muted\/50/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-gray-100/bg-muted/g' {} \;

# Replace border colors
find app -name "*.tsx" -type f -exec sed -i '' 's/border-gray-200/border-border/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/border-gray-300/border-border/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/divide-gray-200/divide-border/g' {} \;

# Replace hover states
find app -name "*.tsx" -type f -exec sed -i '' 's/hover:bg-gray-50/hover:bg-muted\/30/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/hover:bg-gray-100/hover:bg-muted\/50/g' {} \;

echo "Dark mode readability fixes complete!"
echo "All gray colors replaced with theme-aware variables."
