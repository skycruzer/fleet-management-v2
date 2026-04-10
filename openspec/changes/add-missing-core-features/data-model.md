# Data Model: Missing Core Features

**Feature**: 001-missing-core-features
**Phase**: Phase 1 - Database Design
**Date**: 2025-10-22
**Prerequisites**: plan.md, spec.md, research.md

---

## Overview

This document defines the complete database schema for 9 new tables required for implementing missing core features. All tables follow the existing fleet-management-v2 patterns and integrate with the current schema.

**Database**: Supabase PostgreSQL (Project: `wgdmgvonqysflwdiiols`)
**Migration Strategy**: Single migration file with dependency-ordered table creation
**RLS**: All tables have Row Level Security enabled

---

## Schema Diagram

```
Existing Tables:
├── pilots (27 records)
├── pilot_checks (607 records)
├── check_types (34 records)
├── leave_requests
├── an_users (authentication)
└── contract_types (3 records)

New Tables:
├── pilot_registrations ──→ an_users (user_id)
│
├── pilot_notifications ──→ pilots (pilot_id)
│
├── flight_requests ──→ pilots (pilot_id)
│                    └──→ an_users (reviewed_by)
│
├── tasks ──→ an_users (created_by, assigned_to)
│
├── disciplinary_actions ──→ pilots (pilot_id)
│                        └──→ an_users (created_by)
│
├── disciplinary_actions_log ──→ disciplinary_actions (matter_id)
│                             └──→ an_users (created_by)
│
├── feedback_posts ──→ pilots (author_id)
│                   └──→ feedback_categories (category_id)
│
├── feedback_comments ──→ feedback_posts (post_id)
│                     └──→ pilots (author_id)
│
├── feedback_categories (predefined categories)
│
└── audit_logs ──→ an_users (user_id)
```

---

## Table Definitions

### 1. pilot_registrations

**Purpose**: Tracks pilot registration requests pending admin approval.

**Business Rules**:

- New pilot registers via `/pilot/register`
- Email verification required before admin review
- Admin approves/denies from `/dashboard/admin/pilot-registrations`
- On approval: Create pilot record, link to user account, send welcome email
- On denial: Notify applicant, keep record for audit

**SQL DDL**:

```sql
CREATE TABLE pilot_registrations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES an_users(id) ON DELETE CASCADE,
  -- user_id is set when Supabase Auth user is created during registration

  -- Registration Data
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  employee_id TEXT UNIQUE, -- Optional: Air Niugini employee number
  rank TEXT NOT NULL CHECK (rank IN ('Captain', 'First Officer')),
  date_of_birth DATE,
  phone_number TEXT,
  address TEXT,

  -- Verification & Approval
  email_verified BOOLEAN DEFAULT FALSE,
  -- Updated to TRUE when user clicks verification link in email

  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),
  -- PENDING: Awaiting admin review
  -- APPROVED: Admin approved, pilot record created
  -- DENIED: Admin rejected registration

  -- Admin Review
  reviewed_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
  -- Admin user who approved/denied the registration

  reviewed_at TIMESTAMPTZ,
  -- Timestamp of admin decision

  admin_notes TEXT,
  -- Optional notes from admin explaining approval/denial

  denial_reason TEXT,
  -- Required if status = 'DENIED'

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pilot_registrations_user_id ON pilot_registrations(user_id);
CREATE INDEX idx_pilot_registrations_status ON pilot_registrations(status);
CREATE INDEX idx_pilot_registrations_email ON pilot_registrations(email);
CREATE INDEX idx_pilot_registrations_created_at ON pilot_registrations(created_at DESC);

-- RLS Policies
ALTER TABLE pilot_registrations ENABLE ROW LEVEL SECURITY;

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON pilot_registrations FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Users can view their own registration
CREATE POLICY "Users can view own registration"
ON pilot_registrations FOR SELECT
USING (user_id = auth.uid());

-- Authenticated users can insert their own registration
CREATE POLICY "Users can create own registration"
ON pilot_registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can update registrations (approve/deny)
CREATE POLICY "Admins can update registrations"
ON pilot_registrations FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_pilot_registrations_updated_at
BEFORE UPDATE ON pilot_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. pilot_notifications

**Purpose**: Stores notifications for pilots (leave approvals, task assignments, feedback replies).

**Business Rules**:

- Created when events occur (leave approved, task assigned, comment on post)
- Pilots see unread count badge in header
- Mark as read when notification is clicked
- Auto-delete after 90 days (cleanup job)

**SQL DDL**:

```sql
CREATE TABLE pilot_notifications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  -- Pilot who receives the notification

  -- Notification Content
  type TEXT NOT NULL CHECK (type IN (
    'leave_approved',
    'leave_denied',
    'task_assigned',
    'task_completed',
    'feedback_reply',
    'feedback_mention',
    'flight_request_approved',
    'flight_request_denied',
    'system_announcement'
  )),

  title TEXT NOT NULL,
  -- Short notification title (e.g., "Leave Request Approved")

  message TEXT NOT NULL,
  -- Detailed message (e.g., "Your leave request for RP12/2025 has been approved")

  link TEXT,
  -- Optional deep link (e.g., "/pilot/leave?id=123")

  metadata JSONB,
  -- Optional structured data (e.g., { "leave_request_id": "uuid", "roster_period": 12 })

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pilot_notifications_pilot_id ON pilot_notifications(pilot_id);
CREATE INDEX idx_pilot_notifications_read ON pilot_notifications(read);
CREATE INDEX idx_pilot_notifications_created_at ON pilot_notifications(created_at DESC);
CREATE INDEX idx_pilot_notifications_pilot_unread ON pilot_notifications(pilot_id, read) WHERE read = FALSE;
-- Composite index for efficient "unread count" queries

