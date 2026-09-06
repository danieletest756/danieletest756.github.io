-- ============================================================
--  TEMPLATE — PIANO ALIMENTARE
--  Non eseguire questo file così com'è: contiene segnaposto <<...>> da
--  sostituire con i dati veri prima di incollarlo in Supabase.
--
--  Come si usa: dai in pasto a un'IA (ChatGPT, Claude, ecc.) questo file
--  insieme al PDF/testo del piano alimentare dell'atleta, con un prompt tipo:
--  "Compila questo template SQL con i dati di questo piano, sostituendo
--  ogni <<segnaposto>>. Segui alla lettera le istruzioni nei commenti."
--  Il risultato è uno script pronto da incollare nel SQL Editor di Supabase.
-- ============================================================

-- ------------------------------------------------------------
--  COME FUNZIONA QUESTA APP (leggi prima di compilare)
-- ------------------------------------------------------------
--  - Un piano (diet_plans) ha un obiettivo di kcal/proteine/carboidrati/
--    grassi al giorno e un consiglio di litri d'acqua. È lo STESSO obiettivo
--    ogni giorno: quello che cambia è cosa lo raggiunge.
--  - Il piano contiene dei "giorni" (diet_days), esattamente come la Scheda
--    di allenamento: se il piano è FISSO (si ripete identico ogni giorno),
--    basta UN giorno solo (chiamalo "Giorno tipo"). Se il piano RUOTA con
--    menù diversi (es. una settimana intera come nei piani da nutrizionista,
--    Lunedì ≠ Martedì ≠ ...), crea un giorno per ognuno.
--  - Ogni giorno contiene dei "pasti" (diet_meals: Colazione, Spuntino,
--    Pranzo, Merenda, Cena...) e ogni pasto contiene degli "alimenti"
--    (diet_foods) con quantità e valori nutrizionali.
--  - IMPORTANTE: nell'app, i valori che l'atleta vede accanto all'obiettivo
--    (quante proteine/carbo/grassi ha "a disposizione oggi") sono la SOMMA
--    dei valori nutrizionali degli alimenti del GIORNO che sta guardando,
--    non l'obiettivo del piano. Se non compili kcal/proteine/carbo/grassi
--    per ogni singolo alimento, quella somma resta a zero anche con un
--    piano completo: compila i valori nutrizionali di ogni alimento, non
--    solo l'obiettivo generale del piano.
--  - "qty" è testo libero: "150 g", "1 vasetto", "2 fette", "30 g a secco".
--  - "alt" è l'alternativa consentita per quell'alimento (es. "3 uova intere"
--    al posto di "1 vasetto di yogurt greco 0%"). Lascia null se il
--    documento non ne indica una. Se un alimento ha PIÙ di un'alternativa,
--    mettile tutte in questo unico campo separate da " / " (es.
--    "Feta 30 g / Vongola 110 g / Tonno sott'olio 50 g").
--  - "time_label" del pasto è QUANDO si consuma: un orario ("07:30") o un
--    momento ("pre-workout", "dopo la palestra", "prima di dormire"). Può
--    essere null se non specificato.
--  - Le "Linee guida" del piano (`notes`) sono il testo libero che l'atleta
--    vede sotto l'obiettivo macro (regole generali valide OGNI giorno:
--    quanto olio a pasto, quanta acqua, cosa si può invertire, conversioni
--    peso crudo/cotto, ecc.): usa il testo del documento se c'è, altrimenti
--    null. Le note SPECIFICHE di un solo giorno vanno invece nella `notes`
--    di quel `diet_days` (es. "Consuma parmigiano solo se a cena non mangi
--    salmone", scritta nella nota del Venerdì, non nelle linee guida generali).
--  - Il coach può assegnare un piano solo a un atleta GIÀ REGISTRATO
--    nell'app (deve esistere una riga in public.profiles con quella email).
-- ============================================================

do $$
declare
  v_user_id uuid;
  v_plan_id uuid;
  v_giorno1 uuid;
  v_giorno2 uuid;
  -- aggiungi una variabile v_giornoN per ogni giorno del piano (uno solo se
  -- il piano non ruota: cancella allora v_giorno2 e tutto ciò che lo usa)
  v_pasto1 uuid;
  v_pasto2 uuid;
  -- aggiungi una variabile v_pastoN per ogni pasto di OGNI giorno
begin
  select id into v_user_id from public.profiles where email = '<<email.atleta@esempio.it>>';
  if v_user_id is null then
    raise exception 'Nessun profilo con questa email: l''atleta deve essersi già registrato nell''app.';
  end if;

  -- Disattiva eventuali piani attivi precedenti: l'app mostra solo l'ultimo attivo
  update public.diet_plans set is_active = false where user_id = v_user_id and is_active = true;

  insert into public.diet_plans (user_id, title, kcal, protein_g, carbs_g, fat_g, water_l, notes, is_active)
  values (
    v_user_id,
    '<<Titolo del piano, es. Piano ipocalorico>>',
    <<kcal totali al giorno, numero intero, oppure null>>,
    <<grammi di proteine al giorno, numero, oppure null>>,
    <<grammi di carboidrati al giorno, numero, oppure null>>,
    <<grammi di grassi al giorno, numero, oppure null>>,
    <<litri d'acqua consigliati, es. 2, oppure null>>,
    -- Testo libero delle linee guida GENERALI (valide ogni giorno). Se scrivi
    -- un testo, usa || chr(10) || per andare a capo, come negli esempi già
    -- fatti in questo progetto.
    <<'Linee guida generali…' oppure null>>,
    true
  )
  returning id into v_plan_id;

  -- Un blocco così per OGNI giorno del piano: cambia "position" (1,2,3...),
  -- il titolo ("Lunedì", "Martedì"... oppure "Giorno tipo" se il piano non
  -- ruota), la nota SPECIFICA di quel giorno (o null) e la variabile di
  -- destinazione (returning id into ...).
  insert into public.diet_days (plan_id, position, title, notes)
  values (v_plan_id, 1, '<<Lunedì, oppure Giorno tipo>>', <<'nota specifica di questo giorno' oppure null>>)
  returning id into v_giorno1;

  insert into public.diet_days (plan_id, position, title, notes)
  values (v_plan_id, 2, '<<Martedì>>', <<'nota specifica di questo giorno' oppure null>>)
  returning id into v_giorno2;

  -- ---- pasti del giorno 1 ----
  -- Un blocco così per OGNI pasto DI QUESTO GIORNO: cambia "position",
  -- il nome, l'orario/momento (o null) e la variabile di destinazione.
  insert into public.diet_meals (day_id, position, name, time_label, notes)
  values (v_giorno1, 1, '<<Nome pasto, es. Colazione>>', <<'07:30' oppure null>>, <<'nota del pasto' oppure null>>)
  returning id into v_pasto1;

  insert into public.diet_meals (day_id, position, name, time_label, notes)
  values (v_giorno1, 2, '<<Nome pasto 2, es. Pranzo>>', <<'13:00' oppure null>>, <<'nota del pasto' oppure null>>)
  returning id into v_pasto2;

  -- alimenti del pasto 1 (giorno 1) — una riga per alimento, "position" progressivo
  insert into public.diet_foods (meal_id, position, name, qty, kcal, protein_g, carbs_g, fat_g, alt) values
    (v_pasto1, 1, '<<Nome alimento>>', '<<quantità, es. 150 g>>', <<kcal oppure null>>, <<proteine g oppure null>>, <<carbo g oppure null>>, <<grassi g oppure null>>, <<'alternativa/e' oppure null>>),
    (v_pasto1, 2, '<<Nome alimento 2>>', '<<quantità>>', <<kcal>>, <<proteine>>, <<carbo>>, <<grassi>>, <<'alternativa/e' oppure null>>);
    -- aggiungi una riga per ogni altro alimento del pasto, con la virgola prima

  -- alimenti del pasto 2 (giorno 1)
  insert into public.diet_foods (meal_id, position, name, qty, kcal, protein_g, carbs_g, fat_g, alt) values
    (v_pasto2, 1, '<<Nome alimento>>', '<<quantità>>', <<kcal>>, <<proteine>>, <<carbo>>, <<grassi>>, <<'alternativa/e' oppure null>>);

  -- ripeti "insert into diet_meals" + il blocco alimenti corrispondente per
  -- ogni altro pasto DI QUESTO GIORNO

  -- ---- pasti del giorno 2 ----
  -- ripeti la stessa struttura di sopra usando v_giorno2 al posto di v_giorno1

  -- ripeti un blocco "insert into diet_days" + tutti i pasti/alimenti
  -- corrispondenti per ogni altro giorno del piano

end $$;
