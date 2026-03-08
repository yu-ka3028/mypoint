CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := NEW.id;
BEGIN
  INSERT INTO user_profiles (id, display_name, avatar_url)
  VALUES (
    v_user_id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email,
      'anonymous'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- デフォルトタスク挿入
  -- daily_routine: 3タスク → floor(100/3) = 33pt
  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '朝ごはんを食べる',           'daily_routine', 33, 1),
    (v_user_id, '30分以上歩く・運動する',      'daily_routine', 33, 1),
    (v_user_id, '今日やることを書き出す',      'daily_routine', 33, 1);

  -- weekly_routine: 合計5スロット → floor(100/5) = 20pt
  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '部屋の掃除', 'weekly_routine', 20, 2),
    (v_user_id, '読書・勉強', 'weekly_routine', 20, 3);

  -- someday
  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '断捨離をする', 'someday', 30, 1);

  -- urgent
  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '役所・手続き系の書類を片付ける', 'urgent', 50, 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
