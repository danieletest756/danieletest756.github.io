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
  lib/riepilogoMisura.js  immagine PNG riassuntiva di una misurazione (canvas nativo)
  lib/ics.js              file .ics per aggiungere un appuntamento al calendario del telefono
  lib/obiettivoCorpo.js   decide se una variazione di misura è un progresso, in base all'obiettivo
  lib/importaScheda.js    crea una scheda intera (giorni+esercizi) da un oggetto dati, scrive su Supabase
  lib/leggiSchedaTesto.js legge il formato a righe semplici e lo trasforma in quell'oggetto dati
  lib/esportaDatiAtleta.js scheda+carichi+misure+check-in+obiettivi in un .xlsx (exceljs, non dieta)
  components/Layout.jsx   intestazione + barra di navigazione inferiore
  components/ui.jsx       icone SVG inline, Modal, Field, Section, Empty, Spinner
  components/Feedback.jsx notifiche a scomparsa e finestre di conferma
  components/FotoMisura.jsx scelta, galleria e visualizzatore a schermo intero
  components/GuidaMisure.jsx sagome uomo/donna con i punti dove misurare (SVG disegnato a mano)
  components/GraficoAndamento.jsx grafico a linea condiviso (peso, carichi) — porta con sé recharts
  pages/Login.jsx
  pages/Allenamento.jsx   giorni, esercizi, video, carichi, check-in, settimana attuale, import JSON
  pages/Dieta.jsx         macro obiettivo, giorni, pasti, alimenti, diario dei pasti consumati
  pages/Misure.jsx        storico, differenze, grafico peso, foto
  pages/Progressi.jsx     obiettivi, aderenza, stat, grafici (peso, misure, check-in, carichi), record, foto
  pages/Profilo.jsx       dati personali, note private del coach, agenda, esporta dati (zip csv)
  pages/Segnalazioni.jsx  bug/migliorie segnalati da chi usa l'app     (tab "Feedback")
  pages/Atleti.jsx        elenco atleti, ruoli, copia scheda, avvisi, agenda   (solo coach)
  pages/Esercizi.jsx      libreria con immagini e video        (solo coach)
