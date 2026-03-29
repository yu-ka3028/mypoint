create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  started_at date not null default current_date,
  target_date date not null,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table goal_steps (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals on delete cascade not null,
  title text not null,
  "order" int not null,
  scheduled_date date,
  is_milestone boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table goals enable row level security;
alter table goal_steps enable row level security;

create policy "own goals" on goals for all using (auth.uid() = user_id);
create policy "own goal_steps" on goal_steps for all using (
  goal_id in (select id from goals where user_id = auth.uid())
);
