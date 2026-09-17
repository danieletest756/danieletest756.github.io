-- ============================================================
--  MIGRAZIONE — Agenda (appuntamenti + export .ics)
--  Da eseguire una volta sola sui progetti Supabase creati prima di questa
--  funzionalità. Se il progetto è nuovo, schema.sql basta da solo.
-- ============================================================

create table if not exists public.appointments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null default 'Sessione di allenamento',
  starts_at    timestamptz not null,
  duration_min int not null default 60,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists appointments_user_idx on public.appointments(user_id, starts_at);

alter table public.appointments enable row level security;

drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments for select
  using (user_id = auth.uid() or public.is_god());
drop policy if exists appointments_write on public.appointments;
create policy appointments_write on public.appointments for all
  using (public.is_god() or (public.is_semi_god() and user_id = auth.uid()))
  with check (public.is_god() or (public.is_semi_god() and user_id = auth.uid()));
