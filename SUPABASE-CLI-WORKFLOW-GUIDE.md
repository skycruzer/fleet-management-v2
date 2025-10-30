# Supabase CLI & Automation Workflow Guide

**Date**: October 28, 2025
**Purpose**: Stop using manual SQL editor, automate with CLI/MCP/Docker

---

## 🎯 Why Use CLI/MCP/Docker Instead of Web Editor?

**Current Problem**: Manually copying SQL into Supabase web editor
- ❌ No version control
- ❌ No automation
- ❌ Error-prone
- ❌ Can't reproduce
- ❌ Can't rollback

**Better Solution**: Use proper tooling
- ✅ Version controlled migrations
- ✅ Automated deployment
- ✅ Reproducible
- ✅ Easy rollback
- ✅ CI/CD integration

---

## 🛠️ Option 1: Supabase CLI (Recommended)

### Setup

You already have Supabase CLI installed! ✅

```bash
# Check version
supabase --version
# Output: 2.53.6

# Update to latest
brew upgrade supabase
```

### Workflow

#### 1. Create Migration
```bash
# Create new migration file
supabase migration new create_my_table

# File created at: supabase/migrations/20251028085737_create_my_table.sql
```

#### 2. Write SQL
Edit the migration file:
```sql
-- supabase/migrations/20251028085737_create_my_table.sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);
```

#### 3. Test Locally (Optional but Recommended)
```bash
# Start local Supabase
supabase start

# Apply migrations locally
supabase db reset

# Test your migration works
```

#### 4. Push to Production
```bash
# Push all new migrations
supabase db push

# Or push with verification
supabase db push --dry-run  # Preview changes
supabase db push            # Actually apply
```

### Current Issue

The `db push` command is failing because of an error in an older migration:
```
ERROR: functions in index predicate must be marked IMMUTABLE
At: 20251027_add_performance_indexes.sql
```

**Fix**: Edit `supabase/migrations/20251027_add_performance_indexes.sql` and remove/fix the problematic index.

---

## 🔗 Option 2: Direct Database Connection

### Using psql

#### Get Connection String
```bash
# From Supabase Dashboard
# Settings → Database → Connection String (Direct connection)
# Example: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

#### Apply Migration
```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Apply migration
psql $DATABASE_URL < supabase/migrations/20251028085737_create_leave_bid_options_table.sql
```

### Using npm Script

Add to `package.json`:
```json
{
  "scripts": {
    "db:migrate": "supabase db push",
    "db:migrate:dry": "supabase db push --dry-run",
    "db:reset:local": "supabase db reset",
    "db:types": "supabase gen types typescript --local > types/supabase.ts"
  }
}
```

Then:
```bash
npm run db:migrate
```

---

## 🐳 Option 3: Docker (Local Development)

### Start Supabase Locally

You already have local Supabase running! ✅

```bash
# Check status
supabase status

# Your local setup:
# Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# Studio URL: http://127.0.0.1:54323
# MCP URL: http://127.0.0.1:54321/mcp
```

### Apply Migrations to Local
```bash
# Reset database with all migrations
supabase db reset

# Or apply specific migration
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < supabase/migrations/20251028085737_create_leave_bid_options_table.sql
```

### Test Locally Before Production
```bash
# 1. Start local Supabase
supabase start

# 2. Reset with migrations
supabase db reset

# 3. Test your app
npm run dev

# 4. If works, push to production
supabase db push
```

---

## 🔌 Option 4: MCP Integration

### What is MCP?

**Model Context Protocol (MCP)** - Your local Supabase exposes an MCP endpoint:
```
MCP URL: http://127.0.0.1:54321/mcp
```

### Using MCP for Database Operations

MCP allows programmatic access to Supabase. You can:
- Query database
- Execute migrations
- Manage tables
- Handle RLS policies

### Setup MCP Client

Create `scripts/apply-migration-mcp.ts`:
```typescript
import { MCPClient } from '@modelcontextprotocol/sdk'

const client = new MCPClient('http://127.0.0.1:54321/mcp')

async function applyMigration(sql: string) {
  const result = await client.call('execute_sql', { sql })
  console.log('Migration applied:', result)
}

// Read migration file
const migrationSQL = await Bun.file('supabase/migrations/20251028085737_create_leave_bid_options_table.sql').text()

