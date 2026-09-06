-- ============================================================
--  GIORNI NELLA DIETA
--  La Dieta funziona ora come la Scheda: un piano ha dei "giorni" (Lunedì,
--  Martedì... o un solo "Giorno tipo"), ognuno con i propri pasti — prima
--  un piano aveva un unico elenco di pasti sempre uguale.
--  Esegui questo file SOLO se il database è stato creato prima di questa
--  funzione. Sui progetti nuovi è già incluso in schema.sql.
--  Sicuro da rieseguire più volte: non fa nulla se è già stato applicato.
-- ============================================================

create table if not exists public.diet_days (
  id       uuid primary key default gen_random_uuid(),
  plan_id  uuid not null references public.diet_plans(id) on delete cascade,
  position int not null default 1,
  title    text not null,
  notes    text
);

alter table public.diet_meals add column if not exists day_id uuid references public.diet_days(id) on delete cascade;

-- Le vecchie policy leggono ancora "plan_id": vanno tolte PRIMA di cancellare
-- quella colonna, altrimenti Postgres rifiuta il drop perché dipendono da lei.
drop policy if exists dm_select on public.diet_meals;
drop policy if exists dm_write on public.diet_meals;
drop policy if exists df_select on public.diet_foods;
drop policy if exists df_write on public.diet_foods;

-- Se esistono già pasti dalla versione precedente (collegati a un piano
-- direttamente, senza giorno), crea per ognuno un "Giorno unico" e spostaceli
-- dentro, così non si perde nulla di quello che il coach aveva già inserito.
do $$
declare
  r record;
  v_day_id uuid;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'diet_meals' and column_name = 'plan_id'
  ) then
    for r in select distinct plan_id from public.diet_meals where day_id is null loop
      insert into public.diet_days (plan_id, position, title) values (r.plan_id, 1, 'Giorno unico')
      returning id into v_day_id;
      update public.diet_meals set day_id = v_day_id where plan_id = r.plan_id and day_id is null;
    end loop;

    alter table public.diet_meals alter column day_id set not null;
    alter table public.diet_meals drop column plan_id;
  end if;
end $$;

alter table public.diet_days enable row level security;

drop policy if exists dd_select on public.diet_days;
create policy dd_select on public.diet_days for select using (
  public.is_god() or exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists dd_write on public.diet_days;
create policy dd_write on public.diet_days for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_plans p where p.id = plan_id and p.user_id = auth.uid())));

drop policy if exists dm_select on public.diet_meals;
create policy dm_select on public.diet_meals for select using (
  public.is_god() or exists (
    select 1 from public.diet_days d
    join public.diet_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid()));
drop policy if exists dm_write on public.diet_meals;
create policy dm_write on public.diet_meals for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_days d join public.diet_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_days d join public.diet_plans p on p.id = d.plan_id
    where d.id = day_id and p.user_id = auth.uid())));

drop policy if exists df_select on public.diet_foods;
create policy df_select on public.diet_foods for select using (
  public.is_god() or exists (
    select 1 from public.diet_meals m
    join public.diet_days d on d.id = m.day_id
    join public.diet_plans p on p.id = d.plan_id
    where m.id = meal_id and p.user_id = auth.uid()));
drop policy if exists df_write on public.diet_foods;
create policy df_write on public.diet_foods for all
  using (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_meals m
    join public.diet_days d on d.id = m.day_id
    join public.diet_plans p on p.id = d.plan_id
    where m.id = meal_id and p.user_id = auth.uid())))
  with check (public.is_god() or (public.is_semi_god() and exists (
    select 1 from public.diet_meals m
    join public.diet_days d on d.id = m.day_id
    join public.diet_plans p on p.id = d.plan_id
    where m.id = meal_id and p.user_id = auth.uid())));
