# CLAUDE.md

Contesto del progetto per Claude Code. Leggi anche `README.md` per il setup operativo.

## Cos'è

Web app per un personal trainer che segue atleti da remoto. Ogni atleta accede con il proprio
account e trova la sua scheda di allenamento, il piano alimentare e lo storico delle misure.
Il coach ("god") vede e modifica i dati di tutti.

**L'app viene usata al 99% da smartphone, in palestra.** Ogni scelta di interfaccia parte da lì:
target touch grandi, niente tabelle a scorrimento orizzontale, testo leggibile in piedi con il
telefono in una mano. Il desktop è un caso secondario.

## Stack

- React 18 + Vite 5, JavaScript (niente TypeScript)
- Tailwind CSS 3, configurazione in `tailwind.config.js`
- Supabase: auth (email/password + Google), Postgres, Storage
- react-router-dom 6, recharts per il grafico del peso
- Deploy su Vercel piano gratuito, database su Supabase piano gratuito

Vincolo di progetto: **tutto deve restare a costo zero**. Prima di introdurre un servizio esterno,
verifica che abbia un piano gratuito adeguato.

## Struttura

```
src/
  lib/supabase.js         client Supabase
  lib/AuthContext.jsx     sessione, profilo, ruolo, atleta selezionato dal coach
  lib/foto.js             upload, link firmati ed eliminazione delle foto misure
  lib/immagini.js         compressione su canvas prima del caricamento
  components/Layout.jsx   intestazione + barra di navigazione inferiore
  components/ui.jsx       icone SVG inline, Modal, Field, Section, Empty, Spinner
  components/Feedback.jsx notifiche a scomparsa e finestre di conferma
  components/FotoMisura.jsx scelta, galleria e visualizzatore a schermo intero
  components/GraficoAndamento.jsx grafico a linea condiviso (peso, carichi) — porta con sé recharts
  pages/Login.jsx
  pages/Allenamento.jsx   giorni, esercizi, video, registrazione carichi, editor coach
  pages/Dieta.jsx         macro obiettivo, giorni, pasti, alimenti
  pages/Misure.jsx        storico, differenze, grafico peso, foto
  pages/Progressi.jsx     grafico peso, grafico carichi per esercizio, foto prima/ora
  pages/Profilo.jsx       dati personali + note private del coach
  pages/Atleti.jsx        elenco atleti, copia scheda        (solo coach)
  pages/Esercizi.jsx      libreria con immagini e video      (solo coach)
supabase/
  schema.sql              tabelle, trigger, funzioni, policy RLS, bucket storage
  migration_foto_misure.sql       da eseguire sui progetti creati prima delle foto
  migration_workout_log_notes.sql da eseguire sui progetti creati prima delle note sui carichi
  migration_semi_god.sql          da eseguire sui progetti creati prima del ruolo semi-god
  migration_diet_days.sql         da eseguire sui progetti creati prima dei giorni nella dieta
  seed_esercizi.sql       25 esercizi di partenza
templates/
  scheda_allenamento_template.sql  da far compilare a un'IA insieme al PDF di un atleta
  scheda_dieta_template.sql        idem, per il piano alimentare
  README.md                        come si usano (non sono script da eseguire direttamente)
```

## Concetti da conoscere prima di toccare il codice

**`targetId` invece di `user.id`.** In `AuthContext` esiste `viewing`: quando il coach apre un
atleta dalla lista, `viewing` contiene quel profilo e `targetId` diventa il suo id. Tutte le
pagine leggono e scrivono su `targetId`, mai sull'utente loggato. È il motivo per cui le stesse
pagine servono sia all'atleta sia al coach. Se aggiungi una pagina con dati per atleta, usa
`targetId`, altrimenti il coach vedrà i propri dati mentre crede di guardare quelli dell'atleta.

**`canEdit` decide solo l'interfaccia.** La sicurezza vera sta nelle policy RLS di Postgres:
l'atleta ha permesso di sola lettura su `workout_*` e `diet_*`, scrittura solo sui propri
`measurements` e `workout_logs`. Se una query fallisce con "new row violates row-level security",
il problema è quasi sempre che stai scrivendo su una tabella riservata al coach.

**`public.is_god()`** è una funzione SECURITY DEFINER: serve a evitare la ricorsione infinita di
RLS quando una policy su `profiles` deve leggere `profiles`. Non sostituirla con una subquery
diretta.

**Tre ruoli, non due: `atleta`, `god`, `semi_god`.** Il semi-god ha gli stessi permessi di
scrittura del god (`canEdit` è `isGod || isSemiGod` in `AuthContext`), ma le policy RLS
(`public.is_semi_god()`) glieli concedono solo sulle righe dove `user_id = auth.uid()`: può
modificare la propria scheda e dieta, non quella di nessun altro. Non vede la lista Atleti né
la libreria Esercizi (route e tab restano `isGod`-only in App.jsx e Layout.jsx) — è pensato per
un atleta a cui si vuole permettere di autogestirsi, non per un secondo coach. Si assegna con
`update profiles set role = 'semi_god' where email = '...'`.

