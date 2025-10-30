# Apply Migration RIGHT NOW - Simple Instructions

## ❌ What Happened

You pasted a **bash command** into the **SQL Editor**. The SQL Editor only accepts SQL code, not bash commands.

---

## ✅ Correct Method: Apply via SQL Editor

Follow these exact steps:

### Step 1: Open the Migration File

```bash
# In your terminal (not SQL Editor), run:
cat supabase/migrations/20251027_create_pilot_feedback_table.sql
```

### Step 2: Copy the SQL Code

The file contains SQL that starts with:
```sql
-- Create pilot_feedback table
-- Migration: 20251027_create_pilot_feedback_table
-- Description: Creates table for pilot feedback submissions

CREATE TABLE IF NOT EXISTS pilot_feedback (
  ...
```

**Copy ALL of this SQL code** (not the bash command)

### Step 3: Paste in SQL Editor

1. Go to: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
2. **Paste the SQL code** (the CREATE TABLE... code)
3. Click **"Run"** button

---

## 🚀 OR Use This Quick Command

Since I see you have terminal access and the password, run this in your **TERMINAL** (not SQL Editor):

```bash
# Run in terminal:
supabase db push --db-url "postgresql://postgres:y8OPwrOqY2VySCbE@db.wgdmgvonqysflwdiiols.supabase.co:5432/postgres"
```

This will automatically apply the migration.

---

## 📋 Complete Process

### If Using Terminal (Easiest):

```bash
# 1. Apply migration
supabase db push --db-url "postgresql://postgres:y8OPwrOqY2VySCbE@db.wgdmgvonqysflwdiiols.supabase.co:5432/postgres"

# 2. Regenerate types
npm run db:types

# 3. Run tests
npm test
```

### If Using SQL Editor:

1. **Open file in your code editor**: `supabase/migrations/20251027_create_pilot_feedback_table.sql`
2. **Select ALL SQL code** (lines 1-108)
3. **Copy** (Cmd+C)
4. **Open SQL Editor**: https://app.supabase.com/project/wgdmgvonqysflwdiiols/sql
5. **Paste SQL code** (NOT the bash command)
6. **Click "Run"**
7. **Then in terminal**:
   ```bash
   npm run db:types
   npm test
   ```

---

## ⚠️ Important

**SQL Editor accepts**: SQL code (CREATE TABLE, SELECT, INSERT, etc.)
**Terminal accepts**: Bash commands (supabase, npm, etc.)

**Don't paste bash commands in SQL Editor!**

---

## ✅ Expected Result

After running the migration, you should see:

```
✅ Table "pilot_feedback" created
✅ 4 indexes created
✅ RLS policies applied
✅ Trigger created
```

Then after `npm run db:types`:
```
✅ Types generated
```

Then after `npm test`:
```
✅ 72/79 tests passing (91%+)
```

---

Would you like me to show you the exact SQL to paste, or would you prefer to use the terminal command?
