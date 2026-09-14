-- ============================================================
--  MIGRAZIONE — sezione Obiettivi (in Progressi)
--  Da eseguire una volta sola sui progetti Supabase creati prima di questa
--  sezione. Se il progetto è nuovo, schema.sql basta da solo.
-- ============================================================

create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  metric       text not null check (metric in
    ('weight_kg','chest_cm','waist_cm','hips_cm','thigh_cm','glute_cm','calf_cm','exercise')),
  exercise_id  uuid references public.exercises(id) on delete set null,
  start_value  numeric not null,
  target_value numeric not null,
  target_date  date,
  created_at   timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals(user_id, created_at desc);

alter table public.goals enable row level security;

drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals for select
  using (user_id = auth.uid() or public.is_god());
drop policy if exists goals_write on public.goals;
create policy goals_write on public.goals for all
  using (public.is_god() or (public.is_semi_god() and user_id = auth.uid()))
  with check (public.is_god() or (public.is_semi_god() and user_id = auth.uid()));
