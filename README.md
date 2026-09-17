# Gestione atleti — allenamento e dieta

Web app per seguire i tuoi atleti: ognuno accede con il proprio account e trova la sua scheda,
il piano alimentare e le misurazioni. Tu, come coach, vedi e modifichi tutto.

Stack: React + Vite + Tailwind + Supabase. Costo: zero.

---

## 1. Crea il progetto Supabase (10 minuti)

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo progetto.
   Scegli la region **Frankfurt** o **Milan**: più vicina è, più veloce va per i tuoi atleti.
2. Segnati la password del database, poi apri **SQL Editor → New query**.
3. Incolla tutto il contenuto di `supabase/schema.sql` ed esegui (Run).
4. Fai la stessa cosa con `supabase/seed_esercizi.sql`: carica i 25 esercizi della scheda base.

> **Se avevi già creato il database prima delle foto nelle misurazioni**, esegui anche
> `supabase/migration_foto_misure.sql`. Sui progetti nuovi non serve: è già dentro `schema.sql`.
>
> **Se il database esisteva prima dell'aggiunta delle note sui carichi**, esegui anche
> `supabase/migration_workout_log_notes.sql`.
5. Vai in **Project Settings → API** e copia:
   - `Project URL`
   - `anon public key`

> La chiave `anon` può stare tranquillamente nel frontend: è protetta dalle policy RLS che hai appena
> creato. La chiave `service_role` invece non va **mai** messa nel codice dell'app.

## 2. Configura l'app in locale

```bash
npm install
cp .env.example .env
```

Apri `.env` e incolla i due valori copiati prima. Poi:

```bash
npm run dev
```

L'app parte su `http://localhost:5173`.

## 3. Crea il tuo utente coach

1. Registrati dall'app con la tua email.
2. Conferma la mail (o disattiva la conferma: **Authentication → Providers → Email →
   Confirm email**, utile in fase di test).
3. Torna nel SQL Editor di Supabase ed esegui:

```sql
update public.profiles set role = 'god' where email = 'TUA@EMAIL.IT';
```

4. Ricarica l'app: ora hai la scheda **Atleti** nella barra in basso.

## 4. Login con Google (opzionale)