**La chiave `service_role` non entra mai nel frontend.** È il motivo per cui il coach non può
creare gli account degli atleti: si registrano loro e poi compaiono nella lista. Se serve
cambiare questo comportamento, la strada è una Supabase Edge Function.

**La Dieta ha "giorni" come la Scheda.** `diet_plans → diet_days → diet_meals → diet_foods`,
stessa gerarchia a quattro livelli di `workout_plans → workout_days → workout_items`. Un piano
nuovo creato dall'app parte con un solo giorno ("Giorno tipo"): il coach ne aggiunge altri se il
piano ruota (es. una settimana intera con menù diversi giorno per giorno, come i piani dei
nutrizionisti). I macro obiettivo (kcal/proteine/carbo/grassi) restano sul piano, non sul
giorno: sono lo stesso obiettivo ogni giorno, cambia solo cosa lo raggiunge. La somma "consumato
oggi" mostrata nell'app è calcolata sugli alimenti del giorno selezionato, non su tutti i giorni
del piano.

**Niente `alert`, `confirm` o `prompt`.** Bloccano la pagina e, con l'app installata sulla home
di iOS, il browser li ignora del tutto: il pulsante sembra rotto. Al loro posto `Feedback.jsx`:

```js
const toast = useToast()      // toast.ok() toast.info() toast.err()
const chiedi = useConfirm()   // if (!await chiedi({ title, body, conferma, danger })) return
```

`toast.err()` accetta direttamente l'oggetto errore di Supabase e lo passa da `traduciErrore`,
che trasforma i messaggi del database in frasi comprensibili (l'errore RLS diventa "Non hai i
permessi…"). Per chiedere un dato all'utente si apre una `Modal`, mai un `prompt`.

**I due bucket hanno regole opposte.** `exercise-media` è pubblico: sono foto di esercizi, le
legge chiunque abbia il link. `progress-photos` è privato, perché contiene foto del corpo degli
atleti: si legge solo con i link firmati di `urlFirmati()`, che scadono dopo un'ora. Il percorso
comincia sempre con l'id dell'atleta (`<user_id>/<measurement_id>/<file>`) perché è quello che
confrontano le policy dello storage. Se aggiungi un bucket con dati personali, copia questo
schema, non quello di `exercise-media`.

**Le foto si comprimono sul telefono prima di partire** (`lib/immagini.js`): uno scatto da 4 MB
diventa ~250 kB. Senza, il gigabyte gratuito finirebbe dopo 250 foto. Non togliere quel passaggio
per "mantenere la qualità": è un confronto di forma fisica, non un book fotografico.

**`public/img/login-bg.jpg`** è una foto stock (Unsplash, licenza gratuita, uso commerciale senza
attribuzione — rastrelliera di manubri, fotografo Greg Rosenke) usata come sfondo della schermata
di accesso, compressa a ~125 kB. Le altre pagine usano solo le decorazioni vettoriali di
`components/Decor.jsx` (sfumature CSS, zero peso): niente foto lì, per non appesantire ogni
pagina. Se in futuro serve un'altra foto reale, cercala con licenza libera (Unsplash/Pexels),
scaricala e comprimila a una dimensione simile prima di metterla in `public/img/`.

## Convenzioni

- Interfaccia e commenti in italiano. Nomi di tabelle, colonne e campi in inglese.
- Testi dei pulsanti: verbo all'infinito o imperativo che dice cosa succede ("Salva la seduta",
  non "Invia"). Errori concreti, mai "Qualcosa è andato storto".
- Palette e tipografia sono in `tailwind.config.js`: blu `brand` #1F4FD8, giallo `saffron`,
  fondo `canvas`. Barlow Condensed per numeri e titoli (classe `.stat` per serie, ripetizioni,
  carichi), Inter per il testo. Non introdurre altri font o colori senza motivo.
- Classi riutilizzabili in `src/index.css`: `.card .field .label .btn-primary .btn-ghost .btn-danger .stat`.
- Icone: SVG inline in `ui.jsx`, niente librerie di icone.
- Gli input hanno `font-size: 16px` per impedire lo zoom automatico su iOS. Non abbassarlo.
- Ogni azione che scrive sul database finisce con un `toast.ok()` che dice cosa è successo
  ("Giorno aggiunto", non "Salvato"). Le conferme di eliminazione dicono anche cosa si porta
  via il cascade: cancellare un giorno cancella i carichi registrati su quegli esercizi.
- Le notifiche compaiono in alto: in basso coprirebbero i pulsanti delle finestre a scomparsa.

## Stato attuale

Funzionante e compilabile (`npm run build` passa, ~124 kB gzip iniziali). Girata in locale.
Hosting, dominio e login Google sono volutamente accantonati.

**Chi riprende in mano il progetto: se il database Supabase è stato creato prima delle foto,
esegui `supabase/migration_foto_misure.sql` nel SQL Editor, altrimenti la pagina Misure non
trova la tabella `measurement_photos` e le foto non si caricano. Se era stato creato prima
delle note sui carichi, esegui anche `supabase/migration_workout_log_notes.sql`. Se era stato
creato prima del ruolo semi-god, esegui anche `supabase/migration_semi_god.sql`.**

