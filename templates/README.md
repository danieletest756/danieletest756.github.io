# Template per nuove schede e piani

Questi file **non vanno eseguiti/incollati così come sono**: sono modelli con segnaposto
`<<...>>` pensati per essere compilati (a mano, o da un'IA a partire dal PDF/testo che ti dà
un atleta). Ci sono due strade per la scheda di allenamento, stessa idea ma destinazione diversa:

- **Scheda di allenamento, formato testo** — il template vive in
  `public/templates/scheda_allenamento_import.txt`, non qui: è lì apposta perché l'app lo
  serve per il download diretto (pulsante "Scarica il template" dentro "Importa scheda
  (testo)" / "Sostituisci con un'importazione (testo)" in Allenamento). Lo scarichi, lo
  compili, incolli il risultato nella stessa finestra — niente SQL Editor, niente email da
  cercare, niente sintassi da rispettare alla lettera (non è JSON: righe semplici come
  `Titolo: ...`, `Giorno: ...`, `- Nome esercizio | 3 serie | 8-10 rip | RIR 2`). **Questa è
  la via consigliata per la scheda.**
- **`scheda_allenamento_template.sql`** e **`scheda_dieta_template.sql`** (qui in questa
  cartella) — il risultato lo incolli nel **SQL Editor di Supabase**. Resta l'unica via per
  il piano alimentare (non ha ancora un importatore dentro l'app) e per chi preferisce
  comunque il SQL per la scheda.

## Come si compilano

**A mano**: apri il template, sostituisci ogni `<<segnaposto>>` con i dati veri e cancella le
righe che non ti servono (es. `Nota:` se quel giorno non ne ha una).

**Con un'IA**, se hai un PDF da un nutrizionista/altro coach e non vuoi ritrascriverlo tu:

1. Apri una chat con un'IA (ChatGPT, Claude, ecc.).
2. Allega il PDF (o incolla il testo) della scheda/dieta dell'atleta.
3. Allega anche il template giusto e scrivi un prompt tipo:

   > Compila questo template con i dati di questa scheda/dieta, sostituendo ogni
   > `<<segnaposto>>`. Segui alla lettera le istruzioni scritte nei commenti (le righe
   > che iniziano con `#`, o `--` nella versione SQL). Alla fine non deve restare
   > nessun `<<...>>` nel risultato.

In entrambi i casi, controlla il risultato prima di usarlo:
- **Versione testo**: che non sia rimasto nessun `<<...>>`. Il blocco di istruzioni in cima
  (righe con `#`) non è obbligatorio da togliere — l'app lo ignora comunque — ma è più
  ordinato farlo.
- **Versione SQL**: soprattutto l'email dell'atleta (deve essere quella giusta, con cui si è
  già registrato nell'app).
- In entrambe: i nomi degli esercizi (i template elencano quelli già in libreria: se ne
  inventi/l'IA ne inventa uno con un nome leggermente diverso da uno che esiste già,
  unificali a mano prima di importare/eseguire, altrimenti ne crei uno doppione in libreria).

**Testo** → incollalo nell'app. **SQL** → incollalo nel SQL Editor di Supabase ed esegui.

## Perché non sono tutti nella stessa cartella

`supabase/` contiene solo script pensati per essere eseguiti direttamente (schema, migrazioni,
seed): i template SQL restano fuori da lì (segnaposto non validi come SQL) per evitare di
eseguirli per sbaglio. Il template della scheda in formato testo invece vive in
`public/templates/`, non qui: è l'unico che l'app deve poter servire per il download, gli
altri due restano puri documenti di riferimento.
