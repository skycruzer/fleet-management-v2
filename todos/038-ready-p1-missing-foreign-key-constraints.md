---
status: done
priority: p1
issue_id: "038"
tags: [database, data-integrity, foreign-keys, referential-integrity]
dependencies: []
completed_date: 2025-10-19
---

# Add Foreign Key Constraints with ON DELETE Cascades

## Problem Statement

Tables have foreign key references but lack proper ON DELETE/ON UPDATE cascade rules. Orphaned records remain when parent records are deleted, causing data integrity violations and broken references.

## Findings

- **Severity**: 🔴 P1 (CRITICAL)
- **Impact**: Orphaned records, broken references, data corruption
- **Agent**: data-integrity-guardian

**Problem Scenario:**
```sql
-- Delete pilot_user
DELETE FROM pilot_users WHERE id = 'xxx';

-- ❌ Orphaned records remain:
-- feedback_posts still reference deleted pilot_user_id
-- leave_requests still reference deleted pilot_user_id
-- flight_requests still reference deleted pilot_user_id

-- Application crashes when loading these records
```

## Proposed Solution

```sql
-- Add CASCADE rules to foreign keys
ALTER TABLE feedback_posts
  DROP CONSTRAINT IF EXISTS feedback_posts_pilot_user_id_fkey,
  ADD CONSTRAINT feedback_posts_pilot_user_id_fkey
    FOREIGN KEY (pilot_user_id)
    REFERENCES pilot_users(id)
    ON DELETE CASCADE;

ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_pilot_user_id_fkey,
  ADD CONSTRAINT leave_requests_pilot_user_id_fkey
    FOREIGN KEY (pilot_user_id)
    REFERENCES pilot_users(id)
    ON DELETE CASCADE;

ALTER TABLE flight_requests
  DROP CONSTRAINT IF EXISTS flight_requests_pilot_user_id_fkey,
  ADD CONSTRAINT flight_requests_pilot_user_id_fkey
    FOREIGN KEY (pilot_user_id)
    REFERENCES pilot_users(id)
    ON DELETE CASCADE;

ALTER TABLE feedback_votes
  DROP CONSTRAINT IF EXISTS feedback_votes_post_id_fkey,
  ADD CONSTRAINT feedback_votes_post_id_fkey
    FOREIGN KEY (post_id)
    REFERENCES feedback_posts(id)
    ON DELETE CASCADE;
```

## Acceptance Criteria

- [x] All foreign keys have ON DELETE CASCADE
- [x] Test deleting parent record removes children
- [x] No orphaned records in database

## Work Log

### 2025-10-19 - Initial Discovery
**By:** data-integrity-guardian
**Learnings:** Missing cascade rules create orphaned records

## Notes

**Source**: Data Integrity Review Finding #4
