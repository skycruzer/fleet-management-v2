# Memory Optimization Implementation Guide

**Date**: November 21, 2025
**Author**: Maurice Rondeau
**Priority**: High (Production Impact)

---

## 📋 Quick Implementation Checklist

### Phase 1: Critical Fixes (Week 1) ✅ **START HERE**

- [ ] **Step 1**: Deploy Unified Cache Service
- [ ] **Step 2**: Update imports across codebase
- [ ] **Step 3**: Add memory monitoring API
- [ ] **Step 4**: Test in staging environment
- [ ] **Step 5**: Deploy to production with monitoring

### Phase 2: Monitoring & Validation (Week 2)

- [ ] **Step 6**: Enable memory monitoring dashboard
- [ ] **Step 7**: Set up alerting thresholds
- [ ] **Step 8**: Run load tests
- [ ] **Step 9**: Validate memory improvements

---

## 🚀 Step-by-Step Implementation

### Step 1: Deploy Unified Cache Service

**File Created**: `lib/services/unified-cache-service.ts`

**Action Required**: Update imports across codebase

**Search and Replace**:
```bash
# Find all files importing cache-service
grep -r "from '@/lib/services/cache-service'" --include="*.ts" --include="*.tsx"

# Replace imports
# Before:
import { cacheService } from '@/lib/services/cache-service'

# After:
import { unifiedCacheService as cacheService } from '@/lib/services/unified-cache-service'
```

**Files to Update** (estimated 10-15 files):
- `lib/services/dashboard-service.ts`
- `lib/services/dashboard-service-v3.ts`
- `lib/services/dashboard-service-v4.ts`
- `lib/services/reports-service.ts`
- `app/api/admin/settings/route.ts`
- Any service that uses `cacheService` or `enhancedCacheService`

**Testing**:
```bash
# Run type check
npm run type-check

# Run tests
npm test

# Start dev server
npm run dev
```

---

### Step 2: Enable Memory Monitoring

**File Created**: `app/api/admin/memory-stats/route.ts`

**Access URL**: `http://localhost:3000/api/admin/memory-stats`

**Expected Response**:
```json
{
  "status": "healthy",
  "memory": {
    "heapUsed": "145.23 MB",
    "heapTotal": "200.00 MB",
    "heapPercent": "72.62%",
    "external": "5.42 MB",
    "rss": "185.67 MB"
  },
  "cache": {
    "local": {
      "totalEntries": 15,
      "entries": [...]
    },
    "redis": {
      "connected": true,
      "keyCount": 42
    }
  },
  "uptime": "15.32 minutes",
  "timestamp": "2025-11-21T10:30:00.000Z"
}
```

**Security Considerations**:
- ⚠️ **IMPORTANT**: Add authentication to this endpoint
- Should only be accessible to admin users
- Consider rate limiting

**Add Authentication** (recommended):
```typescript
// app/api/admin/memory-stats/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  // Add authentication check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role (if you have role-based access)
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('role')
  //   .eq('id', user.id)
  //   .single()
  //
  // if (profile?.role !== 'admin') {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // }

  // ... rest of implementation
}
```

---

### Step 3: Initialize Memory Monitoring

**File Created**: `lib/utils/memory-monitor.ts`

**Add to Application Startup**:

Edit `app/layout.tsx` or create a server initialization file:

```typescript
// lib/init/server-init.ts
import { memoryMonitor } from '@/lib/utils/memory-monitor'

export function initializeServerMonitoring() {
  // Start memory monitoring in production
  if (process.env.NODE_ENV === 'production') {
    memoryMonitor.startMonitoring()
    console.log('✅ Memory monitoring started')
  }
}
```

Call during app startup:
```typescript
// app/layout.tsx or middleware.ts
import { initializeServerMonitoring } from '@/lib/init/server-init'

// Call once when server starts
if (typeof window === 'undefined') {
  initializeServerMonitoring()
}
```

---

### Step 4: Test Memory Monitoring