-- RLS Policies
ALTER TABLE pilot_notifications ENABLE ROW LEVEL SECURITY;

-- Pilots can view their own notifications
CREATE POLICY "Pilots can view own notifications"
ON pilot_notifications FOR SELECT
USING (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

-- Admins can insert notifications
CREATE POLICY "Admins can create notifications"
ON pilot_notifications FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- System can insert notifications (service role)
-- Handled by service-layer with service role key

-- Pilots can update their own notifications (mark as read)
CREATE POLICY "Pilots can mark own notifications as read"
ON pilot_notifications FOR UPDATE
USING (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

-- Cleanup: Auto-delete notifications older than 90 days
-- (Implemented as scheduled database function or cron job)
```

---

### 3. flight_requests

**Purpose**: Tracks pilot-initiated flight requests for additional flights or route changes.

**Business Rules**:

- Pilots submit requests via `/pilot/flight-requests`
- Admins review via `/dashboard/flight-requests`
- Manual approval workflow (no auto-approval)
- Request includes route, dates, reason
- Admin can approve/deny with comments

**SQL DDL**:

```sql
CREATE TABLE flight_requests (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,

  -- Request Details
  request_type TEXT NOT NULL CHECK (request_type IN (
    'additional_flight',
    'route_change',
    'schedule_swap',
    'other'
  )),

  route TEXT NOT NULL,
  -- Requested route (e.g., "POM-LAE", "HGU-RAB")

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  reason TEXT NOT NULL,
  -- Pilot's explanation for the request (min 10 characters)

  additional_details TEXT,
  -- Optional: More context or special circumstances

  -- Approval Workflow
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'DENIED'
  )),

  reviewed_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
  -- Admin/manager who reviewed the request

  reviewed_at TIMESTAMPTZ,

  admin_comments TEXT,
  -- Admin's notes (visible to pilot after decision)

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_flight_requests_pilot_id ON flight_requests(pilot_id);
CREATE INDEX idx_flight_requests_status ON flight_requests(status);
CREATE INDEX idx_flight_requests_created_at ON flight_requests(created_at DESC);
CREATE INDEX idx_flight_requests_start_date ON flight_requests(start_date);

-- RLS Policies
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

-- Pilots can view their own requests
CREATE POLICY "Pilots can view own flight requests"
ON flight_requests FOR SELECT
USING (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all flight requests"
ON flight_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Pilots can insert their own requests
CREATE POLICY "Pilots can create flight requests"
ON flight_requests FOR INSERT
WITH CHECK (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update flight requests"
ON flight_requests FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_flight_requests_updated_at
BEFORE UPDATE ON flight_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### 4. tasks

**Purpose**: Task management system for fleet operations team.

**Business Rules**:

- Kanban board with TODO, IN_PROGRESS, DONE statuses
- Tasks can be assigned to specific users or unassigned
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Due dates optional
- Tags for categorization

**SQL DDL**:

```sql
CREATE TABLE tasks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task Details
  title TEXT NOT NULL,
  -- Short task name (e.g., "Review certification expiry reports")

  description TEXT,
  -- Detailed task description (Markdown supported)

  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN (
    'TODO',
    'IN_PROGRESS',
    'DONE',
    'CANCELLED'
  )),

  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
  )),

  -- Assignment
  assigned_to UUID REFERENCES an_users(id) ON DELETE SET NULL,
  -- User assigned to this task (optional)

  created_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
  -- User who created the task

  -- Scheduling
  due_date DATE,
  -- Optional deadline

  -- Categorization
  tags TEXT[],
  -- Array of tags (e.g., ['certification', 'urgent'])

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
  -- Set when status changes to 'DONE'
);

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
-- GIN index for efficient array searches

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Admins and managers can view all tasks
CREATE POLICY "Admins and managers can view all tasks"
ON tasks FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Users can view tasks assigned to them
CREATE POLICY "Users can view assigned tasks"
ON tasks FOR SELECT
USING (assigned_to = auth.uid());

-- Users can view tasks they created
CREATE POLICY "Users can view own created tasks"
ON tasks FOR SELECT
USING (created_by = auth.uid());

-- Admins and managers can create tasks
CREATE POLICY "Admins and managers can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Admins and managers can update any task
CREATE POLICY "Admins and managers can update tasks"
ON tasks FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Assigned users can update their own tasks (status, progress)
CREATE POLICY "Assigned users can update their tasks"
ON tasks FOR UPDATE
USING (assigned_to = auth.uid());

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Set completed_at when status changes to DONE
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DONE' AND OLD.status <> 'DONE' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status <> 'DONE' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_task_completed_at();
```

---

### 5. disciplinary_actions

**Purpose**: Tracks disciplinary matters for pilots (investigations, warnings, resolutions).

**Business Rules**:

- Each matter has a type (investigation, warning, suspension, etc.)
- Status tracks lifecycle (OPEN, UNDER_INVESTIGATION, RESOLVED, CLOSED)
- Timeline view shows progression via disciplinary_actions_log
- Sensitive data (admin-only access)

**SQL DDL**:

```sql
CREATE TABLE disciplinary_actions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,

  created_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
  -- Admin who initiated the matter

  -- Matter Details
  matter_type TEXT NOT NULL CHECK (matter_type IN (
    'investigation',
    'verbal_warning',
    'written_warning',
    'suspension',
    'other'
  )),

  title TEXT NOT NULL,
  -- Short description (e.g., "Late arrival incident - Flight PX123")

  description TEXT NOT NULL,
  -- Detailed description of the matter

  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
    'OPEN',
    'UNDER_INVESTIGATION',
    'RESOLVED',
    'CLOSED'
  )),

  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  )),

  -- Resolution
  resolution TEXT,
  -- Outcome of the matter (required when status = RESOLVED or CLOSED)

  resolved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_disciplinary_actions_pilot_id ON disciplinary_actions(pilot_id);
CREATE INDEX idx_disciplinary_actions_status ON disciplinary_actions(status);
CREATE INDEX idx_disciplinary_actions_created_by ON disciplinary_actions(created_by);
CREATE INDEX idx_disciplinary_actions_created_at ON disciplinary_actions(created_at DESC);

-- RLS Policies
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

-- Admins can view all disciplinary matters
CREATE POLICY "Admins can view all disciplinary matters"
ON disciplinary_actions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can create disciplinary matters
CREATE POLICY "Admins can create disciplinary matters"
ON disciplinary_actions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can update disciplinary matters
CREATE POLICY "Admins can update disciplinary matters"
ON disciplinary_actions FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_disciplinary_actions_updated_at
BEFORE UPDATE ON disciplinary_actions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### 6. disciplinary_actions_log

**Purpose**: Audit trail of actions taken on disciplinary matters (timeline entries).

**Business Rules**:

- Immutable log (no updates allowed, only inserts)
- Each entry represents an action (investigation started, evidence added, warning issued, etc.)
- Powers the timeline view in `/dashboard/disciplinary/[id]`
- Attachments stored as array of file URLs

**SQL DDL**:

```sql
CREATE TABLE disciplinary_actions_log (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  matter_id UUID NOT NULL REFERENCES disciplinary_actions(id) ON DELETE CASCADE,

  created_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,
  -- Admin who performed the action

  -- Log Entry
  action_type TEXT NOT NULL CHECK (action_type IN (
    'investigation_started',
    'evidence_added',
    'interview_conducted',
    'warning_issued',
    'status_updated',
    'resolution_added',
    'matter_closed',
    'comment_added',
    'other'
  )),

  description TEXT NOT NULL,
  -- Detailed description of the action

  attachments TEXT[],
  -- Array of file URLs (stored in Supabase Storage)

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at (immutable log)
);

-- Indexes
CREATE INDEX idx_disciplinary_actions_log_matter_id ON disciplinary_actions_log(matter_id);
CREATE INDEX idx_disciplinary_actions_log_created_at ON disciplinary_actions_log(created_at DESC);

-- RLS Policies
ALTER TABLE disciplinary_actions_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all log entries
CREATE POLICY "Admins can view all log entries"
ON disciplinary_actions_log FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Admins can insert log entries
CREATE POLICY "Admins can insert log entries"
ON disciplinary_actions_log FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- No UPDATE or DELETE policies (immutable log)
```

---

### 7. feedback_posts

**Purpose**: Community feedback and suggestions from pilots.

**Business Rules**:

- Pilots create posts with title, content, category
- Posts can be pinned by admins
- Vote system (upvotes) for prioritization
- Admin moderation (hide inappropriate posts)
- Comments stored in separate table

**SQL DDL**:

```sql
CREATE TABLE feedback_posts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  author_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  -- Pilot who created the post

  category_id UUID REFERENCES feedback_categories(id) ON DELETE SET NULL,
  -- Optional category (e.g., "Safety", "Scheduling", "Equipment")

  -- Post Content
  title TEXT NOT NULL,
  -- Post title (e.g., "Suggestion: Improve roster visibility")

  content TEXT NOT NULL,
  -- Full post content (Markdown supported)

  -- Engagement
  upvotes INTEGER DEFAULT 0,
  -- Number of upvotes (incremented by pilots)

  comment_count INTEGER DEFAULT 0,
  -- Cached count of comments (updated by trigger)

  -- Moderation
  pinned BOOLEAN DEFAULT FALSE,
  -- Admins can pin important posts to top

  hidden BOOLEAN DEFAULT FALSE,
  -- Admins can hide inappropriate posts

  hidden_reason TEXT,
  -- Required if hidden = TRUE

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_posts_author_id ON feedback_posts(author_id);
CREATE INDEX idx_feedback_posts_category_id ON feedback_posts(category_id);
CREATE INDEX idx_feedback_posts_created_at ON feedback_posts(created_at DESC);
CREATE INDEX idx_feedback_posts_upvotes ON feedback_posts(upvotes DESC);
CREATE INDEX idx_feedback_posts_pinned ON feedback_posts(pinned) WHERE pinned = TRUE;
CREATE INDEX idx_feedback_posts_hidden ON feedback_posts(hidden) WHERE hidden = FALSE;

-- RLS Policies
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;

-- Pilots and admins can view non-hidden posts
CREATE POLICY "Users can view non-hidden posts"
ON feedback_posts FOR SELECT
USING (
  hidden = FALSE OR
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Pilots can create posts
CREATE POLICY "Pilots can create posts"
ON feedback_posts FOR INSERT
WITH CHECK (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON feedback_posts FOR UPDATE
USING (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

-- Admins can update any post (pin, hide)
CREATE POLICY "Admins can update any post"
ON feedback_posts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_feedback_posts_updated_at
BEFORE UPDATE ON feedback_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### 8. feedback_comments

**Purpose**: Comments on feedback posts (flat thread structure).

**Business Rules**:

- Flat comment structure (no nesting)
- @mentions for referencing other pilots
- Admin can delete inappropriate comments
- Comment count cached in feedback_posts

**SQL DDL**:

```sql
CREATE TABLE feedback_comments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,

  author_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  -- Pilot who wrote the comment

  -- Comment Content
  content TEXT NOT NULL,
  -- Comment text (Markdown supported)

  mentions UUID[],
  -- Array of pilot IDs mentioned in comment (for @mentions)

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_comments_post_id ON feedback_comments(post_id);
CREATE INDEX idx_feedback_comments_author_id ON feedback_comments(author_id);
CREATE INDEX idx_feedback_comments_created_at ON feedback_comments(created_at ASC);
CREATE INDEX idx_feedback_comments_mentions ON feedback_comments USING GIN(mentions);

-- RLS Policies
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Pilots and admins can view comments on visible posts
CREATE POLICY "Users can view comments on visible posts"
ON feedback_comments FOR SELECT
USING (
  post_id IN (
    SELECT id FROM feedback_posts WHERE hidden = FALSE
  )
);

-- Pilots can create comments
CREATE POLICY "Pilots can create comments"
ON feedback_comments FOR INSERT
WITH CHECK (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

-- Authors can update their own comments
CREATE POLICY "Authors can update own comments"
ON feedback_comments FOR UPDATE
USING (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

-- Authors and admins can delete comments
CREATE POLICY "Authors and admins can delete comments"
ON feedback_comments FOR DELETE
USING (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_feedback_comments_updated_at
BEFORE UPDATE ON feedback_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Increment comment_count on feedback_posts
CREATE OR REPLACE FUNCTION increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feedback_posts
  SET comment_count = comment_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_post_comment_count_trigger
AFTER INSERT ON feedback_comments
FOR EACH ROW
EXECUTE FUNCTION increment_post_comment_count();

-- Trigger: Decrement comment_count on feedback_posts
CREATE OR REPLACE FUNCTION decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feedback_posts
  SET comment_count = comment_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_post_comment_count_trigger
AFTER DELETE ON feedback_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_post_comment_count();
```

---

### 9. feedback_categories

**Purpose**: Predefined categories for organizing feedback posts.

**Business Rules**:

- Admin-managed (predefined set)
- Categories like "Safety", "Scheduling", "Equipment", "Training", "Other"
- Color coding for visual distinction

**SQL DDL**:

```sql
CREATE TABLE feedback_categories (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category Details
  name TEXT NOT NULL UNIQUE,
  -- Category name (e.g., "Safety", "Scheduling")

  description TEXT,
  -- Optional description

  color TEXT NOT NULL DEFAULT '#3b82f6',
  -- Hex color code for UI (default: blue)

  icon TEXT,
  -- Optional icon name (e.g., "shield", "calendar")

  -- Ordering
  display_order INTEGER DEFAULT 0,
  -- Used for sorting categories in UI

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_categories_display_order ON feedback_categories(display_order);

-- RLS Policies
ALTER TABLE feedback_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "Anyone can view categories"
ON feedback_categories FOR SELECT
USING (TRUE);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
ON feedback_categories FOR ALL
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Data (inserted via migration)
INSERT INTO feedback_categories (name, description, color, icon, display_order) VALUES
('Safety', 'Safety concerns and suggestions', '#ef4444', 'shield', 1),
('Scheduling', 'Roster and scheduling feedback', '#3b82f6', 'calendar', 2),
('Equipment', 'Aircraft equipment and maintenance', '#f59e0b', 'wrench', 3),
('Training', 'Training programs and procedures', '#10b981', 'book', 4),
('Operations', 'General operations feedback', '#6366f1', 'briefcase', 5),
('Other', 'Other suggestions and ideas', '#6b7280', 'lightbulb', 6);
```

---

### 10. audit_logs

**Purpose**: Comprehensive audit trail of all system actions (data changes + business events).

**Business Rules**:

- Database triggers log ALL data mutations automatically
- Application-level logs add business context
- Immutable (no updates or deletes)
- Retention: 7 years (compliance requirement)
- Admin-only access

**SQL DDL**:

```sql
CREATE TABLE audit_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  table_name TEXT,
  -- Table affected (NULL for business events without table)

  operation TEXT NOT NULL CHECK (operation IN (
    'INSERT',
    'UPDATE',
    'DELETE',
    'BUSINESS_EVENT'
  )),

  -- Changed Data (for database operations)
  old_values JSONB,
  -- Previous state (for UPDATE and DELETE)

  new_values JSONB,
  -- New state (for INSERT and UPDATE)

  -- Business Event Details (for application-level logs)
  action TEXT,
  -- Business action (e.g., 'leave_request_approved', 'task_assigned')

  entity_type TEXT,
  -- Entity type (e.g., 'leave_request', 'task', 'pilot')

  entity_id UUID,
  -- ID of affected entity

  description TEXT,
  -- Human-readable description

  metadata JSONB,
  -- Additional context (e.g., { "roster_period": 12, "approved_by": "uuid" })

  -- User Context
  user_id UUID REFERENCES an_users(id) ON DELETE SET NULL,
  -- User who performed the action (NULL for system-generated)

  ip_address INET,
  -- User's IP address (captured by application)

  user_agent TEXT,
  -- User's browser/client info

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at (immutable log)
);

-- Indexes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Partitioning for performance (optional, future enhancement)
-- CREATE TABLE audit_logs_2025 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- No INSERT, UPDATE, DELETE policies for users
-- Inserts handled by triggers and service-layer with service role

-- Trigger: Auto-log all data mutations
-- (This trigger function is created once and applied to critical tables)
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    old_values,
    new_values,
    user_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to critical tables
CREATE TRIGGER pilot_checks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON pilot_checks
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER leave_requests_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER flight_requests_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON flight_requests
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER disciplinary_actions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON disciplinary_actions
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Add more triggers for other critical tables as needed
```

---

## Database Functions

### update_updated_at_column()

**Purpose**: Generic trigger function to update `updated_at` timestamp on row changes.

**SQL**:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Usage**: Applied to all tables with `updated_at` column.

---

## Migration Order

**Critical**: Tables must be created in dependency order to satisfy foreign key constraints.

### Migration File: `20251022_add_missing_core_features.sql`

```sql
-- Migration: Add Missing Core Features
-- Date: 2025-10-22
-- Description: Creates 9 new tables for pilot portal, flight requests, tasks,
--              disciplinary tracking, feedback community, and audit logging.

-- =======================
-- PART 1: UTILITY FUNCTIONS
-- =======================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Audit log trigger
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    old_values,
    new_values,
    user_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- PART 2: TABLES (DEPENDENCY ORDER)
-- =======================

-- Table 1: pilot_registrations (depends on an_users)
-- [Full DDL from above]

-- Table 2: pilot_notifications (depends on pilots)
-- [Full DDL from above]

-- Table 3: feedback_categories (no dependencies)
-- [Full DDL from above]

-- Table 4: feedback_posts (depends on pilots, feedback_categories)
-- [Full DDL from above]

-- Table 5: feedback_comments (depends on feedback_posts, pilots)
-- [Full DDL from above]

-- Table 6: flight_requests (depends on pilots, an_users)
-- [Full DDL from above]

-- Table 7: tasks (depends on an_users)
-- [Full DDL from above]

-- Table 8: disciplinary_actions (depends on pilots, an_users)
-- [Full DDL from above]

-- Table 9: disciplinary_actions_log (depends on disciplinary_actions, an_users)
-- [Full DDL from above]

-- Table 10: audit_logs (depends on an_users)
-- [Full DDL from above]

-- =======================
-- PART 3: SEED DATA
-- =======================

-- Seed feedback categories
-- [INSERT statements from feedback_categories above]

-- =======================
-- PART 4: APPLY AUDIT TRIGGERS
-- =======================

-- Apply audit triggers to existing critical tables
CREATE TRIGGER pilot_checks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON pilot_checks
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER leave_requests_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Apply audit triggers to new tables
CREATE TRIGGER flight_requests_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON flight_requests
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER disciplinary_actions_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON disciplinary_actions
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- =======================
-- MIGRATION COMPLETE
-- =======================
```

---

## Type Generation

After migration is deployed, generate TypeScript types:

```bash
npm run db:types
```

This updates `types/supabase.ts` with new table definitions.

---

## Validation Queries

**Test queries to verify schema correctness:**

```sql
-- 1. Verify all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'pilot_registrations',
  'pilot_notifications',
  'flight_requests',
  'tasks',
  'disciplinary_actions',
  'disciplinary_actions_log',
  'feedback_posts',
  'feedback_comments',
  'feedback_categories',
  'audit_logs'
)
ORDER BY table_name;
-- Expected: 10 rows

-- 2. Verify RLS is enabled on all new tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'pilot_registrations',
  'pilot_notifications',
  'flight_requests',
  'tasks',
  'disciplinary_actions',
  'disciplinary_actions_log',
  'feedback_posts',
  'feedback_comments',
  'feedback_categories',
  'audit_logs'
);
-- Expected: All rows should have rowsecurity = true

-- 3. Verify foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN (
  'pilot_registrations',
  'pilot_notifications',
  'flight_requests',
  'tasks',
  'disciplinary_actions',
  'disciplinary_actions_log',
  'feedback_posts',
  'feedback_comments'
)
ORDER BY tc.table_name, kcu.column_name;

-- 4. Verify triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
  'pilot_registrations',
  'flight_requests',
  'tasks',
  'disciplinary_actions',
  'feedback_posts',
  'feedback_comments'
)
ORDER BY event_object_table, trigger_name;

-- 5. Test RLS policies (run as authenticated user)
SELECT * FROM pilot_notifications LIMIT 1;
SELECT * FROM flight_requests LIMIT 1;
SELECT * FROM tasks LIMIT 1;
-- Should respect RLS policies (only show user's own data)
```

---

## Schema Summary

| Table                      | Rows (Estimated) | Foreign Keys                       | Indexes | RLS | Triggers                      | Purpose                         |
| -------------------------- | ---------------- | ---------------------------------- | ------- | --- | ----------------------------- | ------------------------------- |
| `pilot_registrations`      | ~50/year         | 2 (an_users)                       | 4       | ✅  | 1 (updated_at)                | Registration approval workflow  |
| `pilot_notifications`      | ~500/month       | 1 (pilots)                         | 4       | ✅  | -                             | Real-time pilot notifications   |
| `flight_requests`          | ~100/month       | 2 (pilots, an_users)               | 4       | ✅  | 1 (updated_at)                | Flight request submissions      |
| `tasks`                    | ~200 active      | 2 (an_users)                       | 6       | ✅  | 2 (updated_at, completed_at)  | Task management (Kanban)        |
| `disciplinary_actions`     | ~10-20/year      | 2 (pilots, an_users)               | 4       | ✅  | 1 (updated_at)                | Disciplinary matter tracking    |
| `disciplinary_actions_log` | ~50-100/year     | 2 (disciplinary_actions, an_users) | 2       | ✅  | -                             | Immutable disciplinary timeline |
| `feedback_posts`           | ~50-100/month    | 2 (pilots, feedback_categories)    | 6       | ✅  | 1 (updated_at)                | Community feedback posts        |
| `feedback_comments`        | ~200-400/month   | 2 (feedback_posts, pilots)         | 4       | ✅  | 3 (updated_at, comment_count) | Post comments                   |
| `feedback_categories`      | 6 (predefined)   | -                                  | 1       | ✅  | -                             | Feedback categorization         |
| `audit_logs`               | ~1000+/month     | 1 (an_users)                       | 6       | ✅  | -                             | Complete audit trail            |

**Total New Tables**: 10
**Total Estimated Growth**: ~1,500-2,000 rows/month across all tables

---

## Next Steps

1. ✅ Data model complete
2. ⏳ Create `contracts/` - API endpoint specifications (REST contracts)
3. ⏳ Create `quickstart.md` - Developer implementation guide

**Phase 1 Status**: Data model complete - Ready for API contract design

---

**Data Model Version**: 1.0
**Created**: 2025-10-22
**Last Updated**: 2025-10-22
**Reviewed By**: Claude Code
