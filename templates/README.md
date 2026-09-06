# Template per nuove schede e piani

Questi due file **non vanno eseguiti così come sono**: sono modelli con segnaposto
`<<...>>` pensati per essere compilati da un'IA a partire dal PDF/testo che ti dà un
atleta, e produrre in uscita uno script SQL pronto da incollare nel SQL Editor di
Supabase — lo stesso formato usato finora in questo progetto.

## Come usarli

1. Apri una chat con un'IA (ChatGPT, Claude, ecc.).
2. Allega il PDF (o incolla il testo) della scheda/dieta dell'atleta.
3. Allega anche il template giusto (`scheda_allenamento_template.sql` o
   `scheda_dieta_template.sql`) e scrivi un prompt tipo:

   > Compila questo template SQL con i dati di questa scheda/dieta, sostituendo ogni
   > `<<segnaposto>>`. Segui alla lettera le istruzioni scritte nei commenti del file.
   > Alla fine non deve restare nessun `<<...>>` nello script.

4. Controlla il risultato: soprattutto l'email dell'atleta (deve essere quella giusta,
   con cui si è già registrato nell'app) e i nomi degli esercizi (i template elencano
   quelli già in libreria: se l'IA ne inventa uno con un nome leggermente diverso da
   uno che esiste già, unificali a mano prima di eseguire).
5. Incolla lo script nel SQL Editor di Supabase ed esegui.

## Perché non sono nella cartella `supabase/`

Quella cartella contiene solo script pensati per essere eseguiti direttamente
(schema, migrazioni, seed). Questi template contengono segnaposto non validi come SQL:
tenerli separati evita di eseguirli per sbaglio.