**Create Test Script**:
```bash
# test-memory-monitoring.mjs
import fetch from 'node-fetch'

async function testMemoryMonitoring() {
  console.log('Testing memory monitoring endpoint...\n')

  const response = await fetch('http://localhost:3000/api/admin/memory-stats')
  const data = await response.json()

  console.log('Memory Status:', data.status)
  console.log('Heap Used:', data.memory.heapUsed)
  console.log('Heap Percent:', data.memory.heapPercent)
  console.log('Cache Entries:', data.cache.local.totalEntries)
  console.log('Redis Connected:', data.cache.redis.connected)
  console.log('\n✅ Memory monitoring working!')
}

testMemoryMonitoring()
```

Run test:
```bash
node test-memory-monitoring.mjs
```

---

### Step 5: Create Monitoring Dashboard Component (Optional)

**Create Admin Dashboard Widget**:

```typescript
// components/admin/memory-monitor-widget.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MemoryStats {
  status: 'healthy' | 'warning' | 'critical'
  memory: {
    heapUsed: string
    heapTotal: string
    heapPercent: string
  }
  cache: {
    local: { totalEntries: number }
    redis: { connected: boolean; keyCount: number }
  }
}

export function MemoryMonitorWidget() {
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/memory-stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch memory stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Loading memory stats...</div>

  const statusColor = {
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  }[stats?.status || 'healthy']

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Memory Usage</h3>
        <Badge className={statusColor}>
          {stats?.status.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Heap Used:</span>
          <span className="font-mono">{stats?.memory.heapUsed}</span>
        </div>
        <div className="flex justify-between">
          <span>Heap Percent:</span>
          <span className="font-mono">{stats?.memory.heapPercent}</span>
        </div>
        <div className="flex justify-between">
          <span>Cache Entries:</span>
          <span className="font-mono">{stats?.cache.local.totalEntries}</span>
        </div>
        <div className="flex justify-between">
          <span>Redis:</span>
          <Badge variant={stats?.cache.redis.connected ? 'default' : 'destructive'}>
            {stats?.cache.redis.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>
    </Card>
  )
}
```

**Add to Admin Dashboard**:
```typescript
// app/dashboard/admin/page.tsx
import { MemoryMonitorWidget } from '@/components/admin/memory-monitor-widget'

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Other dashboard widgets */}
      <MemoryMonitorWidget />
    </div>
  )
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests for Unified Cache

```typescript
// __tests__/lib/services/unified-cache-service.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { UnifiedCacheService } from '@/lib/services/unified-cache-service'

describe('UnifiedCacheService', () => {
  let cache: UnifiedCacheService

  beforeEach(() => {
    cache = new UnifiedCacheService()
  })

  afterEach(() => {
    cache.stopCleanup()
    cache.invalidateAll()
  })

  it('should set and get cached values', () => {
    cache.set('test-key', { data: 'test' }, 60000)
    const value = cache.get('test-key')
    expect(value).toEqual({ data: 'test' })
  })

  it('should expire cached values after TTL', async () => {
    cache.set('test-key', { data: 'test' }, 100) // 100ms TTL

    await new Promise(resolve => setTimeout(resolve, 150))

    const value = cache.get('test-key')
    expect(value).toBeNull()
  })

  it('should track access counts', () => {
    cache.set('test-key', { data: 'test' }, 60000)

    // Access multiple times
    cache.get('test-key')
    cache.get('test-key')
    cache.get('test-key')

    const topKeys = cache.getTopAccessedKeys(1)
    expect(topKeys[0].key).toBe('test-key')
    expect(topKeys[0].count).toBe(3)
  })

  it('should enforce max cache size', () => {
    // Add more than MAX_CACHE_SIZE entries
    for (let i = 0; i < 150; i++) {
      cache.set(`key-${i}`, { data: i }, 60000)
    }

    // Force cleanup
    cache['performCleanup']()

    const stats = cache.getStats()
    expect(stats.totalEntries).toBeLessThanOrEqual(100)
  })

  it('should enforce max tracking size', () => {
    // Add entries and access them
    for (let i = 0; i < 250; i++) {
      cache.set(`key-${i}`, { data: i }, 60000)
      cache.get(`key-${i}`)
    }

    // Force cleanup
    cache['performCleanup']()

    const stats = cache.getStats()
    expect(stats.trackingEntries).toBeLessThanOrEqual(200)
  })

  it('should invalidate by tag', () => {
    cache.set('key-1', { data: 1 }, 60000, ['tag-a'])
    cache.set('key-2', { data: 2 }, 60000, ['tag-a'])
    cache.set('key-3', { data: 3 }, 60000, ['tag-b'])

    cache.invalidateByTag('tag-a')

    expect(cache.get('key-1')).toBeNull()
    expect(cache.get('key-2')).toBeNull()
    expect(cache.get('key-3')).toEqual({ data: 3 })
  })
})
```

Run tests:
```bash
npm test -- unified-cache-service.test.ts
```

---

### 2. Load Testing

**Create Load Test Script**:
```bash
# test-memory-under-load.mjs
import fetch from 'node-fetch'

