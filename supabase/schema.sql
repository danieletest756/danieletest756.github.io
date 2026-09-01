-- ============================================================
--  SCHEMA COMPLETO — da incollare nel SQL Editor di Supabase
--  Esegui tutto in una volta, dall'inizio alla fine.
-- ============================================================

-- ---------- 1. PROFILI ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'atleta' check (role in ('atleta','god','semi_god')),
  birth_date   date,
  sex          text check (sex in ('F','M','altro')),
  height_cm    numeric,
  phone        text,
  goal         text,          -- obiettivo dichiarato
  notes        text,          -- note del coach, non modificabili dall'atleta
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Crea il profilo automaticamente alla registrazione
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Funzione helper: sono un god? (SECURITY DEFINER = niente ricorsione RLS)
create or replace function public.is_god()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'god');
$$;

-- Semi-god: stessi permessi di scrittura del god, ma solo sui propri dati.
-- Non vede né tocca gli altri atleti: niente lista Atleti, niente libreria esercizi.
create or replace function public.is_semi_god()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'semi_god');
$$;

-- ---------- 2. MISURAZIONI ----------
create table if not exists public.measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null default current_date,
  weight_kg   numeric,
  chest_cm    numeric,
  waist_cm    numeric,
  hips_cm     numeric,
  thigh_cm    numeric,
  glute_cm    numeric,
  calf_cm     numeric,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists measurements_user_date_idx on public.measurements(user_id, date desc);

-- Foto allegate a una misurazione. user_id è ripetuto qui apposta: permette alle
-- policy e ai percorsi dello storage di lavorare senza join su measurements.
create table if not exists public.measurement_photos (
  id             uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references public.measurements(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  path           text not null unique,   -- <user_id>/<measurement_id>/<file> dentro il bucket
  position       int  not null default 1,
  pose           text,                   -- fronte, lato, retro
  created_at     timestamptz not null default now()
);
create index if not exists measurement_photos_idx
  on public.measurement_photos(measurement_id, position);

-- ---------- 3. LIBRERIA ESERCIZI (condivisa) ----------
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  muscle_group text,
  image_url    text,
  video_url    text,
  cues         text,          -- indicazioni tecniche
  created_at   timestamptz not null default now()
);

-- ---------- 4. SCHEDE DI ALLENAMENTO ----------
create table if not exists public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  start_date  date,
  weeks       int default 8,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.workout_days (
  id        uuid primary key default gen_random_uuid(),
  plan_id   uuid not null references public.workout_plans(id) on delete cascade,
  position  int not null default 1,
  title     text not null,
  notes     text
);

create table if not exists public.workout_items (
  id          uuid primary key default gen_random_uuid(),
  day_id      uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  position    int not null default 1,
  sets        text,           -- "3", "4"
  reps        text,           -- "8-10", "12-15", "30-40 sec"
  rir         text,           -- "3", "1-2"
  rest_sec    int,
  notes       text
);

-- Log dei carichi
create table if not exists public.workout_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  item_id   uuid not null references public.workout_items(id) on delete cascade,
  date      date not null default current_date,
  set_no    int not null default 1,
  weight_kg numeric,
  reps      int,
  rir       numeric,
  notes     text,
  created_at timestamptz not null default now()
);
create index if not exists workout_logs_idx on public.workout_logs(user_id, item_id, date desc);

-- ---------- 5. DIETA ----------
create table if not exists public.diet_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  kcal       int,
  protein_g  int,
  carbs_g    int,
  fat_g      int,
  water_l    numeric,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.diet_meals (
  id       uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references public.diet_plans(id) on delete cascade,
  position int not null default 1,
  name     text not null,       -- Colazione, Spuntino, Pranzo...
  time_label text,              -- "07:30", "pre-workout"
  notes    text
);

create table if not exists public.diet_foods (
  id        uuid primary key default gen_random_uuid(),
  meal_id   uuid not null references public.diet_meals(id) on delete cascade,
  position  int not null default 1,
  name      text not null,
  qty       text,               -- "150 g", "1 vasetto"
  kcal      numeric,
  protein_g numeric,
  carbs_g   numeric,
  fat_g     numeric,
  alt       text                -- alternativa consentita
);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.measurements  enable row level security;
alter table public.measurement_photos enable row level security;
alter table public.exercises     enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days  enable row level security;
alter table public.workout_items enable row level security;
alter table public.workout_logs  enable row level security;
alter table public.diet_plans    enable row level security;
alter table public.diet_meals    enable row level security;
alter table public.diet_foods    enable row level security;

-- PROFILI: ognuno vede e modifica il suo, il god vede e modifica tutti
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_god());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_god())
  with check (id = auth.uid() or public.is_god());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid() or public.is_god());

-- MISURAZIONI
drop policy if exists measurements_all on public.measurements;
create policy measurements_all on public.measurements for all
  using (user_id = auth.uid() or public.is_god())
  with check (user_id = auth.uid() or public.is_god());

