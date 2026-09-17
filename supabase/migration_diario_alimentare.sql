-- ============================================================
--  MIGRAZIONE — Diario alimentare (spunta dei pasti consumati)
--  Da eseguire una volta sola sui progetti Supabase creati prima di questa
--  funzionalità. Se il progetto è nuovo, schema.sql basta da solo.
-- ============================================================

create table if not exists public.meal_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  meal_id    uuid not null references public.diet_meals(id) on delete cascade,
  date       date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, meal_id, date)
);
create index if not exists meal_checks_idx on public.meal_checks(user_id, date desc);

alter table public.meal_checks enable row level security;

drop policy if exists meal_checks_all on public.meal_checks;
create policy meal_checks_all on public.meal_checks for all
  using (user_id = auth.uid() or public.is_god())
  with check (user_id = auth.uid() or public.is_god());
