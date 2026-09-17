-- ============================================================
--  MIGRAZIONE — check-in giornaliero (sonno, stress, energia, dolori)
--  Da eseguire una volta sola sui progetti Supabase creati prima di questa
--  funzionalità. Se il progetto è nuovo, schema.sql basta da solo.
-- ============================================================

create table if not exists public.checkins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  date           date not null default current_date,
  sleep_score    int check (sleep_score between 1 and 5),
  stress_score   int check (stress_score between 1 and 5),
  energy_score   int check (energy_score between 1 and 5),
  soreness_score int check (soreness_score between 1 and 5),
  notes          text,
  created_at     timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists checkins_user_date_idx on public.checkins(user_id, date desc);

alter table public.checkins enable row level security;

drop policy if exists checkins_all on public.checkins;
create policy checkins_all on public.checkins for all
  using (user_id = auth.uid() or public.is_god())
  with check (user_id = auth.uid() or public.is_god());