1. [Google Cloud Console](https://console.cloud.google.com) → nuovo progetto →
   **API e servizi → Credenziali → Crea credenziali → ID client OAuth → Applicazione web**.
2. In *URI di reindirizzamento autorizzati* incolla l'indirizzo che trovi in Supabase alla voce
   **Authentication → Providers → Google** (è del tipo `https://xxxx.supabase.co/auth/v1/callback`).
3. Copia Client ID e Client Secret dentro Supabase, attiva il provider e salva.
4. In **Authentication → URL Configuration** metti il tuo dominio finale sia in *Site URL* sia in
   *Redirect URLs* (aggiungi anche `http://localhost:5173` per lo sviluppo).

## 5. Pubblica online, gratis

**Vercel** (consigliato):

1. Carica il progetto su GitHub.
2. [vercel.com](https://vercel.com) → *Add New Project* → importa la repo.
3. In *Environment Variables* aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Ottieni un indirizzo tipo `nometuo.vercel.app`, HTTPS incluso.

Netlify e Cloudflare Pages funzionano allo stesso modo (build: `npm run build`, output: `dist`).
I file `vercel.json` e `public/_redirects` sono già inclusi e servono a far funzionare le rotte
interne dopo un refresh della pagina.

**Sul dominio**: gratuito significa sottodominio (`.vercel.app`, `.netlify.app`). I domini
davvero gratuiti tipo `.eu.org` richiedono approvazione manuale e possono metterci settimane.
Un `.it` costa circa 10 € l'anno e lo colleghi a Vercel in due minuti: se l'app la usano dei
clienti paganti, vale la spesa.

## 6. Aggiungere gli atleti

Due modi:

**A. Si registra da solo** — mandi il link dell'app, l'atleta si registra con email o Google,
compare nella tua lista **Atleti**: lo apri, compili il profilo, crei scheda e dieta. Non richiede
nessuna configurazione in più.

**B. Lo crei tu dal pannello** — pulsante "Crea account atleta" in Atleti: gli mandi subito
l'invito via email per impostare la password, senza che debba registrarsi da solo. Richiede di
aver distribuito la Edge Function `create-athlete` (punto 7 qui sotto): finché non l'hai fatto,
il pulsante c'è ma dà errore al primo utilizzo — usa la via A nel frattempo.

## 7. Creare account atleta dal pannello (opzionale)

Il coach non ha mai la chiave `service_role` nel browser (per sicurezza): per creare un account
al posto dell'atleta serve una funzione che gira *sul server* di Supabase, dove quella chiave è
al sicuro. È già scritta in `supabase/functions/create-athlete/`, ma va distribuita con la
Supabase CLI — non basta incollarla nel SQL Editor come per le altre migrazioni.

1. Installa la CLI: `npm install -g supabase` (o vedi [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)).
2. Accedi e collega il progetto:
   ```bash
   supabase login
   supabase link --project-ref <il-tuo-project-ref>
   ```
   (`<il-tuo-project-ref>` è nell'URL del progetto: `https://supabase.com/dashboard/project/<qui>`).
3. Distribuisci la funzione:
   ```bash
   supabase functions deploy create-athlete
   ```
4. Fatto. Le variabili `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` le mette
   Supabase da sola nell'ambiente della funzione: non c'è nessun segreto da configurare a mano.

Se in futuro modifichi `supabase/functions/create-athlete/index.ts`, ripeti solo il punto 3 per
aggiornarla.

Quando sei dentro un atleta, l'intestazione te lo ricorda e tutte le sezioni mostrano i **suoi**
dati. Il pulsante *Esci* ti riporta alla lista.

---

## Come è fatta

```
src/
  lib/supabase.js      client Supabase
  lib/AuthContext.jsx  sessione, profilo, ruolo, atleta selezionato dal coach
  components/Layout    intestazione + barra di navigazione inferiore
  pages/Login          email/password + Google
  pages/Allenamento    giorni, esercizi, video, registrazione carichi
  pages/Dieta          macro obiettivo, pasti, alimenti
  pages/Misure         storico misure, differenze, grafico peso, foto dei progressi
  pages/Progressi      grafico peso, grafico carichi per esercizio, foto prima/ora
  pages/Profilo        dati personali (+ note private del coach)
  pages/Atleti         elenco atleti, copia scheda      → solo coach
  pages/Esercizi       libreria con immagini e video    → solo coach
```

**Permessi** (gestiti da Postgres, non dal frontend: non si aggirano dal browser):

| | Atleta | Semi-god | Coach (god) |
|---|---|---|---|
| Il proprio profilo e le proprie misure | legge e scrive | legge e scrive | legge e scrive di tutti |
| Scheda e dieta | solo lettura | crea e modifica **solo le proprie** | crea e modifica per chiunque |
| Carichi registrati | scrive i suoi | scrive i suoi | li vede tutti |
| Libreria esercizi | solo lettura | solo lettura | gestisce |
| Lista Atleti | — | — | sì |

Il **semi-god** è un atleta a cui hai dato il permesso di autogestirsi (modifica la propria
scheda/dieta come faresti tu), ma resta un singolo atleta: non vede gli altri, non tocca la
libreria esercizi. Si assegna con `update profiles set role = 'semi_god' where email = '...'`
(vedi `supabase/schema.sql` o `supabase/migration_semi_god.sql` se il progetto è più vecchio).

## Cose da sapere

- Il progetto Supabase gratuito va in pausa dopo circa una settimana senza traffico; si riattiva
  con un click dalla dashboard. Con atleti che la usano ogni giorno non succede.
- Le immagini degli esercizi finiscono nel bucket pubblico `exercise-media` (1 GB gratis).
  Se preferisci non consumarlo, usa il campo *Link al video* con YouTube o Instagram.
- Piano gratuito: 500 MB di database, più che sufficienti per qualche centinaio di atleti.

**Le foto delle misurazioni** stanno in un bucket separato e **privato**, `progress-photos`:
non hanno un indirizzo pubblico e si aprono solo con link che scadono dopo un'ora. Le vedono
l'atleta e tu, nessun altro, nemmeno con il link giusto in mano.

Vengono rimpicciolite dal telefono prima di partire: uno scatto da 4 MB diventa circa 250 kB,
quindi nel gigabyte gratuito ce ne stanno qualche migliaio invece di 250. Il massimo è 8 foto
per misurazione. Quando elimini una misurazione, i suoi file spariscono davvero dallo spazio
di archiviazione: se ne occupa un trigger sul database.

## Prossimi passi possibili

- Notifiche push/email (es. quando un atleta registra una seduta, o quando scatta un avviso).
- Sincronizzazione vera con Google Calendar (oggi c'è l'export `.ics`, zero configurazione:
  vedi la nota su questo in CLAUDE.md se vuoi valutare il passo successivo).
