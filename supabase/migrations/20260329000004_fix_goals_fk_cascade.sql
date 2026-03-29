ALTER TABLE goals
  DROP CONSTRAINT goals_user_id_fkey,
  ADD CONSTRAINT goals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
