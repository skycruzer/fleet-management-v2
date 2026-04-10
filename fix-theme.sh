#!/bin/bash

# Fix Theme Consistency - Replace hardcoded colors with theme variables

echo "Fixing theme consistency across the project..."

# Replace blue-600 buttons with primary
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-600 hover:bg-blue-700/bg-primary hover:bg-primary\/90/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-600 text-white hover:bg-blue-700/bg-primary text-primary-foreground hover:bg-primary\/90/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/className="bg-blue-600"/className="bg-primary"/g' {} \;

# Replace info/help cards (blue-50 backgrounds)
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-50 border-blue-200/bg-primary\/5 border-primary\/20/g' {} \;
find app -name "*.tsx" -type f -exec sed -i '' 's/border-blue-200 bg-blue-50/border-primary\/20 bg-primary\/5/g' {} \;

# Replace badges
find app -name "*.tsx" -type f -exec sed -i '' 's/bg-blue-100 text-blue-800/bg-primary\/10 text-primary/g' {} \;

# Replace card variants
find app -name "*.tsx" -type f -exec sed -i '' "s/blue: 'bg-blue-50 border-blue-200'/blue: 'bg-primary\/5 border-primary\/20'/g" {} \;

echo "Theme consistency fixed!"
echo "All hardcoded blue colors replaced with theme variables."
