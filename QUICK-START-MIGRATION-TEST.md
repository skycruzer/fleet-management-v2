# Quick Start - Migration Testing

**⏱️ Time Required**: 30-45 minutes
**🎯 Goal**: Test 4 database migrations locally

---

## 🚀 Fast Track (3 Commands)

```bash
# 1. Run automated test script
./run-local-migration-test.sh

# 2. If successful, verify manually
npm run dev
# Test at http://localhost:3000

# 3. Done! ✅
```

---

## 📋 Manual Method (7 Steps)

### 1. Validate Data (5 min)
```bash
psql "$(supabase status | grep 'DB URL' | awk '{print $3}')" -f test-migration-validation.sql
```

### 2. Apply Migrations (10 min)
```bash
supabase db push
```

### 3. Regenerate Types (2 min)
```bash
npm run db:types
```

### 4. Type Check (2 min)
```bash
npm run type-check
```

### 5. Lint (2 min)
```bash
npm run lint
```

### 6. Test (10 min)
```bash
npm test
```

### 7. Manual Test (10 min)
```bash
npm run dev
# Visit http://localhost:3000
```

---

## ✅ Success Checklist

- [ ] All 4 migrations applied
- [ ] Types regenerated
- [ ] Type check passes
- [ ] Lint passes
- [ ] All E2E tests pass
- [ ] App works manually
- [ ] Performance improved

---

## 🚨 If Something Fails

```bash
# Rollback
supabase db reset

# Or contact me for help!
```

---

## 📊 Expected Results

**Migrations**: 4 files applied (180+ constraints, 50+ indexes)
**Performance**: 30-50% faster queries
**Tests**: 24 E2E tests should pass
**Health**: 75/100 → 78/100

---

**Need detailed guide?** See `LOCAL-MIGRATION-TESTING-STEPS.md`
