-- tasks に weekly_count 追加
ALTER TABLE tasks ADD COLUMN weekly_count INTEGER NOT NULL DEFAULT 1;

-- =============================================
-- weekly_routine_completions（新規）
-- =============================================
CREATE TABLE weekly_routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_week TEXT NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weekly_routine_completions_user_week
  ON weekly_routine_completions(user_id, target_week);

ALTER TABLE weekly_routine_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_routine_completions_all" ON weekly_routine_completions
  FOR ALL USING (auth.uid() = user_id);

-- weekly_routine_status 廃止
DROP TABLE weekly_routine_status;
