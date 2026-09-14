-- ============================================================
--  MIGRAZIONE — sezione Feedback
--  Da eseguire una volta sola sui progetti Supabase creati prima di questa
--  sezione. Se il progetto è nuovo, schema.sql basta da solo.
-- ============================================================

create table if not exists public.app_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  category   text not null default 'altro' check (category in ('bug','miglioria','altro')),
  message    text not null,
  status     text not null default 'nuovo' check (status in ('nuovo','in_lavorazione','risolto')),
  created_at timestamptz not null default now()
);
create index if not exists app_feedback_idx on public.app_feedback(created_at desc);

alter table public.app_feedback enable row level security;

drop policy if exists feedback_select on public.app_feedback;
create policy feedback_select on public.app_feedback for select
  using (user_id = auth.uid() or public.is_god());
drop policy if exists feedback_insert on public.app_feedback;
create policy feedback_insert on public.app_feedback for insert
  with check (user_id = auth.uid());
drop policy if exists feedback_update on public.app_feedback;
create policy feedback_update on public.app_feedback for update
  using (public.is_god()) with check (public.is_god());
drop policy if exists feedback_delete on public.app_feedback;
create policy feedback_delete on public.app_feedback for delete
  using (user_id = auth.uid() or public.is_god());
