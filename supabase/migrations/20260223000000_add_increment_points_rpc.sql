-- タスク完了時のポイント加算RPC
-- daily_routine → points_today + points_total
-- weekly_routine → points_this_week + points_total
-- urgent / someday → points_today + points_this_week + points_total
CREATE OR REPLACE FUNCTION increment_points(
  p_user_id UUID,
  p_points INTEGER,
  p_type TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_type = 'daily_routine' THEN
    UPDATE user_profiles
    SET points_today = points_today + p_points,
        points_total = points_total + p_points,
        updated_at = NOW()
    WHERE id = p_user_id;

  ELSIF p_type = 'weekly_routine' THEN
    UPDATE user_profiles
    SET points_this_week = points_this_week + p_points,
        points_total = points_total + p_points,
        updated_at = NOW()
    WHERE id = p_user_id;

  ELSE
    UPDATE user_profiles
    SET points_today = points_today + p_points,
        points_this_week = points_this_week + p_points,
        points_total = points_total + p_points,
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- points_today リセット（日付変わり時）
CREATE OR REPLACE FUNCTION reset_points_today(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET points_today = 0, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- points_this_week リセット（週変わり時）
CREATE OR REPLACE FUNCTION reset_points_week(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET points_this_week = 0, updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
