-- ============================================================
--  RUOLO SEMI-GOD
--  Come il god, ma può modificare solo i propri dati: niente lista Atleti,
--  niente libreria esercizi, niente scheda/dieta di nessun altro.
--  Esegui questo file SOLO se il database è stato creato prima di questa
--  funzione. Sui progetti nuovi è già incluso in schema.sql.
-- ============================================================

-- ---------- Vincolo sul ruolo ----------
alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('atleta','god','semi_god'));

-- ---------- Funzione helper ----------
create or replace function public.is_semi_god()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'semi_god');
$$;

-- ---------- Policy di scrittura: god OPPURE semi-god sui propri dati ----------
drop policy if exists wp_write on public.workout_plans;
create policy wp_write on public.workout_plans for all
  using (public.is_god() or (public.is_semi_god() and user_id = auth.uid()))
  with check (public.is_god() or (public.is_semi_god() and user_id = auth.uid()));

drop policy if exists wd_write on public.workout_days;
create policy wd_write on public.workout_days for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid())));

drop policy if exists wi_write on public.workout_items;
create policy wi_write on public.workout_items for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid())));

drop policy if exists dp_write on public.diet_plans;
create policy dp_write on public.diet_plans for all
  using (public.is_god() or (public.is_semi_god() and user_id = auth.uid()))
  with check (public.is_god() or (public.is_semi_god() and user_id = auth.uid()));

drop policy if exists dm_write on public.diet_meals;
create policy dm_write on public.diet_meals for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid())));

drop policy if exists df_write on public.diet_foods;
create policy df_write on public.diet_foods for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_meals m join public.diet_plans p on p.id = m.plan_id
    where m.id = meal_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_meals m join public.diet_plans p on p.id = m.plan_id
    where m.id = meal_id and p.user_id = auth.uid())));

-- ============================================================
--  ULTIMO PASSO — per rendere qualcuno semi-god (solo sé stesso, non un
--  coach): esegui, sostituendo l'email:
--  update public.profiles set role = 'semi_god' where email = 'SUA@EMAIL.IT';
-- ============================================================
