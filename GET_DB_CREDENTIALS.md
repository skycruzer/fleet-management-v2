# How to Get Supabase Database Credentials

## What the CLI Needs

The Supabase CLI needs a **database connection string** that looks like this:

```
postgresql://postgres:[YOUR-PASSWORD]@db.wgdmgvonqysflwdiiols.supabase.co:5432/postgres
```

---

## 🔐 How to Get the Database Password

### Method 1: Supabase Dashboard (Easiest)

**1. Go to Project Settings**
- Visit: https://app.supabase.com/project/wgdmgvonqysflwdiiols/settings/database

**2. Find "Connection String"**
- Look for section: **"Connection string"**
- Select: **"URI"** tab
- Copy the connection string

**3. Reset Password** (if needed)
- If you see `[YOUR-PASSWORD]` in the string, click "Reset Database Password"
- Copy the new password
- Replace `[YOUR-PASSWORD]` with your actual password

---

## 🚀 Using CLI with Credentials

### Option 1: Set Environment Variable

```bash
# Copy this template and fill in YOUR-PASSWORD
export SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.wgdmgvonqysflwdiiols.supabase.co:5432/postgres"

# Then run migration
supabase db push --db-url "$SUPABASE_DB_URL"
```

### Option 2: Direct Command

```bash
# Replace [YOUR-PASSWORD] with actual password
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.wgdmgvonqysflwdiiols.supabase.co:5432/postgres"
```

### Option 3: Link Project (Best for repeated use)

```bash
# Link to project (will prompt for credentials)
supabase link --project-ref wgdmgvonqysflwdiiols

# After linking, simply run:
supabase db push
```

---

## ⚡ Quick Start: Dashboard Method (No CLI Needed)

If you don't want to deal with CLI credentials, **use the Dashboard method** (recommended):

**1. Open SQL Editor**
https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql

**2. Copy Migration File**
- Open: `supabase/migrations/20251027_create_pilot_feedback_table.sql`
- Copy all content (Cmd+A, Cmd+C)

**3. Paste and Run**
- Paste in SQL Editor
- Click "Run" button

**Done!** ✅

This method doesn't require any credentials and is the safest.

---

## 📋 Full Connection String Components

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**For your project**:
- **USER**: `postgres`
- **PASSWORD**: Get from Settings → Database
- **HOST**: `db.wgdmgvonqysflwdiiols.supabase.co`
- **PORT**: `5432`
- **DATABASE**: `postgres`

---

## 🔧 Alternative: Use .env.local

If you have credentials in `.env.local`:

```bash
# Check if you have the service role key
cat .env.local | grep SUPABASE

# If you see SUPABASE_SERVICE_ROLE_KEY, you can use:
# (Though this won't help with db push, it's for API access)
```

**Note**: The service role key is for API access, not database access. For migrations, you need the database password.

---

## ✅ Recommended Approach

**For this one-time migration**, I recommend:

1. **Use Supabase Dashboard** (no credentials needed)
   - SQL Editor method (5 minutes)
   - See: `MIGRATION_INSTRUCTIONS.md`

2. **Then regenerate types**:
   ```bash
   npm run db:types
   ```

3. **Test**:
   ```bash
   npm test
   ```

This avoids any CLI credential issues and is the safest method.

---

## 🆘 Troubleshooting CLI Issues

### "Authentication required"
- You need to log in: `supabase login`
- Or use `--db-url` with full connection string

### "Failed to connect"
- Check firewall settings
- Verify IP whitelist in Supabase
- Try dashboard method instead

### "Access denied"
- Password might be wrong
- Reset password in dashboard
- Try dashboard method instead

---

**Bottom Line**: Unless you plan to run migrations frequently via CLI, the **Dashboard method is faster and easier** for this one-time migration.

See `MIGRATION_INSTRUCTIONS.md` for step-by-step Dashboard instructions.
