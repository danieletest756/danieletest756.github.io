-- ============================================================
--  MIGRAZIONE — direzione dell'obiettivo (per il colore in Misure/Progressi)
--  Da eseguire una volta sola sui progetti Supabase creati prima di questa
--  funzionalità. Se il progetto è nuovo, schema.sql basta da solo.
-- ============================================================

alter table public.profiles
  add column if not exists goal_direction text check (goal_direction in ('dimagrimento','massa'));