async function loadTest() {
  console.log('Starting memory load test...\n')

  const iterations = 100
  const concurrency = 10

  for (let i = 0; i < iterations; i += concurrency) {
    const batch = []

    for (let j = 0; j < concurrency; j++) {
      batch.push(
        fetch('http://localhost:3000/api/admin/memory-stats')
          .then(r => r.json())
      )
    }

    const results = await Promise.all(batch)

    // Check first result
    const stats = results[0]
    console.log(`[${i + concurrency}/${iterations}] Heap: ${stats.memory.heapPercent} | Status: ${stats.status}`)

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n✅ Load test complete!')
}

loadTest()
```

Run load test:
```bash
node test-memory-under-load.mjs
```

---

## 📊 Monitoring Metrics to Track

### Key Metrics

1. **Heap Usage Percentage** (Target: <80%)
2. **Cache Hit Rate** (Target: >70%)
3. **Memory Growth Rate** (Target: Stable)
4. **GC Pause Time** (Target: <100ms)

### Set Up Alerts

**Example Vercel/Better Stack Alert Configuration**:

```yaml
# Alert when heap usage exceeds 85%
alerts:
  - name: High Memory Usage
    condition: memory.heapPercent > 85
    severity: warning
    channels:
      - email
      - slack

  # Alert when heap usage exceeds 95%
  - name: Critical Memory Usage
    condition: memory.heapPercent > 95
    severity: critical
    channels:
      - email
      - slack
      - pagerduty
```

---

## 🎯 Success Criteria

- ✅ Heap usage remains below 80% under normal load
- ✅ No memory leaks detected in 24-hour stress test
- ✅ Cache hit rate above 70%
- ✅ Memory monitoring dashboard functional
- ✅ Alerts trigger correctly at thresholds
- ✅ All unit tests pass
- ✅ Production deployment successful

---

## 📚 Additional Resources

### Documentation
- [MEMORY-OPTIMIZATION-REPORT.md](./MEMORY-OPTIMIZATION-REPORT.md) - Full analysis
- [Node.js Memory Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

### Tools
- **Chrome DevTools**: Memory profiling
- **Node.js --inspect**: Server-side profiling
- **Clinic.js**: Advanced diagnostics
- **0x**: Flamegraph profiling

### Commands
```bash
# Run with GC exposed (for emergency cleanup)
node --expose-gc server.js

# Run with memory profiling
node --inspect server.js

# Generate heap snapshot
node --heap-prof server.js
```

---

## 🚨 Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous cache service
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Temporary Fix**: Disable memory monitoring
   ```typescript
   // Comment out in app/layout.tsx
   // memoryMonitor.startMonitoring()
   ```

3. **Emergency**: Clear all caches
   ```bash
   # Via Redis CLI or API
   curl -X POST http://localhost:3000/api/admin/cache/clear
   ```

---

## ✅ Completion Checklist

**Before Production Deployment**:
- [ ] All unit tests pass
- [ ] Load tests show no memory leaks
- [ ] Memory monitoring API secured with auth
- [ ] Alerting configured in Better Stack
- [ ] Team notified of changes
- [ ] Documentation updated
- [ ] Rollback plan reviewed

**After Production Deployment**:
- [ ] Monitor memory metrics for 24 hours
- [ ] Verify alerts trigger correctly
- [ ] Check cache hit rates
- [ ] Review error logs
- [ ] Document any issues encountered

---

**Questions?** Contact Maurice Rondeau or review [MEMORY-OPTIMIZATION-REPORT.md](./MEMORY-OPTIMIZATION-REPORT.md)

**Last Updated**: November 21, 2025
