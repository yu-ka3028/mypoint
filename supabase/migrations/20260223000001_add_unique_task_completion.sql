ALTER TABLE task_completions
  ADD CONSTRAINT unique_task_completion_per_day UNIQUE (user_id, task_id, completion_date);
