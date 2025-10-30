# Redis Cache Quick Reference

**For**: Developers maintaining Fleet Management V2
**Purpose**: Quick guide to using and maintaining Redis cache layer

---

## 🚀 Quick Start

### Configure Redis
```bash
# Add to .env.local
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Get credentials from: https://console.upstash.com/redis
```

### Deploy
```bash
# 1. Backup old service
cp lib/services/dashboard-service.ts lib/services/dashboard-service-v3-backup.ts

# 2. Replace with v4 (Redis + Materialized View)
cp lib/services/dashboard-service-v4.ts lib/services/dashboard-service.ts

# 3. Verify
npm run type-check
npm run dev
```

### Test
```bash
# Health check
curl http://localhost:3000/api/cache/health

# Expected:
# { "overall": "healthy", "redis": { "healthy": true } }
```

---

## 📊 Cache Architecture

**3-Layer Strategy**:
1. **Redis Cache** (2-5ms) - Distributed, persistent
2. **Materialized View** (10ms) - Pre-computed, single query
3. **Database** (800ms) - Fallback only

**Cache Flow**:
```
Request → Redis (60s TTL) → Materialized View → Database
          ↓ Hit (2ms)       ↓ Miss (10ms)      ↓ Miss (800ms)
         Return            Cache + Return      Return
```

---

## 🔑 Cache Keys

| Key Pattern | Description | TTL |
|-------------|-------------|-----|
| `fleet:*` | Fleet statistics | 5m |
| `dashboard:metrics:v3` | Dashboard metrics | 60s |
| `fleet:compliance:rate` | Compliance percentage | 5m |
| `ref:*` | Reference data | 2h |
| `fleet:leave:stats` | Leave statistics | 2m |

---

## 🔧 Common Operations

### Invalidate After Mutations
```typescript
import { refreshDashboardMetrics } from '@/lib/services/dashboard-service'

export async function PUT(request: Request) {
  await updatePilot(id, data)
  await refreshDashboardMetrics() // ← Invalidates Redis + refreshes view
  return NextResponse.json({ success: true })
}
```

### Manual Cache Invalidation
```bash
# Invalidate specific keys
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"keys": ["dashboard:metrics:v3"]}'

# Invalidate by pattern
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"pattern": "fleet:*"}'

# Flush all (dangerous!)
curl -X DELETE http://localhost:3000/api/cache/invalidate \
  -H "Authorization: Bearer TOKEN"
```

### Check Cache Health
```bash
curl http://localhost:3000/api/cache/health
```

---

## 🐛 Troubleshooting

### Redis Not Connected
**Check**: Environment variables
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

**Fix**: Add missing variables to .env.local

---

### Cache Always Misses
**Check**: Redis health
```bash
curl http://localhost:3000/api/cache/health
# Should show: "connected": true, "keyCount": > 0
```

**Fix**: Check Upstash Redis instance is active

---

### Stale Data Showing
**Check**: Cache invalidation after mutations

**Fix**: Always call `refreshDashboardMetrics()` after data updates

---

## ⚡ Performance

| Scenario | v3.0 (View Only) | v4.0 (Redis + View) | Improvement |
|----------|------------------|---------------------|-------------|
| Cold Start | 10ms | 13ms (one-time) | -30% |
| Cache Hit | 10ms | 2-5ms | **50% faster** |
| Distributed | ❌ No | ✅ Yes | ✅ |
| Persistent | ❌ No | ✅ Yes | ✅ |

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `lib/services/redis-cache-service.ts` | Redis client wrapper |
| `lib/services/dashboard-service.ts` | v4.0 with Redis caching |
| `lib/services/dashboard-service-v3-backup.ts` | Backup (view only) |
| `app/api/cache/health/route.ts` | Health check endpoint |
| `app/api/cache/invalidate/route.ts` | Cache management |
| `SPRINT-2-WEEK-3-DAY-2-REDIS-CACHE.md` | Full documentation |

---

## 🎯 Key Takeaways

1. **Dual-Layer Caching**: Redis for speed, materialized view for reliability
2. **Always Invalidate**: Call `refreshDashboardMetrics()` after mutations
3. **60s TTL**: Balance between freshness and performance
4. **Graceful Degradation**: Falls back to materialized view if Redis down
5. **Admin-Only Control**: Cache invalidation requires admin role

---

**Version**: 1.0.0
**Last Updated**: October 27, 2025
**Maintainer**: Maurice Rondeau