supabase/
  schema.sql              tabelle, trigger, funzioni, policy RLS, bucket storage
  migration_foto_misure.sql       da eseguire sui progetti creati prima delle foto
  migration_workout_log_notes.sql da eseguire sui progetti creati prima delle note sui carichi
  migration_semi_god.sql          da eseguire sui progetti creati prima del ruolo semi-god
  migration_diet_days.sql         da eseguire sui progetti creati prima dei giorni nella dieta
  migration_feedback.sql          da eseguire sui progetti creati prima della sezione Feedback
  migration_goals.sql             da eseguire sui progetti creati prima degli Obiettivi
  migration_checkins.sql          da eseguire sui progetti creati prima del check-in giornaliero
  migration_appuntamenti.sql      da eseguire sui progetti creati prima dell'Agenda
  migration_goal_direction.sql    da eseguire sui progetti creati prima della direzione obiettivo
  migration_diario_alimentare.sql da eseguire sui progetti creati prima del diario alimentare
  seed_esercizi.sql       25 esercizi di partenza
  functions/create-athlete/       Edge Function, va distribuita con la CLI (non con l'SQL Editor)
public/templates/
  scheda_allenamento_import.txt   template scaricabile dall'app ("Importa scheda" in Allenamento)
templates/
  scheda_allenamento_template.sql  da far compilare a un'IA, risultato va nel SQL Editor
  scheda_dieta_template.sql        idem, per il piano alimentare (non ha un import in-app)
  README.md                        come si usano (non sono script/JSON da eseguire/incollare direttamente)
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
un atleta a cui si vuole permettere di autogestirsi, non per un secondo coach. Si assegna anche
da frontend: in Atleti.jsx, ogni riga ha una `<select>` Atleta/Semi-god (niente conferma,
`cambiaRuolo()` scrive direttamente e aggiorna lo stato in locale). Chi ha già `role = 'god'`
mostra invece un badge fisso "Coach", non modificabile da lì: promuovere qualcuno a god resta
volutamente un'azione da SQL diretto, non un click veloce in una select a due opzioni.

**Segnalazioni.jsx (tab "Feedback") non passa da `targetId`/`viewing`.** Riguarda l'esperienza
di chi sta davvero usando l'app in quel momento (bug, migliorie, idee), non la scheda o la dieta
di un atleta: scrive sempre con `user_id = profile.id` (l'utente loggato davvero), mai sul
`target` selezionato dal coach. Le policy RLS (`feedback_select`/`feedback_insert`) fanno il resto:
ognuno vede solo le proprie segnalazioni, il god le vede e ne cambia lo stato tutte. Se aggiungi
un'altra pagina che non riguarda "i dati di un atleta" ma l'app in sé, segui questo esempio, non
il pattern `targetId`.

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

Funzionante e compilabile (`npm run build` passa, ~129 kB gzip iniziali). Girata in locale.
Hosting, dominio e login Google sono volutamente accantonati.

**Chi riprende in mano il progetto: se il database Supabase è stato creato prima delle foto,
esegui `supabase/migration_foto_misure.sql` nel SQL Editor, altrimenti la pagina Misure non
trova la tabella `measurement_photos` e le foto non si caricano. Se era stato creato prima
delle note sui carichi, esegui anche `supabase/migration_workout_log_notes.sql`. Se era stato
creato prima del ruolo semi-god, esegui anche `supabase/migration_semi_god.sql`. Se era stato
creato prima della sezione Feedback, esegui anche `supabase/migration_feedback.sql`. Se era stato
creato prima degli Obiettivi in Progressi, esegui anche `supabase/migration_goals.sql`. Se era
stato creato prima del check-in giornaliero, esegui anche `supabase/migration_checkins.sql`. Se
era stato creato prima dell'Agenda, esegui anche `supabase/migration_appuntamenti.sql`. Se era
stato creato prima della direzione dell'obiettivo, esegui anche
`supabase/migration_goal_direction.sql`. Se era stato creato prima del diario alimentare, esegui
anche `supabase/migration_diario_alimentare.sql`.**

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

**La registrazione dei carichi è per serie, di nuovo.** `ModalLog` in Allenamento.jsx cancella e
reinserisce tutte le righe di `user_id+item_id+date` a ogni salvataggio (non un upsert riga per
riga): un form con una riga per serie (kg/rip/RIR, + "Aggiungi serie", cestino per toglierne una),
`notes` condivisa su tutte le righe di quella seduta. Il campo `set_no` in `workout_logs` esisteva
già dalla prima versione dello schema — il modello "una riga al giorno" (versione precedente) era
solo una scelta applicativa, non un vincolo di tabella. Tre cose a cui fare attenzione se lo tocchi
di nuovo (bug reali, già presi e corretti una volta):

- **Precompilare da "oggi" deve sempre aggiungere righe vuote fino al numero di serie previste**
  (`item.sets`), non mostrare solo le righe già salvate: altrimenti chi ha registrato 1 serie su 3
  e riapre il form vede sparire le altre due caselle, quando in realtà non erano ancora state
  fatte — sembra un bug di cancellazione, non lo è, ma va evitato lo stesso.
- **`ultimi[item_id]` è sempre l'ultima seduta PRECEDENTE, mai quella di oggi.** `load()` separa
  esplicitamente `ultimi` (seduta precedente, per il confronto) da `oggiSerie` (le serie già
  registrate oggi, per la spunta verde). Non fonderli in un solo stato "ultimo log": è proprio a
  metà seduta — dopo aver già segnato la prima serie — che serve ancora vedere cosa si è fatto la
  volta scorsa per le serie non ancora fatte. `Esercizio` mostra entrambi i blocchi insieme quando
  ci sono: "Seduta precedente" (grigio) e "Registrato oggi" (verde), non uno al posto dell'altro.
- **Il salvataggio deve sempre passare dalla `delete` anche se `righe` risulta vuoto** (l'atleta ha
  svuotato tutti i campi): è così che si elimina un carico già registrato. Un `return` anticipato
  prima della delete quando il form è vuoto è il bug che rendeva impossibile cancellare un carico.
  C'è anche un pulsante esplicito "Elimina il carico di oggi" (con conferma) quando `origine ===
  'oggi'`, per non affidarsi solo a "svuota i campi e salva" che non è ovvio.

**Attenzione ovunque si legga `workout_logs` per un grafico o un confronto fra sedute**: più serie
lo stesso giorno significano più righe con la stessa `date`. Prima di confrontare "la seduta di
oggi" con "quella precedente" (Progressi: grafico del carico; Atleti: avviso "carico in calo"),
aggrega prima per data (di solito il **top set**, il peso più alto di quel giorno) e poi confronta
le date fra loro — mai le righe grezze: confrontare due righe qualsiasi rischia di paragonare due
serie della STESSA seduta (dove il calo per fatica è normalissimo) invece di due sedute diverse.

**La card esercizio non ha un pulsante dedicato per "vedi i carichi precedenti"**: il tap che già
espande la card per vedere video/note mostra anche i blocchi "Seduta precedente"/"Registrato
oggi" — niente pulsante/modale in più apposta.

**Export foto** (`lib/esportaFoto.js`, due funzioni): `esportaTutteLeFoto()` — da Atleti, solo
coach — mette in un unico zip le foto di *tutti* gli atleti, una cartella per atleta e una
sottocartella per data di misurazione; interroga il database da sola e funziona perché le policy
RLS su `measurement_photos`/`measurements`/`profiles` concedono a `is_god()` la lettura su tutti
gli atleti. `esportaFotoMisurazione(foto, urls)` — da Misure, chiunque veda quella misurazione
(atleta compreso) — zippa solo le foto di UNA misurazione; non fa query, riusa le foto e i link
firmati già caricati dalla pagina. `jszip` è l'unica dipendenza "pesante" del progetto, ma in
entrambi i casi si carica solo con un `import()` dinamico al click del pulsante: chi non lo usa
non lo scarica mai.

**Riepilogo di una misurazione** (`lib/riepilogoMisura.js`): pulsante a icona in Misure, di fianco
a quello che zippa le foto, ma per i *numeri* della misurazione, non per le foto. Genera
un'immagine PNG (canvas nativo, nessuna libreria PDF) con le misure di quel giorno, la variazione
rispetto alla misurazione precedente e le note, pensata per essere condivisa da telefono
(WhatsApp, Messaggi) o salvata in galleria — non per essere stampata. Attenzione se la tocchi:
`ctx.font` va cambiato SOLO dopo aver misurato la larghezza del testo con il font precedente
(`ctx.measureText` legge il font attivo in quel momento), altrimenti il delta si sovrappone al
valore invece di stargli a fianco — bug già preso e corretto una volta.

**Guida alle misure** (`components/GuidaMisure.jsx`): pulsante "Dove si prendono le misure?" nel
form "Nuova misurazione" di Misure.jsx, apre una Modal con due sagome (uomo/donna) e 6 punti
numerati + legenda. Le sagome sono SVG disegnato a mano (path fissi, non generati), coerenti con
lo stile delle icone di `ui.jsx`: niente foto stock da cercare/licenziare per una cosa che è solo
un diagramma. I numeri 1-6 seguono l'ordine di `CAMPI` in Misure.jsx (Petto, Vita, Fianchi,
Coscia, Metà gluteo, Polpaccio) — se cambi l'ordine o i campi lì, aggiorna anche `PUNTI` qui.

## Lavori aperti, in ordine di utilità

1. **Notifiche push/email** — es. quando un atleta registra una seduta, o quando scatta un
   avviso in Atleti. Fattibile a costo zero (service worker già presente per il push del
   browser; per le email serve un servizio con piano gratuito tipo Resend), ma è un pezzo a sé.
2. **Sincronizzazione vera con Google Calendar**: oggi l'Agenda usa l'export `.ics` (zero
   configurazione, funziona con qualunque calendario). Un collegamento automatico vero
   richiederebbe che il coach configuri un progetto Google Cloud con l'API Calendar e la
   gestione lato server del rinnovo del token — non un ritocco di un pomeriggio.

**Schermata "oggi"** (quale giorno tocca, in base all'ultima seduta registrata) è stata
scartata di proposito: un atleta che salta un giorno riceverebbe un suggerimento sbagliato.
Al suo posto c'è l'**aderenza al piano** (vedi sotto), che non prescrive nulla.

Fatto: **la seduta in palestra** ha un timer di recupero (`useTimerRecupero` in Allenamento.jsx)
che parte **solo** al tocco del pulsante "Recupero Ns" — mai da solo dopo aver salvato un
carico, per scelta esplicita dell'utente: un avvio automatico si sentiva invadente. Allo scadere:
5 colpi d'onda quadra a 1050 Hz (non un bip sinusoidale morbido: un'onda quadra taglia meglio nel
rumore di sottofondo di una palestra) più una vibrazione a impulsi `[200,100,200,100,200]`. Più
la spunta verde sugli esercizi già registrati oggi, e il carico precompilato con l'ultima volta
quando non c'è ancora una riga per oggi.

Fatto: **sezione Progressi** — non solo il grafico del peso: tre statistiche in evidenza (sedute
negli ultimi 30 giorni, peso attuale con variazione dall'inizio, record in evidenza), il grafico
del peso, un grafico per le altre misure del corpo (stessi campi di Misure, select per
sceglierlo), il grafico del carico nel tempo per esercizio (select, raggruppato per nome via
`workout_items.exercise_id`: funziona anche tra schede diverse, non solo dentro quella attiva),
un elenco di record personali (peso massimo mai registrato per ogni esercizio, con la data) e le
foto prima/ora a confronto. Ha la sua foto di sfondo (`src/assets/bg/progressi.jpg`) e usa
`<IntestazioneFoto>` come le altre pagine.

Fatto: **Agenda** (tabella `appointments`) — appuntamenti reali (sedute in presenza, videochiamate),
non le sedute della scheda: quelle restano in `workout_logs`. Il coach la gestisce da una sezione
in Atleti.jsx (crea/elimina, per qualunque atleta). In Profilo.jsx compare per tutti (stessa
sezione "Prossimi appuntamenti" sia per il coach che guarda un atleta sia per l'atleta stesso), ma
crea/elimina solo se `canEdit`: per un atleta semplice resta di sola lettura (coerente con le
policy RLS, che non gli concedono scrittura), per un **semi-god** invece diventa gestibile — è
l'unico posto dove può toccare la propria agenda, dato che la pagina Atleti resta `isGod`-only e
lui non ci arriva mai. Ogni appuntamento ha un pulsante che genera un file **.ics**
(`lib/ics.js`) invece di un vero collegamento a Google Calendar: niente OAuth, niente Google Cloud
Console da configurare, niente token da rinnovare nel tempo — un file di testo che Google
Calendar, Apple Calendar e Outlook aprono tutti allo stesso modo con un tocco. Se un giorno serve
davvero la sincronizzazione automatica (creare l'evento senza che nessuno tocchi nulla), è un
progetto a sé: richiede che il coach configuri un progetto Google Cloud con l'API Calendar
abilitata, e la gestione lato server del rinnovo del token — non è un ritocco di un pomeriggio.

Fatto: **settimana attuale della scheda** (`calcolaSettimana` in Allenamento.jsx) — usa i campi
già esistenti `workout_plans.start_date` (ora impostabile dal form, prima esisteva in tabella ma
non veniva mai scritto) e `weeks`. Il numero di settimana **non conta da oggi**: conta i giorni da
`start_date` fino all'**ultima seduta registrata** (l'ultima data fra tutti i `workout_logs` della
scheda, non un valore scritto a mano) — se l'atleta si ferma due settimane, il numero resta fermo
lì invece di correre avanti da solo, rispecchiando il modo in cui il coach lo calcolava già a
mente guardando le date registrate. Se supera `weeks`, mostra un avviso "settimane finite" invece
di continuare a contare in silenzio (es. "settimana 11 di 8"): serve a ricordare di rinnovare la
scheda. Se `start_date` non è mai stato impostato (schede create prima di questa funzione), usa
`created_at` come scorciatoia — la fascia compare comunque, senza dover ritoccare ogni scheda a mano.

Fatto: **check-in giornaliero** (tabella `checkins`) — in Allenamento.jsx, in cima alla pagina,
un pulsante "Come ti senti oggi?" (blu se non ancora fatto, bianco con spunta se già fatto) apre
una Modal con quattro scale 1-5 (sonno, stress, energia, dolori) + una nota libera, upsert su
`(user_id, date)`: un tocco al giorno, ritoccarlo aggiorna la stessa riga. Scala pensata apposta
con ALTO sempre = meglio su tutti e quattro i campi (anche stress e dolori, dove intuitivamente
uno penserebbe il contrario), per non dover invertire il segno campo per campo quando la si legge
altrove. Compare **solo quando chi guarda la pagina è l'atleta stesso** (`!viewing`): il coach che
sta guardando la scheda di un altro non deve poter rispondere "come ti senti" al posto suo. In
Progressi diventa un grafico (select fra le quattro scale, come "Altre misure nel tempo"). In
Atleti.jsx alimenta gli **avvisi trasparenti** (`calcolaSegnali`): tre regole semplici e spiegabili
in una frase — carico in calo sulle ultime due sedute di un esercizio, check-in fermo da 5+ giorni
(solo se l'atleta lo ha già usato almeno una volta, altrimenti chi non l'ha mai toccato
comparirebbe sempre segnalato), media degli ultimi 3 check-in di energia o sonno ≤ 2. **Scelta
deliberata: niente punteggio unico calcolato** (un "readiness score" o simile): un numero che
sembra scientifico ma è in realtà una formula improvvisata darebbe una falsa sicurezza su
decisioni reali sulla salute di una persona. Se un giorno serve andare in quella direzione, la
formula deve venire da chi ha competenze vere di scienze motorie, non da un indovinello in codice.

Fatto: **Obiettivi** (dentro Progressi, tabella `goals`) — il coach (o il semi-god su se stesso)
imposta un traguardo su una misura del corpo, sul peso o sul carico di un esercizio specifico,
con un valore di partenza e uno obiettivo; Progressi lo mostra come anello di avanzamento (SVG,
`stroke-dasharray` sulla circonferenza, niente libreria). La percentuale è
`(attuale - partenza) / (obiettivo - partenza)`, clampata 0-100%: la stessa formula regge sia un
obiettivo "in salita" (forza, peso da aumentare) sia uno "in discesa" (peso o vita da diminuire),
perché entrambi i lati della sottrazione cambiano segno insieme. `attuale` per una misura del
corpo è l'ultimo valore non nullo di quel campo in `measurements` (non l'ultima riga in assoluto:
una riga può avere altri campi nulli), per un esercizio è il carico massimo mai registrato in
`workout_logs` per quel `exercise_id` — bug **da evitare**: non usare `perEsercizio`/`record`
(raggruppati per *nome*, per la lista Record personali) per calcolare questo, serve un indice
separato per `exercise_id` (`recordPorId`) perché un obiettivo punta a un id, non a una stringa.
A differenza di Segnalazioni.jsx, gli Obiettivi passano da `targetId` come scheda e dieta: sono
dati scritti dal coach per un atleta specifico, non un input libero di chi è loggato.

Fatto: **sezione Feedback** (`pages/Segnalazioni.jsx`, tab in fondo alla barra di navigazione) —
chiunque può segnalare un bug, una miglioria o un'idea con una nota libera; il god le vede tutte
(con il nome di chi le ha scritte) e ne cambia lo stato (nuovo/in lavorazione/risolto), chi non è
god vede solo le proprie. Non c'è una pagina "vuota" con foto di sfondo: è una pagina utility come
Atleti/Esercizi, non una pagina personale/motivazionale.

Fatto: **colore in base all'obiettivo, non al segno** (`lib/obiettivoCorpo.js`, funzione
`sensoBuono(campo, delta, direzione)`, usata da Misure.jsx e Progressi.jsx) — prima ogni calo era
verde a prescindere, anche quello di coscia e gluteo, il contrario di un progresso per chi sta
costruendo massa. Ora `profiles.goal_direction` ('dimagrimento' | 'massa' | non impostata, si
sceglie in Profilo) decide la direzione "buona" per ogni misura, **tranne la vita**, che conta
sempre come "meglio se scende" qualunque sia l'obiettivo — nessuno la vuole più larga. Se non è
impostata nessuna direzione, si comporta come prima (scende = verde), per non rompere nulla a chi
non la tocca.

Fatto: **riordino dei giorni** (scheda e dieta) — prima si riordinavano solo cambiando `position`
a mano nel database. Ora "Modifica il giorno" (`ModalGiorno`, sia in Allenamento.jsx sia in
Dieta.jsx) ha due pulsanti "Sposta su"/"Sposta giù" che scambiano la `position` con il giorno
adiacente e ricaricano. Stessa funzione `spostaGiorno` duplicata identica nelle due pagine (non
condivisa in un modulo comune): sono poche righe e le due tabelle (`workout_days`/`diet_days`)
restano indipendenti, non sembrava valesse un'astrazione in più.

Fatto: **aderenza al piano** (in Progressi, sostituisce la vecchia tile "Sedute (30gg)") — non
dice quale giorno tocca (scartato, vedi sopra), dice quante sedute delle attese sono state fatte
negli ultimi 30 giorni. "Attese" è una stima: giorni della scheda attiva (`workout_days.length`)
per 30/7 settimane, assumendo un giro completo a settimana — non è scritto da nessuna parte nel
piano, è dedotto. Se non c'è una scheda attiva, la tile torna al vecchio conteggio grezzo.

Fatto: **diario alimentare** (tabella `meal_checks`) — un cerchio da toccare su ogni pasto in
Dieta.jsx per segnarlo come consumato **oggi**, qualunque giorno del piano si stia guardando in
quel momento (stesso principio di come `ModalLog` in Allenamento registra sempre sulla data di
oggi indipendentemente dal giorno-scheda aperto: il piano è un modello che si ripete, la spunta è
sulla giornata reale). Autoresoconto come i check-in: RLS aperta a chiunque scriva la propria riga
(non solo `canEdit`), ma il pulsante compare solo quando `!viewing` — il coach che sta guardando
la dieta di un atleta non deve poter segnare "l'ho mangiato" al posto suo.

Fatto: **Edge Function per creare account atleta** (`supabase/functions/create-athlete/`) —
pulsante "Crea account atleta" in Atleti, chiama `supabase.functions.invoke('create-athlete', ...)`.
La funzione verifica lato server che chi chiama sia `god` (mai fidarsi del frontend, anche qui),
poi usa `auth.admin.inviteUserByEmail` con la chiave `service_role` — che continua a non esistere
da nessuna parte nel codice del frontend, vive solo nell'ambiente della funzione, iniettata da
Supabase stessa. **Questa è l'unica parte del progetto che non basta "incollare in SQL Editor"**:
va distribuita con la Supabase CLI (`supabase functions deploy create-athlete`), istruzioni
complete nel `README.md`, punto 7. Finché non è distribuita, il pulsante c'è ma fallisce con un
errore chiaro al primo utilizzo — non un fallimento silenzioso.

Fatto: **importare una scheda da un testo semplice** (`lib/leggiSchedaTesto.js` +
`lib/importaScheda.js`, pulsante "Importa scheda (testo)" / "Sostituisci con un'importazione
(testo)" in Allenamento.jsx) — alternativa al workflow "IA → SQL → SQL Editor di Supabase" usato
finora, e usa un template diverso: il coach lo scarica direttamente dal modale (pulsante "Scarica
il template", un semplice `<a href="/templates/scheda_allenamento_import.txt" download>`), lo
compila — a mano, o dandolo in pasto a un'IA insieme al PDF di un atleta — e incolla il risultato
in una casella di testo **dentro l'app**, non su Supabase. Il template vive apposta in
`public/templates/`, non in `templates/`, perché deve poter essere servito così, come
`manifest.webmanifest` o le icone.
**Prima versione era JSON: scartata perché troppo intimidatorio da incollare** (parentesi e
virgolette, un errore e non funziona più), anche per chi non lo scrive di suo pugno. Il formato
finale è a righe leggibili — `Titolo: ...`, `Giorno: ...`, `- Nome esercizio | 3 serie | 8-10 rip
| RIR 2 | 90 rec` — scrivibile anche a mano, senza IA, in un pizzico. Due decisioni di
progettazione da tenere a mente se lo tocchi:
- **I pezzi dopo il nome si riconoscono dalla parola vicino al numero ("serie", "rip", "rir",
  "rec"), non dalla posizione**: `interpretaSegmento()` in `leggiSchedaTesto.js` li accetta in
  qualunque ordine. Verificato che regga anche con l'ordine invertito (vedi test manuale nella
  cronologia). Un pezzo non riconosciuto diventa una nota libera sull'esercizio invece di far
  fallire l'importazione — è deliberato, un'IA può scrivere qualcosa di imprevisto e non deve
  bloccare tutto il resto.
- **Le righe che iniziano con `#` sono commenti, ignorati**: il template ha un blocco di
  istruzioni fatto così apposta, per essere inoffensivo anche se l'IA si scorda di toglierlo
  dal risultato finale (capita).

`leggiSchedaTesto()` produce la stessa forma dati che `importaScheda(userId, dati)` si aspettava
già dalla versione JSON: la parte che scrive su Supabase (abbinamento libreria per nome, creazione
esercizi nuovi al volo, disattivazione della scheda precedente) è rimasta un'unica versione,
condivisa, cambiato solo cosa la alimenta. **Il piano alimentare non ha ancora un equivalente**:
per la dieta resta solo la via SQL (`scheda_dieta_template.sql`); se un domani serve anche lì, lo
stesso pattern si ripete quasi identico.

Fatto: **esportare tutti i dati di un atleta** (`lib/esportaDatiAtleta.js`, sezione "Esporta dati"
in Profilo.jsx, per tutti — non solo `canEdit`, è solo lettura) — scheda attiva, storico carichi,
misurazioni, check-in e obiettivi (**non la dieta**, per scelta), un vero `.xlsx` con un foglio per
categoria: intestazioni in grassetto, colonne dimensionate, numeri/date come tali, non testo.

**Storia della libreria, non ripetere il giro**: primo tentativo `xlsx` (SheetJS) — due
vulnerabilità **ALTE** su npm senza correzione disponibile (prototype pollution, ReDoS), installata
e disinstallata nella stessa sessione senza mai scriverci codice sopra. Secondo tentativo (in uso
ora): **`exceljs`** — una vulnerabilità **moderata** in una dipendenza interna (`uuid`, un
controllo mancante quando si passa un buffer personalizzato): qui non ci passa mai un buffer
esterno, generiamo solo un file da dati nostri, nessun input da parsare — rischio giudicato
accettabile e confermato con l'utente prima di procedere (non una scelta presa da sola). Se in
futuro cambi ancora libreria, **controlla `npm audit` prima di scrivere qualsiasi cosa che la usi**,
non dopo: è il motivo per cui questa sezione esiste. `exceljs` pesa molto (~270 kB gzip da solo,
il chunk più grosso del progetto) ma è caricato solo con `import()` dinamico al click del
pulsante — stesso pattern di `jszip`, chi non esporta non lo scarica mai, il bundle iniziale non
cresce quasi per niente.

## Cose da non fare

- Non aggiungere TypeScript o cambiare build tool senza chiedere.
- Non spostare la logica dei permessi nel frontend "per semplicità".
- Non introdurre dipendenze pesanti: il bundle iniziale sta a ~135 kB gzip e va tenuto basso,
  gli atleti aprono l'app in palestra con la connessione che capita. `recharts` (Misure/Progressi,
  via `GraficoAndamento.jsx`), `jszip` (export foto) ed `exceljs` (export dati, ~270 kB gzip da
  solo) sono già caricati in lazy loading, solo dove servono: mantieni quel pattern, non importarli
  in cima a un file — solo dentro la funzione che li usa, con `import()` dinamico.
- **Prima di aggiungere una libreria per generare/leggere un formato di file (xlsx, pdf, docx...),
  lancia `npm audit` DOPO averla installata e PRIMA di scriverci codice sopra.** È già capitato in
  questo progetto (vedi "esportare tutti i dati di un atleta" più sotto): la prima scelta ovvia per
  generare `.xlsx`, `xlsx`/SheetJS, aveva due vulnerabilità alte senza correzione disponibile —
  scoperto solo grazie ad `audit`, non perché fosse prevedibile in anticipo.
