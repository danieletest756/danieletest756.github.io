-- ============================================================
--  TEMPLATE — SCHEDA DI ALLENAMENTO
--  Non eseguire questo file così com'è: contiene segnaposto <<...>> da
--  sostituire con i dati veri prima di incollarlo in Supabase.
--
--  Come si usa: dai in pasto a un'IA (ChatGPT, Claude, ecc.) questo file
--  insieme al PDF/testo della scheda dell'atleta, con un prompt tipo:
--  "Compila questo template SQL con i dati di questa scheda, sostituendo
--  ogni <<segnaposto>>. Segui alla lettera le istruzioni nei commenti."
--  Il risultato è uno script pronto da incollare nel SQL Editor di Supabase,
--  esattamente come quelli già usati in questo progetto.
-- ============================================================

-- ------------------------------------------------------------
--  COME FUNZIONA QUESTA APP (leggi prima di compilare)
-- ------------------------------------------------------------
--  - Una scheda (workout_plans) contiene dei "giorni" (workout_days: Giorno 1,
--    Giorno 2...) e ogni giorno contiene degli "esercizi" (workout_items), in
--    un ordine preciso (position: 1, 2, 3...).
--  - Ogni esercizio, quando possibile, è collegato a una voce della libreria
--    condivisa (public.exercises): nome, gruppo muscolare, video, indicazioni
--    tecniche generali. Se l'esercizio non esiste già, va CREATO nel primo
--    blocco dello script ("NUOVI ESERCIZI"). Se scrivi il nome sbagliato e
--    non esiste, `exercise_id` diventa null in silenzio: l'esercizio compare
--    comunque in scheda, ma senza immagine/video/indicazioni generali.
--  - "sets" e "reps" sono TESTO libero, non numeri: vanno bene "4", "6-8",
--    "10 per gamba", "30-40 sec", "12-15% inclinazione" per il cardio.
--  - "rest_sec" è in SECONDI. Se il testo dice "2-3 min" usa il punto medio
--    (150). Se non è indicato il recupero, scrivi `null`: non inventarlo.
--  - "rir" è un campo fisso per esercizio, non cambia settimana per settimana
--    (l'app non ha ancora una progressione settimanale automatica). Se il
--    documento dà un RIR fisso per esercizio, mettilo; se invece dà una
--    progressione su più settimane, scrivila per intero nella `description`
--    della scheda (l'atleta la legge da un pulsante, "Come leggere la
--    scheda") e lascia il RIR dei singoli esercizi a `null`.
--  - Esercizio con alternativa ("Squat o Leg press"): collega il PRIMO
--    nominato come esercizio principale e scrivi l'alternativa nel campo
--    `notes` di quella riga, es. 'In alternativa: Leg press.'
--  - "muscle_group" serve a raggruppare gli esercizi nella visualizzazione:
--    usa una di queste categorie, per coerenza con la libreria esistente —
--    non inventarne altre senza un buon motivo:
--      Quadricipiti · Femorali · Glutei · Polpacci · Petto · Dorso · Spalle
--      · Braccia · Core · Cardio
--  - Il coach può assegnare una scheda solo a un atleta GIÀ REGISTRATO
--    nell'app (deve esistere una riga in public.profiles con quella email).
--
-- ------------------------------------------------------------
--  ESERCIZI GIÀ IN LIBRERIA — controlla qui prima di dichiararne uno
--  "nuovo": se il nome esiste già (anche con parole leggermente diverse ma
--  stesso attrezzo/movimento), riusa quello, non crearne uno duplicato.
--  Lista aggiornata al progetto atleti — verificala comunque dalla pagina
--  "Esercizi" dell'app, che è quella davvero aggiornata.
-- ------------------------------------------------------------
--  Quadricipiti: Goblet squat · Leg press · Affondi in camminata ·
--                Leg extension · Squat
--  Glutei:       Bulgarian split squat · Hip thrust con bilanciere ·
--                Glute bridge · Abduzioni ai cavi · Abduzioni alla macchina ·
--                Step up su panca
--  Femorali:     Stacco rumeno · Leg curl sdraiato · Leg curl seduto
--  Polpacci:     Calf raise in piedi
--  Core:         Plank · Dead bug
--  Dorso:        Lat machine presa larga · Rematore con manubrio ·
--                Pulley basso · Rematore bilanciere · Face pull ·
--                Lat machine presa stretta · Rematore alla macchina ·
--                Scrollate
--  Petto:        Chest press · Panca piana con manubri · Panca piana ·
--                Panca inclinata manubri · Croci ai cavi ·
--                Panca inclinata macchina · Croci con manubri
--  Spalle:       Alzate laterali · Military press manubri ·
--                Lento avanti bilanciere
--  Braccia:      Curl bicipiti · Push down tricipiti
--  Cardio:       Camminata inclinata
-- ============================================================


-- ---------- 1. Esercizi nuovi ----------
-- Se non serve aggiungerne nessuno, cancella tutto questo blocco (righe fino
-- al punto e virgola incluso). Aggiungi una riga per ogni esercizio nuovo,
-- con la virgola prima tranne che sull'ultima riga.
insert into public.exercises (name, muscle_group, video_url, cues)
select v.name, v.muscle_group, v.video_url, v.cues
from (values
  ('<<Nome esercizio nuovo>>', '<<Gruppo muscolare>>',
   'https://www.youtube.com/results?search_query=<<parole+chiave+ricerca+tecnica>>',
   '<<Indicazione tecnica breve, una frase>>')
  -- , ('<<altro esercizio nuovo>>', '<<gruppo>>', 'https://www.youtube.com/results?search_query=<<...>>', '<<indicazione>>')
) as v(name, muscle_group, video_url, cues)
where not exists (select 1 from public.exercises e where e.name = v.name);


-- ---------- 2. La scheda ----------
do $$
declare
  v_user_id uuid;
  v_plan_id uuid;
  v_giorno1 uuid;
  v_giorno2 uuid;
  -- aggiungi una variabile v_giornoN per ogni giorno della scheda
begin
  select id into v_user_id from public.profiles where email = '<<email.atleta@esempio.it>>';
  if v_user_id is null then
    raise exception 'Nessun profilo con questa email: l''atleta deve essersi già registrato nell''app.';
  end if;

  -- Disattiva eventuali schede attive precedenti: l'app mostra solo l'ultima attiva
  update public.workout_plans set is_active = false where user_id = v_user_id and is_active = true;

  insert into public.workout_plans (user_id, title, description, weeks, is_active)
  values (
    v_user_id,
    '<<Titolo della scheda>>',
    -- Testo libero (RIR, riscaldamento, progressione settimanale...) se il
    -- documento lo dà, altrimenti scrivi proprio la parola null (senza
    -- apici). Se scrivi un testo, usa || chr(10) || per andare a capo, come
    -- negli esempi già fatti in questo progetto.
    <<'Testo libero…' oppure null>>,
    <<numero di settimane, es. 8>>,
    true
  )
  returning id into v_plan_id;

  -- Un blocco così per OGNI giorno della scheda: cambia "position" (1,2,3...),
  -- il titolo, la nota (o null) e la variabile di destinazione (returning id into ...).
  insert into public.workout_days (plan_id, position, title, notes)
  values (v_plan_id, 1, '<<Titolo giorno 1, es. Petto (forza)>>', <<'nota del giorno' oppure null>>)
  returning id into v_giorno1;

  insert into public.workout_days (plan_id, position, title, notes)
  values (v_plan_id, 2, '<<Titolo giorno 2>>', <<'nota del giorno' oppure null>>)
  returning id into v_giorno2;

  -- ---- esercizi del giorno 1 ----
  -- Una riga per esercizio, "position" progressivo (1, 2, 3...) nell'ordine
  -- in cui vanno eseguiti. rest_sec e notes possono essere null.
  insert into public.workout_items (day_id, exercise_id, position, sets, reps, rest_sec, notes) values
    (v_giorno1, (select id from public.exercises where name = '<<Nome esercizio 1>>'), 1, '<<serie>>', '<<ripetizioni>>', <<secondi oppure null>>, <<'nota' oppure null>>),
    (v_giorno1, (select id from public.exercises where name = '<<Nome esercizio 2>>'), 2, '<<serie>>', '<<ripetizioni>>', <<secondi oppure null>>, <<'nota' oppure null>>);
    -- aggiungi una riga per ogni altro esercizio del giorno, con la virgola prima

  -- ---- esercizi del giorno 2 ----
  insert into public.workout_items (day_id, exercise_id, position, sets, reps, rest_sec, notes) values
    (v_giorno2, (select id from public.exercises where name = '<<Nome esercizio 1>>'), 1, '<<serie>>', '<<ripetizioni>>', <<secondi oppure null>>, <<'nota' oppure null>>);

  -- ripeti un blocco "insert into workout_days" + il blocco esercizi corrispondente
  -- per ogni altro giorno della scheda

end $$;