**L'app è installabile (PWA)**: `public/manifest.webmanifest`, `public/sw.js` (service worker
minimo, scritto a mano, nessuna dipendenza) e le icone in `public/icons/` (generate da
`icona.svg`, manubrio bianco su blu brand — se le rifai, mantieni lo sfondo a tutta tela per le
varianti "maskable", Android le ritaglia). Il service worker fa rete-prima-di-tutto e mette in
cache solo i file dell'app, mai le chiamate a Supabase (dominio diverso): i dati restano sempre
aggiornati, la cache serve solo come riserva offline. Registrato in `main.jsx` **solo quando
`import.meta.env.PROD`**: in sviluppo un service worker mette in cache i moduli di Vite e fa
vedere pagine vecchie invece delle modifiche appena fatte (è già successo: un piano dieta
inserito via SQL non si vedeva perché il browser aveva ancora la build precedente in cache). Se
in `npm run dev` sembra che l'app non rifletta un cambiamento appena fatto, prima di sospettare
altro controlla DevTools → Application → Service Workers e disiscrivi quelli registrati in
sessioni precedenti a questa guardia. Non installa da App Store/Play Store (richiederebbe un
account sviluppatore a pagamento): è "Aggiungi alla schermata Home" da Safari/Chrome, poi si
apre come un'app, senza barra del browser.

**La registrazione dei carichi è per giorno, non per serie.** `ModalLog` in Allenamento.jsx
salva un'unica riga per esercizio al giorno (cancella ed reinserisce su `user_id+item_id+date`),
con un campo `notes` per le sensazioni. Non è più un elenco di serie separate: se serve
tornare a registrare serie singole, cambia sia il form sia la lettura in `load()`.

**Export foto** (`lib/esportaFoto.js`, due funzioni): `esportaTutteLeFoto()` — da Atleti, solo
coach — mette in un unico zip le foto di *tutti* gli atleti, una cartella per atleta e una
sottocartella per data di misurazione; interroga il database da sola e funziona perché le policy
RLS su `measurement_photos`/`measurements`/`profiles` concedono a `is_god()` la lettura su tutti
gli atleti. `esportaFotoMisurazione(foto, urls)` — da Misure, chiunque veda quella misurazione
(atleta compreso) — zippa solo le foto di UNA misurazione; non fa query, riusa le foto e i link
firmati già caricati dalla pagina. `jszip` è l'unica dipendenza "pesante" del progetto, ma in
entrambi i casi si carica solo con un `import()` dinamico al click del pulsante: chi non lo usa
non lo scarica mai.

## Lavori aperti, in ordine di utilità

1. **Progressione settimanale**: la scheda originale prevede 8 settimane con RIR decrescente
   (sett. 1-2 RIR 3, 3-4 RIR 2, 5-6 RIR 1-2, 7 RIR 1, 8 scarico). Oggi non ha un posto nell'app.
   Idea: campo `current_week` su `workout_plans` e una fascia in cima alla scheda che dice a che
   punto è l'atleta e a che intensità deve tirare questa settimana.
2. **Schermata "oggi"**: quale giorno tocca, in base all'ultima seduta registrata.
3. **Diario alimentare**: spunta dei pasti consumati giorno per giorno.
4. **Edge Function** per creare gli account atleta dal pannello coach.

Fatto: **la seduta in palestra** ha ora un timer di recupero (`useTimerRecupero` in
Allenamento.jsx, parte da solo dopo il salvataggio o a tocco su "Avvia recupero", con un doppio
beep generato via Web Audio API allo scadere oltre alla vibrazione), la spunta verde sugli
esercizi già registrati oggi, e il carico precompilato con l'ultima volta quando non c'è ancora
una riga per oggi.

Fatto: **sezione Progressi** — grafico del peso, grafico del carico nel tempo per esercizio
(select per sceglierlo, raggruppato per nome via `workout_items.exercise_id`: funziona anche
tra schede diverse, non solo dentro quella attiva) e foto prima/ora a confronto. Usa ancora la
sfumatura vettoriale (`accent`) come Atleti/Esercizi: manca la foto di sfondo in
`src/assets/bg/progressi.jpg` — quando arriva, sostituire il `<Section accent>` con
`<IntestazioneFoto>` come nelle altre pagine.

Difetti noti, piccoli ma reali:

- In Misure ogni calo è colorato di verde, anche quello di coscia e gluteo: per chi sta
  costruendo massa è il contrario di un progresso. Il colore andrebbe deciso in base
  all'obiettivo dell'atleta, non al segno della differenza.
- I giorni della scheda si riordinano solo cambiando `position` a mano nel database.

## Cose da non fare

- Non aggiungere TypeScript o cambiare build tool senza chiedere.
- Non spostare la logica dei permessi nel frontend "per semplicità".
- Non introdurre dipendenze pesanti: il bundle iniziale sta a ~124 kB gzip e va tenuto basso,
  gli atleti aprono l'app in palestra con la connessione che capita. `recharts` è già caricato
  in lazy loading solo sulla pagina Misure: mantieni quel pattern.
