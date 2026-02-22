-- =============================================
-- user_profiles (パブリック)
-- =============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  points_today INTEGER NOT NULL DEFAULT 0,
  points_this_week INTEGER NOT NULL DEFAULT 0,
  points_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- tasks (プライベート)
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('urgent', 'someday', 'daily_routine', 'weekly_routine')),
  points INTEGER NOT NULL DEFAULT 0,
  deadline DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- task_completions (プライベート)
-- =============================================
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  points_earned INTEGER NOT NULL,
  completion_date DATE NOT NULL,
  completion_week TEXT NOT NULL
);

-- =============================================
-- daily_routine_status (プライベート)
-- =============================================
CREATE TABLE daily_routine_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, task_id, target_date)
);

-- =============================================
-- weekly_routine_status (プライベート)
-- =============================================
CREATE TABLE weekly_routine_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_week TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, task_id, target_week)
);

-- =============================================
-- rewards (パブリック/プライベート混在)
-- =============================================
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_points INTEGER NOT NULL,
  is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- インデックス
-- =============================================
CREATE INDEX idx_tasks_user_active ON tasks(user_id, is_active);
CREATE INDEX idx_task_completions_user_date ON task_completions(user_id, completion_date);
CREATE INDEX idx_task_completions_user_week ON task_completions(user_id, completion_week);
CREATE INDEX idx_daily_routine_status_user_date ON daily_routine_status(user_id, target_date);
CREATE INDEX idx_weekly_routine_status_user_week ON weekly_routine_status(user_id, target_week);

-- =============================================
-- RLS 有効化
-- =============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_routine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_routine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS ポリシー: user_profiles
-- 誰でも読める / 本人のみ書ける
-- =============================================
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- RLS ポリシー: tasks / completions / status
-- 本人のみ
-- =============================================
CREATE POLICY "tasks_all" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "task_completions_all" ON task_completions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "daily_routine_status_all" ON daily_routine_status
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "weekly_routine_status_all" ON weekly_routine_status
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- RLS ポリシー: rewards
-- is_public=true は誰でも読める / 本人のみ書ける
-- =============================================
CREATE POLICY "rewards_select" ON rewards
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "rewards_insert" ON rewards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rewards_update" ON rewards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rewards_delete" ON rewards
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ユーザー登録時に user_profiles を自動作成
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