// Apply it
await applyMigration(migrationSQL)
```

Then:
```bash
bun run scripts/apply-migration-mcp.ts
```

---

## 📦 Recommended Workflow

### Daily Development

```bash
# 1. Work on feature
# 2. Need database change?

# Create migration
supabase migration new add_my_feature

# 3. Edit migration file
# Add your SQL

# 4. Test locally
supabase db reset

# 5. Test app
npm run dev

# 6. Commit migration to git
git add supabase/migrations/
git commit -m "feat: add my_feature migration"

# 7. Push to production
supabase db push
```

### Production Deployment

```bash
# Option A: Manual (when ready)
supabase db push

# Option B: Automated (CI/CD)
# In .github/workflows/deploy.yml:
- name: Apply Migrations
  run: supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

---

## 🚀 Quick Fix for Current Issue

### Immediate Solution (Apply leave_bid_options now)

Since `supabase db push` is blocked by earlier migration error, use direct connection:

#### Option A: Supabase Studio (Web UI)
1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
2. Copy SQL from: `supabase/migrations/20251028085737_create_leave_bid_options_table.sql`
3. Paste and run

#### Option B: psql (Command Line)
```bash
# Get your database password from .env.local
# Or from Supabase Dashboard → Settings → Database

# Run migration
PGPASSWORD="your-password" psql "postgresql://postgres.wgdmgvonqysflwdiiols:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < supabase/migrations/20251028085737_create_leave_bid_options_table.sql
```

#### Option C: Fix Earlier Migration First
1. Open `supabase/migrations/20251027_add_performance_indexes.sql`
2. Remove or fix the problematic index:
```sql
-- REMOVE THIS (causes error):
CREATE INDEX IF NOT EXISTS idx_pilot_checks_expiring_soon
ON pilot_checks(expiry_date, pilot_id)
WHERE expiry_date IS NOT NULL
  AND expiry_date >= CURRENT_DATE  -- ❌ CURRENT_DATE not immutable
  AND expiry_date <= CURRENT_DATE + INTERVAL '60 days'
```

3. Then run:
```bash
supabase db push --include-all
```

---

## 📝 Best Practices

### 1. Always Create Migrations
❌ **Don't**: Run SQL directly in production
✅ **Do**: Create migration file first

### 2. Test Locally
❌ **Don't**: Test migrations in production
✅ **Do**: Test with `supabase db reset` locally

### 3. Version Control
❌ **Don't**: Delete old migrations
✅ **Do**: Keep all migrations in git

### 4. Idempotent Migrations
❌ **Don't**: `CREATE TABLE my_table`
✅ **Do**: `CREATE TABLE IF NOT EXISTS my_table`

### 5. Rollback Plan
Always include a rollback script:
```sql
-- Migration: 20251028_add_feature.sql
CREATE TABLE my_feature (...);

-- Rollback: 20251028_rollback_add_feature.sql
DROP TABLE IF EXISTS my_feature;
```

---

## 🔧 Troubleshooting

### Migration Blocked by Earlier Error
```bash
# See what's wrong
supabase db push --dry-run

# Fix the earlier migration
# Then retry
supabase db push --include-all
```

### Need to Rollback
```bash
# Option A: Revert migration file
git revert <commit>
supabase db push

# Option B: Write rollback migration
supabase migration new rollback_my_feature
# Add DROP/ALTER statements
supabase db push
```

### Check Migration Status
```bash
# List applied migrations
supabase db remote changes

# Compare local vs production
supabase db diff
```

---

## 📚 Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Migration Guide**: https://supabase.com/docs/guides/cli/local-development
- **MCP Protocol**: https://modelcontextprotocol.io/

---

## ✅ Action Items

1. **Fix current migration**:
   - Either use web UI for now (quick fix)
   - Or fix earlier migration and use CLI

2. **Going forward**:
   - Always use `supabase migration new`
   - Test with `supabase db reset`
   - Deploy with `supabase db push`

3. **Set up CI/CD** (optional):
   - Automate migrations on deploy
   - Add to GitHub Actions

---

**Status**: Guide Complete
**Next**: Apply leave_bid_options migration using preferred method
**Last Updated**: October 28, 2025
