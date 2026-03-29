CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := NEW.id;
  v_goal_id UUID;
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
  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '朝ごはんを食べる',           'daily_routine', 33, 1),
    (v_user_id, '30分以上歩く・運動する',      'daily_routine', 33, 1),
    (v_user_id, '今日やることを書き出す',      'daily_routine', 33, 1);

  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '部屋の掃除', 'weekly_routine', 20, 2),
    (v_user_id, '読書・勉強', 'weekly_routine', 20, 3);

  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '断捨離をする', 'someday', 30, 1);

  INSERT INTO tasks (user_id, title, type, points, weekly_count) VALUES
    (v_user_id, '役所・手続き系の書類を片付ける', 'urgent', 50, 1);

  -- デフォルトゴール: 登録日から1ヶ月後がゴール、2週間後が中間
  INSERT INTO goals (user_id, name, target_date)
  VALUES (v_user_id, '1ヶ月継続', current_date + interval '1 month')
  RETURNING id INTO v_goal_id;

  INSERT INTO goal_steps (goal_id, title, "order", scheduled_date, is_milestone) VALUES
    (v_goal_id, '週2回、30分の運動（散歩やストレッチなど）', 1, null,                                    false),
    (v_goal_id, '週4回、30分の運動',                        2, current_date + interval '2 weeks', true),
    (v_goal_id, '1ヶ月継続',                                3, current_date + interval '1 month', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
