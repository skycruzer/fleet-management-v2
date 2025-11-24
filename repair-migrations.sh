#!/bin/bash
echo "Repairing migration history..."

supabase migration repair --status reverted 20251027
supabase migration repair --status applied 20250119120000
supabase migration repair --status applied 20250119120001
supabase migration repair --status applied 20250119120002
supabase migration repair --status applied 20251027
supabase migration repair --status applied 20251028085737
supabase migration repair --status applied 20251029113229
supabase migration repair --status applied 20251029
supabase migration repair --status applied 20251030
supabase migration repair --status applied 20251102000001
supabase migration repair --status applied 20251102
supabase migration repair --status applied 20251103
supabase migration repair --status applied 20251104000001
supabase migration repair --status applied 20251104000002
supabase migration repair --status applied 20251104
supabase migration repair --status applied 20251111000000
supabase migration repair --status applied 20251111124215
supabase migration repair --status applied 20251111124223
supabase migration repair --status applied 20251116060204
supabase migration repair --status applied 20251116070000
supabase migration repair --status applied 20251118230934
supabase migration repair --status applied 20251119000001
supabase migration repair --status applied 20251119000002
supabase migration repair --status applied 20251119070637
supabase migration repair --status applied 20251120000001
supabase migration repair --status applied 20251120010000

echo "✅ Migration history repaired"
