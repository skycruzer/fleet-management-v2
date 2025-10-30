-- Migration: Add Missing Core Features
-- Date: 2025-10-22
-- Description: Creates 10 new tables for pilot portal, flight requests, tasks,
--              disciplinary tracking, feedback community, audit logging, and notifications.
--
-- Tables Created:
-- 1. pilot_registrations - Registration approval workflow
-- 2. pilot_notifications - Real-time pilot notifications
-- 3. feedback_categories - Feedback categorization (with seed data)
-- 4. feedback_posts - Community feedback posts
-- 5. feedback_comments - Post comments
-- 6. flight_requests - Flight request submissions
-- 7. tasks - Task management
-- 8. disciplinary_actions - Disciplinary matter tracking
-- 9. disciplinary_actions_log - Disciplinary timeline
-- 10. audit_logs - Complete audit trail

-- Drop existing policies to avoid conflicts

DROP POLICY IF EXISTS "Admins can view all registrations" ON pilot_registrations;
DROP POLICY IF EXISTS "Users can view own registration" ON pilot_registrations;
DROP POLICY IF EXISTS "Users can create own registration" ON pilot_registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON pilot_registrations;
DROP POLICY IF EXISTS "Pilots can view own notifications" ON pilot_notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON pilot_notifications;
DROP POLICY IF EXISTS "Pilots can mark own notifications as read" ON pilot_notifications;
DROP POLICY IF EXISTS "Anyone can view categories" ON feedback_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON feedback_categories;
DROP POLICY IF EXISTS "Users can view non-hidden posts" ON feedback_posts;
DROP POLICY IF EXISTS "Pilots can create posts" ON feedback_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON feedback_posts;
DROP POLICY IF EXISTS "Admins can update any post" ON feedback_posts;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON feedback_comments;
DROP POLICY IF EXISTS "Pilots can create comments" ON feedback_comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON feedback_comments;
DROP POLICY IF EXISTS "Authors and admins can delete comments" ON feedback_comments;
DROP POLICY IF EXISTS "Pilots can view own flight requests" ON flight_requests;
DROP POLICY IF EXISTS "Admins can view all flight requests" ON flight_requests;
DROP POLICY IF EXISTS "Pilots can create flight requests" ON flight_requests;
DROP POLICY IF EXISTS "Admins can update flight requests" ON flight_requests;
DROP POLICY IF EXISTS "Admins and managers can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own created tasks" ON tasks;
DROP POLICY IF EXISTS "Admins and managers can create tasks" ON tasks;
DROP POLICY IF EXISTS "Admins and managers can update tasks" ON tasks;
DROP POLICY IF EXISTS "Assigned users can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Admins can view all disciplinary matters" ON disciplinary_actions;
DROP POLICY IF EXISTS "Admins can create disciplinary matters" ON disciplinary_actions;
DROP POLICY IF EXISTS "Admins can update disciplinary matters" ON disciplinary_actions;
DROP POLICY IF EXISTS "Admins can view all log entries" ON disciplinary_actions_log;
DROP POLICY IF EXISTS "Admins can insert log entries" ON disciplinary_actions_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

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
CREATE TABLE pilot_registrations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES an_users(id) ON DELETE CASCADE,

  -- Registration Data
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  employee_id TEXT UNIQUE,
  rank TEXT NOT NULL CHECK (rank IN ('Captain', 'First Officer')),
  date_of_birth DATE,
  phone_number TEXT,
  address TEXT,

  -- Verification & Approval
  email_verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'DENIED')),

  -- Admin Review
  reviewed_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  denial_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for pilot_registrations
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_registrations' 
    AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_registrations_user_id ON pilot_registrations(user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_registrations' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_registrations_status ON pilot_registrations(status);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_registrations' 
    AND column_name = 'email'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_registrations_email ON pilot_registrations(email);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_registrations' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_registrations_created_at ON pilot_registrations(created_at DESC);
  END IF;
END $$;

-- RLS Policies for pilot_registrations
ALTER TABLE pilot_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all registrations"
ON pilot_registrations FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view own registration"
ON pilot_registrations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own registration"
ON pilot_registrations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update registrations"
ON pilot_registrations FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for pilot_registrations
CREATE TRIGGER set_pilot_registrations_updated_at
BEFORE UPDATE ON pilot_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table 2: pilot_notifications (depends on pilots)
CREATE TABLE pilot_notifications (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,

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
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB,

  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for pilot_notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_notifications' 
    AND column_name = 'pilot_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_notifications_pilot_id ON pilot_notifications(pilot_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_notifications' 
    AND column_name = 'read'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_notifications_read ON pilot_notifications(read);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'pilot_notifications' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_pilot_notifications_created_at ON pilot_notifications(created_at DESC);
  END IF;
END $$;
CREATE INDEX idx_pilot_notifications_pilot_unread ON pilot_notifications(pilot_id, read) WHERE read = FALSE;

-- RLS Policies for pilot_notifications
ALTER TABLE pilot_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pilots can view own notifications"
ON pilot_notifications FOR SELECT
USING (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create notifications"
ON pilot_notifications FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Pilots can mark own notifications as read"
ON pilot_notifications FOR UPDATE
USING (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

-- Table 3: feedback_categories (no dependencies)
CREATE TABLE IF NOT EXISTS feedback_categories (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category Details
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT,

  -- Ordering
  display_order INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback_categories
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_categories' 
    AND column_name = 'display_order'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_categories_display_order ON feedback_categories(display_order);
  END IF;
END $$;

-- RLS Policies for feedback_categories
ALTER TABLE feedback_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
ON feedback_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage categories"
ON feedback_categories FOR ALL
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Table 4: feedback_posts (depends on pilots, feedback_categories)
CREATE TABLE IF NOT EXISTS feedback_posts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  author_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  category_id UUID REFERENCES feedback_categories(id) ON DELETE SET NULL,

  -- Post Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Engagement
  upvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,

  -- Moderation
  pinned BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  hidden_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback_posts
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_posts' 
    AND column_name = 'author_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_posts_author_id ON feedback_posts(author_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_posts' 
    AND column_name = 'category_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_posts_category_id ON feedback_posts(category_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_posts' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_posts_created_at ON feedback_posts(created_at DESC);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_posts' 
    AND column_name = 'upvotes DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_posts_upvotes ON feedback_posts(upvotes DESC);
  END IF;
END $$;
CREATE INDEX idx_feedback_posts_pinned ON feedback_posts(pinned) WHERE pinned = TRUE;
CREATE INDEX idx_feedback_posts_hidden ON feedback_posts(hidden) WHERE hidden = FALSE;

-- RLS Policies for feedback_posts
ALTER TABLE feedback_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view non-hidden posts"
ON feedback_posts FOR SELECT
USING (
  hidden = FALSE OR
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Pilots can create posts"
ON feedback_posts FOR INSERT
WITH CHECK (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

CREATE POLICY "Authors can update own posts"
ON feedback_posts FOR UPDATE
USING (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update any post"
ON feedback_posts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for feedback_posts
CREATE TRIGGER set_feedback_posts_updated_at
BEFORE UPDATE ON feedback_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table 5: feedback_comments (depends on feedback_posts, pilots)
CREATE TABLE IF NOT EXISTS feedback_comments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  post_id UUID NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,

  -- Comment Content
  content TEXT NOT NULL,
  mentions UUID[],

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback_comments
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_comments' 
    AND column_name = 'post_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_comments_post_id ON feedback_comments(post_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_comments' 
    AND column_name = 'author_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_comments_author_id ON feedback_comments(author_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'feedback_comments' 
    AND column_name = 'created_at ASC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_feedback_comments_created_at ON feedback_comments(created_at ASC);
  END IF;
END $$;
CREATE INDEX idx_feedback_comments_mentions ON feedback_comments USING GIN(mentions);

-- RLS Policies for feedback_comments
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible posts"
ON feedback_comments FOR SELECT
USING (
  post_id IN (
    SELECT id FROM feedback_posts WHERE hidden = FALSE
  )
);

CREATE POLICY "Pilots can create comments"
ON feedback_comments FOR INSERT
WITH CHECK (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

CREATE POLICY "Authors can update own comments"
ON feedback_comments FOR UPDATE
USING (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid())
);

CREATE POLICY "Authors and admins can delete comments"
ON feedback_comments FOR DELETE
USING (
  author_id IN (SELECT id FROM pilots WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for feedback_comments
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

-- Table 6: flight_requests (depends on pilots, an_users)
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
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  reason TEXT NOT NULL,
  additional_details TEXT,

  -- Approval Workflow
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'DENIED'
  )),

  reviewed_by UUID REFERENCES an_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_comments TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes for flight_requests
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'flight_requests' 
    AND column_name = 'pilot_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_flight_requests_pilot_id ON flight_requests(pilot_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'flight_requests' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_flight_requests_status ON flight_requests(status);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'flight_requests' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_flight_requests_created_at ON flight_requests(created_at DESC);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'flight_requests' 
    AND column_name = 'start_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_flight_requests_start_date ON flight_requests(start_date);
  END IF;
END $$;

-- RLS Policies for flight_requests
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pilots can view own flight requests"
ON flight_requests FOR SELECT
USING (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all flight requests"
ON flight_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Pilots can create flight requests"
ON flight_requests FOR INSERT
WITH CHECK (
  pilot_id IN (
    SELECT id FROM pilots WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update flight requests"
ON flight_requests FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Trigger for flight_requests
CREATE TRIGGER set_flight_requests_updated_at
BEFORE UPDATE ON flight_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table 7: tasks (depends on an_users)
CREATE TABLE tasks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task Details
  title TEXT NOT NULL,
  description TEXT,

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
  created_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,

  -- Scheduling
  due_date DATE,

  -- Categorization
  tags TEXT[],

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for tasks
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'assigned_to'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'due_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'priority'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
  END IF;
END $$;
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

-- RLS Policies for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view all tasks"
ON tasks FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Users can view assigned tasks"
ON tasks FOR SELECT
USING (assigned_to = auth.uid());

CREATE POLICY "Users can view own created tasks"
ON tasks FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Admins and managers can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Admins and managers can update tasks"
ON tasks FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Assigned users can update their tasks"
ON tasks FOR UPDATE
USING (assigned_to = auth.uid());

-- Trigger for tasks
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

-- Table 8: disciplinary_actions (depends on pilots, an_users)
CREATE TABLE IF NOT EXISTS disciplinary_actions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,

  -- Matter Details
  matter_type TEXT NOT NULL CHECK (matter_type IN (
    'investigation',
    'verbal_warning',
    'written_warning',
    'suspension',
    'other'
  )),

  title TEXT NOT NULL,
  description TEXT NOT NULL,

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
  resolved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for disciplinary_actions
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'disciplinary_actions' 
    AND column_name = 'pilot_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_pilot_id ON disciplinary_actions(pilot_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'disciplinary_actions' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_status ON disciplinary_actions(status);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'disciplinary_actions' 
    AND column_name = 'created_by'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_created_by ON disciplinary_actions(created_by);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'disciplinary_actions' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_created_at ON disciplinary_actions(created_at DESC);
  END IF;
END $$;

-- RLS Policies for disciplinary_actions
ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all disciplinary matters"
ON disciplinary_actions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can create disciplinary matters"
ON disciplinary_actions FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update disciplinary matters"
ON disciplinary_actions FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger for disciplinary_actions
CREATE TRIGGER set_disciplinary_actions_updated_at
BEFORE UPDATE ON disciplinary_actions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table 9: disciplinary_actions_log (depends on disciplinary_actions, an_users)
CREATE TABLE IF NOT EXISTS disciplinary_actions_log (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  matter_id UUID NOT NULL REFERENCES disciplinary_actions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES an_users(id) ON DELETE CASCADE,

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
  attachments TEXT[],

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for disciplinary_actions_log
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'disciplinary_actions_log' 
    AND column_name = 'matter_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_log_matter_id ON disciplinary_actions_log(matter_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'disciplinary_actions_log' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_log_created_at ON disciplinary_actions_log(created_at DESC);
  END IF;
END $$;

-- RLS Policies for disciplinary_actions_log
ALTER TABLE disciplinary_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all log entries"
ON disciplinary_actions_log FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can insert log entries"
ON disciplinary_actions_log FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- Table 10: audit_logs (depends on an_users)
CREATE TABLE audit_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Details
  table_name TEXT,
  operation TEXT NOT NULL CHECK (operation IN (
    'INSERT',
    'UPDATE',
    'DELETE',
    'BUSINESS_EVENT'
  )),

  -- Changed Data
  old_values JSONB,
  new_values JSONB,

  -- Business Event Details
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB,

  -- User Context
  user_id UUID REFERENCES an_users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit_logs
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'table_name'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'operation'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'created_at DESC'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'entity_type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'audit_logs' 
    AND column_name = 'action'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  END IF;
END $$;

-- RLS Policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM an_users WHERE id = auth.uid() AND role = 'admin')
);

-- =======================
-- PART 3: SEED DATA
-- =======================

-- Seed feedback categories
INSERT INTO feedback_categories (name, description, color, icon, display_order) VALUES
('Safety', 'Safety concerns and suggestions', '#ef4444', 'shield', 1),
('Scheduling', 'Roster and scheduling feedback', '#3b82f6', 'calendar', 2),
('Equipment', 'Aircraft equipment and maintenance', '#f59e0b', 'wrench', 3),
('Training', 'Training programs and procedures', '#10b981', 'book', 4),
('Operations', 'General operations feedback', '#6366f1', 'briefcase', 5),
('Other', 'Other suggestions and ideas', '#6b7280', 'lightbulb', 6);

-- =======================
-- PART 4: APPLY AUDIT TRIGGERS
-- =======================

-- Apply audit triggers to existing critical tables
DO $$
BEGIN
  -- Check if trigger exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'pilot_checks_audit_trigger'
  ) THEN
    CREATE TRIGGER pilot_checks_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pilot_checks
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'leave_requests_audit_trigger'
  ) THEN
    CREATE TRIGGER leave_requests_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
  END IF;
END $$;

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

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251022153333_add_missing_core_features completed successfully';
  RAISE NOTICE 'Created 10 new tables with RLS policies and triggers';
  RAISE NOTICE 'Seeded 6 feedback categories';
END $$;
