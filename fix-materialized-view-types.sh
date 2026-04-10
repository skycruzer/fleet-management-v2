#!/bin/bash

# Fix materialized view type errors across all affected files
# This script adds proper type casting for pilot_dashboard_metrics view

echo "Fixing materialized view type errors..."

# Fix dashboard-service-v4.ts - main query function
sed -i '' '157a\
    // Note: pilot_dashboard_metrics is a materialized view not in generated types
' lib/services/dashboard-service-v4.ts

sed -i '' 's/\.from('\''pilot_dashboard_metrics'\'')/\.from('\''pilot_dashboard_metrics'\'' as any)/g' lib/services/dashboard-service-v4.ts

# Add type cast for viewData in dashboard-service-v4.ts
sed -i '' '172a\
    const typedViewData = viewData as unknown as PilotDashboardMetrics
' lib/services/dashboard-service-v4.ts

# Replace all viewData references with typedViewData in dashboard-service-v4.ts
sed -i '' 's/viewData\.total_pilots/typedViewData.total_pilots/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.active_pilots/typedViewData.active_pilots/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.total_captains/typedViewData.total_captains/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.total_first_officers/typedViewData.total_first_officers/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.training_captains/typedViewData.training_captains/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.examiners/typedViewData.examiners/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.total_certifications/typedViewData.total_certifications/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.valid_certifications/typedViewData.valid_certifications/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.expiring_soon_certifications/typedViewData.expiring_soon_certifications/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.expired_certifications/typedViewData.expired_certifications/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.compliance_rate/typedViewData.compliance_rate/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.pending_leave/typedViewData.pending_leave/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.approved_leave/typedViewData.approved_leave/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.rejected_leave/typedViewData.rejected_leave/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.total_expired/typedViewData.total_expired/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.total_expiring_30_days/typedViewData.total_expiring_30_days/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.pilots_nearing_retirement/typedViewData.pilots_nearing_retirement/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.pilots_due_retire_2_years/typedViewData.pilots_due_retire_2_years/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.last_refreshed/typedViewData.last_refreshed/g' lib/services/dashboard-service-v4.ts
sed -i '' 's/viewData\.category_compliance/typedViewData.category_compliance/g' lib/services/dashboard-service-v4.ts

# Fix API routes - dashboard/refresh/route.ts
sed -i '' 's/\.from('\''pilot_dashboard_metrics'\'')/\.from('\''pilot_dashboard_metrics'\'' as any)/g' app/api/dashboard/refresh/route.ts
sed -i '' 's/(viewData as any)\?\.last_refreshed/(viewData as unknown as Pick<PilotDashboardMetrics, '\''last_refreshed'\''>)\?\.last_refreshed/g' app/api/dashboard/refresh/route.ts

# Add import to dashboard refresh route
sed -i '' '24a\
import type { PilotDashboardMetrics } from '\''@/types/database-views'\''
' app/api/dashboard/refresh/route.ts

# Fix API routes - cache/health/route.ts
sed -i '' 's/\.from('\''pilot_dashboard_metrics'\'')/\.from('\''pilot_dashboard_metrics'\'' as any)/g' app/api/cache/health/route.ts
sed -i '' 's/(viewData as any)\?\.last_refreshed/(viewData as unknown as Pick<PilotDashboardMetrics, '\''last_refreshed'\''>)\?\.last_refreshed/g' app/api/cache/health/route.ts

# Add import to cache health route
sed -i '' '23a\
import type { PilotDashboardMetrics } from '\''@/types/database-views'\''
' app/api/cache/health/route.ts

# Remove unused @ts-expect-error comments
sed -i '' '/\/\/ @ts-expect-error - pilot_dashboard_metrics is a materialized view not in generated types/d' app/api/dashboard/refresh/route.ts
sed -i '' '/\/\/ @ts-expect-error - pilot_dashboard_metrics is a materialized view not in generated types/d' app/api/cache/health/route.ts

echo "✓ Materialized view type fixes applied!"
echo "Files updated:"
echo "  - lib/services/dashboard-service-v4.ts"
echo "  - app/api/dashboard/refresh/route.ts"
echo "  - app/api/cache/health/route.ts"
