-- ============================================================
--  FOTO DELLE MISURAZIONI
--  Se hai già eseguito schema.sql in passato, esegui SOLO questo file.
--  Nei progetti nuovi è già incluso in schema.sql: non serve rieseguirlo.
-- ============================================================

-- ---------- Tabella ----------
-- Una riga per foto. user_id è ripetuto qui apposta: permette alle policy e ai
-- percorsi dello storage di lavorare senza join su measurements.
create table if not exists public.measurement_photos (
  id             uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references public.measurements(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  path           text not null unique,   -- percorso dentro il bucket: <user_id>/<measurement_id>/<file>
  position       int  not null default 1,
  pose           text,                   -- fronte, lato, retro
  created_at     timestamptz not null default now()
);
create index if not exists measurement_photos_idx
  on public.measurement_photos(measurement_id, position);

alter table public.measurement_photos enable row level security;

-- Stessa regola delle misurazioni: l'atleta le sue, il coach quelle di tutti.
drop policy if exists mp_all on public.measurement_photos;
create policy mp_all on public.measurement_photos for all
  using (user_id = auth.uid() or public.is_god())
  with check (user_id = auth.uid() or public.is_god());

-- ---------- Bucket PRIVATO ----------
-- Diverso da 'exercise-media', che è pubblico: qui ci sono foto del corpo di una
-- persona. Niente URL indovinabile, si leggono solo con link firmati a scadenza.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public             = false,
  file_size_limit    = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- La prima cartella del percorso è l'id dell'utente: è quello che confrontiamo.
drop policy if exists "foto progressi in lettura" on storage.objects;
create policy "foto progressi in lettura" on storage.objects for select using (
  bucket_id = 'progress-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_god())
);

drop policy if exists "foto progressi in scrittura" on storage.objects;
create policy "foto progressi in scrittura" on storage.objects for insert with check (
  bucket_id = 'progress-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_god())
);

drop policy if exists "foto progressi in cancellazione" on storage.objects;
create policy "foto progressi in cancellazione" on storage.objects for delete using (
  bucket_id = 'progress-photos'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_god())
);

-- ---------- Niente file orfani ----------
-- Eliminando una misurazione le sue foto spariscono a cascata dalla tabella, ma i
-- file resterebbero a occupare il GB gratuito per sempre. Questo trigger li porta via.
create or replace function public.cleanup_photo_file()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from storage.objects
   where bucket_id = 'progress-photos' and name = old.path;
  return old;
end; $$;

drop trigger if exists on_measurement_photo_deleted on public.measurement_photos;
create trigger on_measurement_photo_deleted
  after delete on public.measurement_photos
  for each row execute function public.cleanup_photo_file();