drop policy if exists mp_all on public.measurement_photos;
create policy mp_all on public.measurement_photos for all
  using (user_id = auth.uid() or public.is_god())
  with check (user_id = auth.uid() or public.is_god());

-- ESERCIZI: tutti leggono, solo il god scrive
drop policy if exists exercises_select on public.exercises;
create policy exercises_select on public.exercises for select using (auth.uid() is not null);
drop policy if exists exercises_write on public.exercises;
create policy exercises_write on public.exercises for all
  using (public.is_god()) with check (public.is_god());

-- SCHEDE: l'atleta legge le sue, il god fa tutto
drop policy if exists wp_select on public.workout_plans;
create policy wp_select on public.workout_plans for select
  using (user_id = auth.uid() or public.is_god());
drop policy if exists wp_write on public.workout_plans;
create policy wp_write on public.workout_plans for all
  using (public.is_god() or (public.is_semi_god() and user_id = auth.uid()))
  with check (public.is_god() or (public.is_semi_god() and user_id = auth.uid()));

drop policy if exists wd_select on public.workout_days;
create policy wd_select on public.workout_days for select using (
  public.is_god() or exists (
    select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists wd_write on public.workout_days;
create policy wd_write on public.workout_days for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())));

drop policy if exists wi_select on public.workout_items;
create policy wi_select on public.workout_items for select using (
  public.is_god() or exists (
    select 1 from public.workout_days d
    join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid()));
drop policy if exists wi_write on public.workout_items;
create policy wi_write on public.workout_items for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid())));

-- LOG CARICHI: l'atleta scrive i suoi, il god li vede
drop policy if exists wl_all on public.workout_logs;
create policy wl_all on public.workout_logs for all
  using (user_id = auth.uid() or public.is_god())
  with check (user_id = auth.uid() or public.is_god());

-- DIETA
drop policy if exists dp_select on public.diet_plans;
create policy dp_select on public.diet_plans for select
  using (user_id = auth.uid() or public.is_god());
drop policy if exists dp_write on public.diet_plans;
create policy dp_write on public.diet_plans for all
  using (public.is_god() or (public.is_semi_god() and user_id = auth.uid()))
  with check (public.is_god() or (public.is_semi_god() and user_id = auth.uid()));

drop policy if exists dm_select on public.diet_meals;
create policy dm_select on public.diet_meals for select using (
  public.is_god() or exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists dm_write on public.diet_meals;
create policy dm_write on public.diet_meals for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid())));

drop policy if exists df_select on public.diet_foods;
create policy df_select on public.diet_foods for select using (
  public.is_god() or exists (
    select 1 from public.diet_meals m
    join public.diet_plans p on p.id = m.plan_id
    where m.id = meal_id and p.user_id = auth.uid()));
drop policy if exists df_write on public.diet_foods;
create policy df_write on public.diet_foods for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_meals m join public.diet_plans p on p.id = m.plan_id
    where m.id = meal_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_meals m join public.diet_plans p on p.id = m.plan_id
    where m.id = meal_id and p.user_id = auth.uid())));

-- ============================================================
--  STORAGE per le immagini degli esercizi (bucket pubblico)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

drop policy if exists "media pubblica in lettura" on storage.objects;
create policy "media pubblica in lettura" on storage.objects for select
  using (bucket_id = 'exercise-media');

drop policy if exists "solo god carica media" on storage.objects;
create policy "solo god carica media" on storage.objects for insert
  with check (bucket_id = 'exercise-media' and public.is_god());

drop policy if exists "solo god cancella media" on storage.objects;
create policy "solo god cancella media" on storage.objects for delete
  using (bucket_id = 'exercise-media' and public.is_god());

-- ---------- Foto dei progressi: bucket PRIVATO ----------
-- Al contrario di 'exercise-media': qui ci sono foto del corpo di una persona.
-- Niente URL indovinabile, si leggono solo con link firmati a scadenza.
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

-- Eliminando una misurazione le sue foto spariscono a cascata dalla tabella, ma i
-- file resterebbero a occupare il GB gratuito per sempre. Questo trigger li porta via.
create or replace function public.cleanup_photo_file()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Non bloccare la cancellazione della misurazione se lo storage nega il delete.
  begin
    delete from storage.objects
     where bucket_id = 'progress-photos' and name = old.path;
  exception when others then
    raise notice 'cleanup_photo_file: file non eliminato (%). Continuo comunque.', old.path;
  end;
  return old;
end; $$;

drop trigger if exists on_measurement_photo_deleted on public.measurement_photos;
create trigger on_measurement_photo_deleted
  after delete on public.measurement_photos
  for each row execute function public.cleanup_photo_file();

-- ============================================================
--  ULTIMO PASSO — dopo esserti registrato nell'app, esegui:
--  update public.profiles set role = 'god' where email = 'TUA@EMAIL.IT';
--
--  Per dare a un atleta il permesso di modificare la propria scheda/dieta
--  (ma solo la propria: niente lista Atleti, niente libreria esercizi):
--  update public.profiles set role = 'semi_god' where email = 'ATLETA@EMAIL.IT';
-- ============================================================
