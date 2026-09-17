# Template per nuove schede e piani

Questi file **non vanno eseguiti/incollati così come sono**: sono modelli con segnaposto
`<<...>>` pensati per essere compilati da un'IA a partire dal PDF/testo che ti dà un
atleta. Ci sono due strade per la scheda di allenamento, stessa idea ma destinazione diversa:

- **`scheda_allenamento_import.json`** — il risultato lo incolli **dentro l'app**
  (Allenamento → "Importa da JSON" o "Sostituisci con un'importazione (JSON)"): niente
  SQL Editor, niente email da cercare, l'app sa già di quale atleta si tratta dalla
  pagina in cui ti trovi. **Questa è la via consigliata per la scheda.**
- **`scheda_allenamento_template.sql`** e **`scheda_dieta_template.sql`** — il risultato
  lo incolli nel **SQL Editor di Supabase**. Resta l'unica via per il piano alimentare
  (non ha ancora un importatore dentro l'app) e per chi preferisce comunque il SQL.

## Come usarli

1. Apri una chat con un'IA (ChatGPT, Claude, ecc.).
2. Allega il PDF (o incolla il testo) della scheda/dieta dell'atleta.
3. Allega anche il template giusto e scrivi un prompt tipo:

   > Compila questo template con i dati di questa scheda/dieta, sostituendo ogni
   > `<<segnaposto>>`. Segui alla lettera le istruzioni scritte nei commenti/campi
   > `_istruzioni` del file. Alla fine non deve restare nessun `<<...>>` nel risultato.

4. Controlla il risultato prima di usarlo:
   - **Versione JSON**: che sia JSON valido (nessun `<<...>>` rimasto, nessuna virgola
     di troppo) e che i campi `_leggimi`/`_istruzioni` siano stati tolti.
   - **Versione SQL**: soprattutto l'email dell'atleta (deve essere quella giusta, con
     cui si è già registrato nell'app).
   - In entrambe: i nomi degli esercizi (i template elencano quelli già in libreria: se
     l'IA ne inventa uno con un nome leggermente diverso da uno che esiste già, unificali
     a mano prima di importare/eseguire, altrimenti ne crei uno doppione in libreria).
5. **JSON** → incollalo nell'app. **SQL** → incollalo nel SQL Editor di Supabase ed esegui.

## Perché non sono nella cartella `supabase/`

Quella cartella contiene solo script pensati per essere eseguiti direttamente
(schema, migrazioni, seed). Questi template contengono segnaposto non validi come
SQL/JSON: tenerli separati evita di eseguirli/incollarli per sbaglio.
