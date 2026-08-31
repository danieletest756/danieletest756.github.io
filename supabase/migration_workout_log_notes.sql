-- ============================================================
--  NOTE SU WORKOUT LOGS
--  Aggiunge il campo notes ai carichi registrati.
--  Esegui questo file sui database gia esistenti.
-- ============================================================

alter table if exists public.workout_logs
  add column if not exists notes text;
