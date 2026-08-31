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
  pages/Login.jsx
  pages/Allenamento.jsx   giorni, esercizi, video, registrazione carichi, editor coach
  pages/Dieta.jsx         macro obiettivo, pasti, alimenti
  pages/Misure.jsx        storico, differenze, grafico peso, foto
  pages/Profilo.jsx       dati personali + note private del coach
  pages/Atleti.jsx        elenco atleti, copia scheda        (solo coach)
  pages/Esercizi.jsx      libreria con immagini e video      (solo coach)
supabase/
  schema.sql              tabelle, trigger, funzioni, policy RLS, bucket storage
  migration_foto_misure.sql  da eseguire sui progetti creati prima delle foto
  seed_esercizi.sql       25 esercizi di partenza
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

**La chiave `service_role` non entra mai nel frontend.** È il motivo per cui il coach non può
creare gli account degli atleti: si registrano loro e poi compaiono nella lista. Se serve
cambiare questo comportamento, la strada è una Supabase Edge Function.

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
trova la tabella `measurement_photos` e le foto non si caricano.**

## Lavori aperti, in ordine di utilità

1. **Progressione settimanale**: la scheda originale prevede 8 settimane con RIR decrescente
   (sett. 1-2 RIR 3, 3-4 RIR 2, 5-6 RIR 1-2, 7 RIR 1, 8 scarico). Oggi non ha un posto nell'app.
   Idea: campo `current_week` su `workout_plans` e una fascia in cima alla scheda che dice a che
   punto è l'atleta e a che intensità deve tirare questa settimana.
2. **La seduta in palestra**: timer di recupero (`rest_sec` oggi è solo testo), spunta sugli
   esercizi già registrati oggi, carichi precompilati con quelli dell'ultima volta.
3. **Schermata "oggi"**: quale giorno tocca, in base all'ultima seduta registrata.
4. **Grafico dei carichi per esercizio**, per mostrare la progressione all'atleta.
5. **PWA**: manifest e icone, così l'app si installa sulla home del telefono.
6. **Diario alimentare**: spunta dei pasti consumati giorno per giorno.
7. **Edge Function** per creare gli account atleta dal pannello coach.

Difetti noti, piccoli ma reali:

- In Misure ogni calo è colorato di verde, anche quello di coscia e gluteo: per chi sta
  costruendo massa è il contrario di un progresso. Il colore andrebbe deciso in base
  all'obiettivo dell'atleta, non al segno della differenza.
- "ultima volta X kg" sotto ogni esercizio mostra la **prima** serie dell'ultima seduta, non la
  migliore né l'ultima: le righe sono ordinate per `set_no` crescente e viene tenuta la prima.
- I giorni della scheda si riordinano solo cambiando `position` a mano nel database.

## Cose da non fare

- Non aggiungere TypeScript o cambiare build tool senza chiedere.
- Non spostare la logica dei permessi nel frontend "per semplicità".
- Non introdurre dipendenze pesanti: il bundle iniziale sta a ~122 kB gzip e va tenuto basso,
  gli atleti aprono l'app in palestra con la connessione che capita. `recharts` è già caricato
  in lazy loading solo sulla pagina Misure: mantieni quel pattern.
