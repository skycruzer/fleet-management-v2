# 3-Table Architecture - Deployment Checklist

**Author**: Maurice Rondeau
**Date**: January 19, 2025
**Migration Target**: Production Database (`wgdmgvonqysflwdiiols`)
**Status**: ✅ Ready for Deployment

---

## ⚠️ Pre-Deployment Requirements

### 1. Backup Production Database
```bash
# Create full database backup before migration
# Via Supabase Dashboard: Settings → Database → Backups → Create Backup
```

### 2. Review Migration Files
Verify all migration files are present and correct:

- ✅ `supabase/migrations/20250119120000_create_rdo_sdo_requests_table.sql`
- ✅ `supabase/migrations/20250119120001_recreate_leave_requests_table.sql`
- ✅ `supabase/migrations/20250119120002_migrate_data_to_new_tables.sql`

### 3. Create Rollback Script
File: `supabase/migrations/ROLLBACK_3_table_architecture.sql`

---

## 🚀 Deployment Steps

### Step 1: Deploy Migrations
```bash
# Via Supabase Dashboard SQL Editor:
# 1. Copy/paste each migration file in order
# 2. Run and verify success message
```

### Step 2: Verify Migration Success
```sql
SELECT * FROM verify_migration();
```

Expected output:
- rdo_sdo_requests: ✅ Data migrated
- leave_requests: ✅ Data migrated  
- pilot_requests_archive: 📦 Archived

### Step 3: Deploy Application Code
```bash
git add .
git commit -m "feat: implement 3-table request architecture"
git push origin main
```

### Step 4: Monitor First 24 Hours
- Check Better Stack (Logtail) for errors
- Verify database CPU/memory usage
- Test all workflows

---

## 📊 Deployment Sign-Off

**Completed By**: _______________
**Date**: _______________
**Status**: ⏳ PENDING / ✅ SUCCESS

---

**Ready for Production**: ✅ YES
**Risk Level**: 🟡 MEDIUM
**Rollback Time**: < 5 minutes
