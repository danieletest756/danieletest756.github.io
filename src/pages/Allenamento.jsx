import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  Section, Empty, Modal, Field, Spinner,
  IconPlus, IconPlay, IconTrash, IconEdit, IconChevron, IconCheck, IconTimer, IconDumbbell, IconInfo, IconMood,
} from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'
import IntestazioneFoto, { SfondoFoto } from '../components/IntestazioneFoto'
import fotoScheda from '../assets/bg/scheda.jpg'

const oggi = () => new Date().toISOString().slice(0, 10)

/*
  A che settimana è arrivato l'atleta, contando dalla data di inizio scheda fino
  all'ULTIMA seduta registrata (non da oggi): se l'atleta si ferma due settimane,
  il numero resta fermo lì invece di correre avanti da solo — rispecchia il modo
  in cui il coach la calcola già a mente guardando le date registrate.
*/
function calcolaSettimana(plan, ultimaSedutaData) {
  const partenza = plan.start_date || plan.created_at?.slice(0, 10)
  if (!partenza) return null
  const inizio = new Date(partenza)
  const riferimento = new Date(ultimaSedutaData || oggi())
  const giorni = Math.floor((riferimento - inizio) / 86400000)
  if (giorni < 0) return { settimana: 0, iniziaIl: partenza }
  const settimana = Math.floor(giorni / 7) + 1
  return { settimana, scaduta: settimana > (plan.weeks || 8), riferimento: riferimento.toISOString().slice(0, 10) }
}

/* Countdown di recupero: parte solo quando si tocca il pulsante "Recupero Ns",
   mai da solo dopo aver salvato un carico. Vive qui, non in un context, perché
   serve solo mentre si è su questa pagina. */
function useTimerRecupero() {
  const [stato, setStato] = useState(null)   // { fine, durata, nome }
  const [restante, setRestante] = useState(0)
  const audioRef = useRef(null)

  // L'AudioContext va "sbloccato" da un tocco vero (avvia() parte sempre da un
  // click): se lo creassimo solo allo scadere del timer, il telefono lo
  // rifiuterebbe come audio non richiesto dall'utente e non si sentirebbe nulla.
  const audioCtx = () => {
    if (audioRef.current) return audioRef.current
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      audioRef.current = Ctx ? new Ctx() : null
    } catch { audioRef.current = null }
    return audioRef.current
  }

  // Sveglia vera, non un bip educato: onda quadra (più "cattiva" della sinusoide,
  // taglia meglio nel rumore di sottofondo di una palestra) e 5 colpi rapidi
  // invece di un doppio bip. Il volume resta comunque quello del telefono in
  // quel momento: qui possiamo solo controllare quanto "forte" generiamo il
  // suono relativo a quel volume, non superarlo.
  const suona = () => {
    const ctx = audioCtx()
    if (!ctx) return
    const ora = ctx.currentTime
    const COLPI = 5
    const DURATA = 0.13
    const PAUSA = 0.09
    for (let i = 0; i < COLPI; i++) {
      const inizio = ora + i * (DURATA + PAUSA)
      const osc = ctx.createOscillator()
      const vol = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 1050
      vol.gain.setValueAtTime(0.0001, inizio)
      vol.gain.exponentialRampToValueAtTime(0.6, inizio + 0.015)
      vol.gain.exponentialRampToValueAtTime(0.0001, inizio + DURATA)
      osc.connect(vol); vol.connect(ctx.destination)
      osc.start(inizio)
      osc.stop(inizio + DURATA + 0.02)
    }
  }

  useEffect(() => {
    if (!stato) return
    const tick = () => {
      const r = Math.max(0, Math.round((stato.fine - Date.now()) / 1000))
      setRestante(r)
      if (r === 0) { navigator.vibrate?.([200, 100, 200, 100, 200]); suona(); setStato(null) }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [stato])

  return {
    attivo: !!stato, restante, durata: stato?.durata ?? 0, nome: stato?.nome,
    avvia: (durata, nome) => {
      if (durata <= 0) return
      audioCtx()?.resume?.()
      setStato({ fine: Date.now() + durata * 1000, durata, nome })
    },
    ferma: () => setStato(null),
  }
}

export default function Allenamento() {
  const { targetId, canEdit, viewing } = useAuth()
  const [plan, setPlan] = useState(undefined)   // undefined = carico, null = nessuna scheda
  const [days, setDays] = useState([])
  const [items, setItems] = useState({})        // { day_id: [item, ...] }
  const [ultimi, setUltimi] = useState({})      // { item_id: [righe dell'ultima seduta precedente] }
  const [oggiSerie, setOggiSerie] = useState({})   // { item_id: [righe già registrate oggi] }
  const [ultimaSeduta, setUltimaSeduta] = useState(null)   // data dell'ultima seduta registrata, di tutta la scheda
  const [tab, setTab] = useState(0)
  const [logFor, setLogFor] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [editDay, setEditDay] = useState(null)
  const [editPlan, setEditPlan] = useState(null)
  const [infoAperto, setInfoAperto] = useState(false)
  const [checkinOggi, setCheckinOggi] = useState(null)     // null finché non caricato, {} se non ancora fatto
  const [checkinAperto, setCheckinAperto] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()
  const timer = useTimerRecupero()

  // Il check-in è un autoresoconto: ha senso solo quando chi guarda la pagina è
  // proprio l'atleta (non il coach che sta "guardando" la scheda di qualcun altro).
  const mostraCheckin = !viewing

  const caricaCheckin = useCallback(async () => {
    if (!targetId || !mostraCheckin) return
    const { data } = await supabase.from('checkins').select('*')
      .eq('user_id', targetId).eq('date', oggi()).maybeSingle()
    setCheckinOggi(data ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, mostraCheckin])

  useEffect(() => { caricaCheckin() }, [caricaCheckin])

  const load = useCallback(async () => {
    if (!targetId) return
    const { data: p } = await supabase.from('workout_plans').select('*')
      .eq('user_id', targetId).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setPlan(p ?? null)
    if (!p) { setDays([]); setItems({}); return }

    const { data: d } = await supabase.from('workout_days').select('*')
      .eq('plan_id', p.id).order('position')
    setDays(d ?? [])

    const ids = (d ?? []).map((x) => x.id)
    if (!ids.length) { setItems({}); return }

    const { data: it } = await supabase.from('workout_items')
      .select('*, exercise:exercises(*)').in('day_id', ids).order('position')
    const grouped = {}
    ;(it ?? []).forEach((r) => { (grouped[r.day_id] ||= []).push(r) })
    setItems(grouped)

    const { data: logs } = await supabase.from('workout_logs').select('*')
      .eq('user_id', targetId).in('item_id', (it ?? []).map((x) => x.id))
      .order('date', { ascending: false }).order('set_no')
    // Due elenchi separati per esercizio: le serie già registrate OGGI (per la
    // spunta verde) e le serie dell'ULTIMA SEDUTA PRECEDENTE, che restano visibili
    // anche dopo aver registrato qualcosa oggi — è proprio a metà seduta che serve
    // sapere cosa si è fatto la volta scorsa per le serie non ancora fatte.
    const perItem = {}   // item_id -> Map(data -> [righe]), in ordine dalla più recente
    ;(logs ?? []).forEach((l) => {
      const m = (perItem[l.item_id] ||= new Map())
      if (!m.has(l.date)) m.set(l.date, [])
      m.get(l.date).push(l)
    })
    const oggiMap = {}
    const ultimo = {}
    Object.entries(perItem).forEach(([id, m]) => {
      const date = [...m.keys()]
      if (date[0] === oggi()) {
        oggiMap[id] = m.get(date[0])
        if (date[1]) ultimo[id] = m.get(date[1])
      } else if (date[0]) {
        ultimo[id] = m.get(date[0])
      }
    })
    setOggiSerie(oggiMap)
    setUltimi(ultimo)
    setUltimaSeduta(logs?.[0]?.date ?? null)
  }, [targetId])

  useEffect(() => { setPlan(undefined); setTab(0); load() }, [load])

  if (!targetId || plan === undefined) return <Spinner />

  if (!plan) {
    return (
      <>
        <SfondoFoto src={fotoScheda} />
        <Empty
          title="Nessuna scheda attiva"
          hint={canEdit ? 'Crea la scheda per questo atleta.' : 'Il tuo coach non ha ancora caricato la scheda.'}
          action={canEdit && <button onClick={() => setEditPlan({})} className="btn-primary">Crea scheda</button>}
          icon={IconDumbbell}
        >
          <ModalPiano plan={editPlan} onClose={() => setEditPlan(null)} userId={targetId} onDone={load} />
        </Empty>
      </>
    )
  }

  const giorno = days[tab]
  const lista = giorno ? items[giorno.id] ?? [] : []

  async function eliminaScheda() {
    const ok = await chiedi({
      title: `Elimino la scheda "${plan.title}"?`,
      body: 'Spariscono anche i giorni, gli esercizi e i carichi registrati legati a questa scheda. Non si torna indietro.',
      conferma: 'Elimina scheda',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('workout_plans').delete().eq('id', plan.id)
    if (error) return toast.err(error)
    toast.ok('Scheda eliminata')
    setTab(0)
    load()
  }

  async function spostaGiorno(id, direzione) {
    const idx = days.findIndex((d) => d.id === id)
    const altro = days[idx + direzione]
    if (!altro) return
    const corrente = days[idx]
    await Promise.all([
      supabase.from('workout_days').update({ position: altro.position }).eq('id', corrente.id),
      supabase.from('workout_days').update({ position: corrente.position }).eq('id', altro.id),
    ])
    load()
  }

  const infoSettimana = calcolaSettimana(plan, ultimaSeduta)

  return (
    <>
      <IntestazioneFoto
        src={fotoScheda}
        titolo={plan.title}
        azione={canEdit && (
          <div className="flex gap-2">
            <button onClick={() => setEditPlan(plan)} className="btn-ghost px-3 py-2 text-sm">
              <IconEdit width={16} height={16} /> Modifica
            </button>
            <button onClick={eliminaScheda} className="btn-danger px-3 py-2 text-sm" aria-label="Elimina scheda">
              <IconTrash width={16} height={16} />
            </button>
          </div>
        )}
      />

      <Section>
        {infoSettimana && infoSettimana.settimana > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-card">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-cond text-[15px] font-bold ${
              infoSettimana.scaduta ? 'bg-bad/10 text-bad' : 'bg-brandsoft text-brand'
            }`}>
              {infoSettimana.scaduta ? '!' : infoSettimana.settimana}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {infoSettimana.scaduta
                  ? `Le ${plan.weeks} settimane previste sono finite`
                  : `Settimana ${infoSettimana.settimana} di ${plan.weeks}`}
              </p>
              <p className="text-[12px] text-muted">
                {infoSettimana.scaduta
                  ? 'Valuta se rinnovare la scheda o allungarne la durata.'
                  : ultimaSeduta
                    ? `In base all'ultima seduta registrata (${new Date(infoSettimana.riferimento).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })})`
                    : 'Ancora nessuna seduta registrata: conta da oggi.'}
              </p>
            </div>
          </div>
        )}

        {mostraCheckin && checkinOggi !== null && (
          <button
            onClick={() => setCheckinAperto(true)}
            className={`mb-4 flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left shadow-card ${
              checkinOggi.id ? 'bg-white' : 'bg-brand text-white'
            }`}
          >
            {checkinOggi.id
              ? <IconCheck width={19} height={19} className="shrink-0 text-good" />
              : <IconMood width={19} height={19} className="shrink-0" />}
            <span className="flex-1">
              <span className="block text-sm font-semibold">
                {checkinOggi.id ? 'Check-in di oggi fatto' : 'Come ti senti oggi?'}
              </span>
              <span className={`block text-[12px] ${checkinOggi.id ? 'text-muted' : 'text-white/80'}`}>
                {checkinOggi.id ? 'Tocca per modificarlo' : 'Sonno, stress, energia, dolori — 30 secondi'}
              </span>
            </span>
          </button>
        )}

        {plan.description && (
          <button onClick={() => setInfoAperto(true)}
                  className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-medium text-brand shadow-sm">
            <IconInfo width={15} height={15} /> Come leggere la scheda
          </button>
        )}

        {/* selettore giorni */}
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
          {days.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setTab(i)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-left transition-colors ${
                i === tab ? 'bg-ink text-white' : 'border border-line bg-white text-ink'
              }`}
            >
              <span className="block font-cond text-[19px] font-semibold leading-none">Giorno {d.position}</span>
              <span className={`text-[12px] ${i === tab ? 'text-white/60' : 'text-muted'}`}>{d.title}</span>
            </button>
          ))}
          {canEdit && (
            <button
              onClick={() => setEditDay({ plan_id: plan.id, position: days.length + 1 })}
              className="shrink-0 rounded-xl border border-dashed border-line bg-white px-4 text-muted"
              aria-label="Aggiungi giorno"
            >
              <IconPlus />
            </button>
          )}
        </div>

        {giorno?.notes && (
          <p className="mb-4 whitespace-pre-line rounded-xl bg-brandsoft px-4 py-3 text-sm leading-relaxed text-ink/80">
            {giorno.notes}
          </p>
        )}

        {canEdit && giorno && (
          <button onClick={() => setEditDay(giorno)}
                  className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-medium text-muted shadow-sm">
            <IconEdit width={15} height={15} /> Modifica il giorno «{giorno.title}»
          </button>
        )}

        {lista.length === 0 ? (
          <Empty title="Giorno vuoto" hint={canEdit ? 'Aggiungi gli esercizi qui sotto.' : 'Nessun esercizio previsto.'} />
        ) : (
          <GruppiEsercizi
            lista={lista} ultimi={ultimi} oggiSerie={oggiSerie} canEdit={canEdit}
            onLog={setLogFor} onEdit={setEditItem}
            onTimer={(it) => timer.avvia(it.rest_sec, it.exercise?.name)}
          />
        )}

        {canEdit && giorno && (
          <button onClick={() => setEditItem({ day_id: giorno.id, position: lista.length + 1 })}
                  className="btn-ghost mt-4 w-full border-dashed">
            <IconPlus width={18} height={18} /> Aggiungi esercizio
          </button>
        )}
      </Section>

      <ModalLog item={logFor} userId={targetId} onClose={() => setLogFor(null)} onDone={load} />
      <ModalItem item={editItem} onClose={() => setEditItem(null)} onDone={load} />
      <ModalGiorno
        day={editDay}
        giorni={days}
        onSposta={spostaGiorno}
        onClose={() => setEditDay(null)}
        onDone={(eliminato) => { if (eliminato) setTab(0); load() }}
      />
      <Modal open={infoAperto} onClose={() => setInfoAperto(false)} title="Come leggere la scheda">
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{plan.description}</p>
      </Modal>
      <ModalPiano plan={editPlan} userId={targetId} onClose={() => setEditPlan(null)} onDone={load} />
      <BarraRecupero timer={timer} />
      <ModalCheckin
        open={checkinAperto}
        esistente={checkinOggi}
        userId={targetId}
        onClose={() => setCheckinAperto(false)}
        onSalvato={() => { setCheckinAperto(false); caricaCheckin() }}
      />
    </>
  )
}

/* Countdown fisso sopra la barra di navigazione: resta visibile mentre si scorre la scheda. */
function BarraRecupero({ timer }) {
  if (!timer.attivo) return null
  const mm = Math.floor(timer.restante / 60)
  const ss = String(timer.restante % 60).padStart(2, '0')
  const pct = timer.durata ? Math.max(0, Math.min(100, (timer.restante / timer.durata) * 100)) : 0
  return (
    <div className="fixed inset-x-0 z-40 flex justify-center px-4 bottom-[calc(env(safe-area-inset-bottom)+76px)]">
      <div className="flex w-full max-w-3xl items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-card">
        <span className="stat shrink-0 text-[24px]">{mm}:{ss}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] text-white/65">Recupero{timer.nome ? ` · ${timer.nome}` : ''}</p>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-saffron" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button onClick={timer.ferma} className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[13px] font-medium">
          Salta
        </button>
      </div>
    </div>
  )
}

/* ---------------- giorno di allenamento (solo coach) ---------------- */
function ModalGiorno({ day, giorni = [], onSposta, onClose, onDone }) {
  const [f, setF] = useState({ title: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => {
    if (day) setF({ title: day.title ?? '', notes: day.notes ?? '' })
  }, [day])

  if (!day) return null
  const nuovo = !day.id
  const idx = giorni.findIndex((d) => d.id === day.id)

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const p = { title: f.title.trim(), notes: f.notes.trim() || null }
    const { error } = nuovo
      ? await supabase.from('workout_days').insert({ ...p, plan_id: day.plan_id, position: day.position })
      : await supabase.from('workout_days').update(p).eq('id', day.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? 'Giorno aggiunto' : 'Giorno aggiornato')
    onClose(); onDone(false)
  }

  async function elimina() {
    const ok = await chiedi({
      title: `Elimino «${day.title}»?`,
      body: 'Spariscono anche gli esercizi di questo giorno e i carichi registrati su di essi. Non si torna indietro.',
      conferma: 'Elimina il giorno',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('workout_days').delete().eq('id', day.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Giorno eliminato')
    onClose(); onDone(true)
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Nuovo giorno' : 'Modifica giorno'}>
      <form onSubmit={salva} className="space-y-4">
        <Field
          label="Titolo del giorno" value={f.title} required autoFocus
          onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="Giorno A"
        />
        <label className="block">
          <span className="label">Nota in cima al giorno</span>
          <textarea className="field min-h-[80px]" value={f.notes}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                    placeholder="Note utili per svolgere la seduta." />
        </label>
        {!nuovo && giorni.length > 1 && (
          <div className="flex gap-3">
            <button type="button" onClick={() => onSposta(day.id, -1)} disabled={idx <= 0}
                    className="btn-ghost flex-1 text-sm disabled:opacity-40">
              <IconChevron width={16} height={16} className="-rotate-90" /> Sposta su
            </button>
            <button type="button" onClick={() => onSposta(day.id, 1)} disabled={idx === giorni.length - 1}
                    className="btn-ghost flex-1 text-sm disabled:opacity-40">
              <IconChevron width={16} height={16} className="rotate-90" /> Sposta giù
            </button>
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
          {!nuovo && (
            <button type="button" onClick={elimina} disabled={busy} className="btn-danger" aria-label="Elimina giorno">
              <IconTrash width={18} height={18} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

/* Raggruppa gli esercizi del giorno per gruppo muscolare (nell'ordine in cui
   compaiono la prima volta), rinumerandoli nell'ordine visivo risultante:
   i numeri restano sempre 1,2,3... leggendo la pagina dall'alto in basso. */
function GruppiEsercizi({ lista, ultimi, oggiSerie, canEdit, onLog, onEdit, onTimer }) {
  const gruppi = {}
  lista.forEach((it) => {
    const nome = it.exercise?.muscle_group || 'Altro'
    ;(gruppi[nome] ||= []).push(it)
  })

  let n = 0
  return Object.entries(gruppi).map(([nome, esercizi]) => (
    <div key={nome} className="mb-5 last:mb-0">
      <p className="mb-2 inline-block rounded-lg bg-white/90 px-2.5 py-1 text-[12.5px] font-semibold uppercase tracking-wide text-muted">
        {nome}
      </p>
      <ol className="space-y-3">
        {esercizi.map((it) => {
          n += 1
          return (
            <Esercizio
              key={it.id} item={it} n={n} ultimo={ultimi[it.id]} oggiSerie={oggiSerie[it.id]}
              canEdit={canEdit}
              onLog={() => onLog(it)}
              onEdit={() => onEdit(it)}
              onTimer={() => onTimer(it)}
            />
          )
        })}
      </ol>
    </div>
  ))
}

/* ---------------- riga esercizio ---------------- */
function Esercizio({ item, n, ultimo, oggiSerie, canEdit, onLog, onEdit, onTimer }) {
  const [aperto, setAperto] = useState(false)
  const ex = item.exercise
  const fattoOggi = (oggiSerie?.length ?? 0) > 0
  return (
    <li className="card overflow-hidden">
      <button onClick={() => setAperto(!aperto)} className="flex w-full flex-col gap-2 p-4 text-left">
        <span className="flex items-center gap-3">
          <span className={`stat grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[17px] ${
            fattoOggi ? 'bg-good/10 text-good' : 'bg-canvas text-muted'}`}>
            {fattoOggi ? <IconCheck width={16} height={16} /> : n}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-tight">{ex?.name ?? 'Esercizio'}</span>
            {fattoOggi ? (
              <span className="text-[12.5px] font-medium text-good">fatto oggi · {oggiSerie.length} serie</span>
            ) : ultimo?.length > 0 && (
              <span className="text-[12.5px] text-muted">ultima seduta: {ultimo.length} serie</span>
            )}
          </span>
          <span className={`shrink-0 text-muted transition-transform ${aperto ? 'rotate-90' : ''}`}>
            <IconChevron width={18} height={18} />
          </span>
        </span>
        <span className="flex items-center gap-3 pl-11">
          <span className="stat text-[19px]">{item.sets} serie × {item.reps} rip.</span>
          {item.rir && <span className="text-[12px] text-muted">RIR {item.rir}</span>}
        </span>
      </button>

      {aperto && (
        <div className="border-t border-line px-4 pb-4 pt-3.5">
          {ex?.image_url && (
            <img src={ex.image_url} alt={ex.name} loading="lazy"
                 className="mb-3 w-full rounded-xl border border-line object-cover" />
          )}
          {(item.notes || ex?.cues) && (
            <p className="mb-3 text-sm leading-relaxed text-muted">{item.notes || ex.cues}</p>
          )}
          {ultimo?.length > 0 && (
            <div className="mb-3 rounded-xl bg-canvas px-3 py-2.5">
              <p className="mb-1.5 text-[12px] font-medium text-muted">
                Seduta precedente ({ultimo[0].date.slice(8, 10)}/{ultimo[0].date.slice(5, 7)})
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {ultimo.map((s) => (
                  <span key={s.id} className="stat text-[14px]">
                    {s.weight_kg ?? '–'}×{s.reps ?? '–'}
                    {s.rir != null && <span className="ml-0.5 text-[11px] font-normal text-muted">RIR{s.rir}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {fattoOggi && (
            <div className="mb-3 rounded-xl bg-good/10 px-3 py-2.5">
              <p className="mb-1.5 text-[12px] font-medium text-good">Registrato oggi</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {oggiSerie.map((s) => (
                  <span key={s.id} className="stat text-[14px]">
                    {s.weight_kg ?? '–'}×{s.reps ?? '–'}
                    {s.rir != null && <span className="ml-0.5 text-[11px] font-normal text-muted">RIR{s.rir}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {ex?.video_url && (
              <a href={ex.video_url} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-sm">
                <IconPlay width={16} height={16} /> Guarda l'esecuzione
              </a>
            )}
            <button onClick={onLog} className="btn-primary px-3 py-2 text-sm">Registra i carichi</button>
            {item.rest_sec ? (
              <button onClick={onTimer} className="btn-ghost px-3 py-2 text-sm">
                <IconTimer width={16} height={16} /> Recupero {item.rest_sec}s
              </button>
            ) : null}
            {canEdit && (
              <button onClick={onEdit} className="btn-ghost px-3 py-2 text-sm">
                <IconEdit width={16} height={16} /> Modifica
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

/* ---------------- registrazione carichi ---------------- */
const rigaVuota = () => ({ weight_kg: '', reps: '', rir: '' })

function ModalLog({ item, userId, onClose, onDone }) {
  const [serie, setSerie] = useState([rigaVuota()])
  const [notes, setNotes] = useState('')
  const [storico, setStorico] = useState([])
  const [origine, setOrigine] = useState(null)   // 'oggi' | 'ultima' | null
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => {
    if (!item) return
    setNotes('')
    setStorico([]); setOrigine(null)
    const nSet = Math.min(Math.max(parseInt(item.sets, 10) || 3, 1), 8)
    // Fino a 60 righe di storico: con più serie al giorno sono comunque diverse
    // settimane di sedute precedenti da mostrare.
    supabase.from('workout_logs').select('*').eq('item_id', item.id).eq('user_id', userId)
      .order('date', { ascending: false }).order('set_no').limit(60)
      .then(({ data }) => {
        const s = data ?? []
        setStorico(s)
        // Se l'atleta ha già registrato qualcosa oggi, precompilo con quelle serie
        // (le sta correggendo o continuando) — ma AGGIUNGO righe vuote fino al
        // numero di serie previste, altrimenti sembra che le altre siano sparite
        // quando in realtà non erano ancora state fatte.
        const diOggi = s.filter((l) => l.date === oggi())
        if (diOggi.length) {
          const fatte = diOggi.map((l) => ({ weight_kg: l.weight_kg ?? '', reps: l.reps ?? '', rir: l.rir ?? '' }))
          const daAggiungere = Math.max(0, nSet - fatte.length)
          setSerie([...fatte, ...Array.from({ length: daAggiungere }, rigaVuota)])
          setNotes(diOggi[0].notes ?? '')
          setOrigine('oggi')
          return
        }
        const dataUltima = s[0]?.date
        const ultimaSeduta = dataUltima ? s.filter((l) => l.date === dataUltima) : []
        if (ultimaSeduta.length) {
          setSerie(ultimaSeduta.map((l) => ({ weight_kg: l.weight_kg ?? '', reps: l.reps ?? '', rir: l.rir ?? '' })))
          setOrigine('ultima')
        } else {
          setSerie(Array.from({ length: nSet }, rigaVuota))
          setOrigine(null)
        }
      })
  }, [item, userId])

  if (!item) return null

  function cambiaSerie(i, k, v) {
    setSerie((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)))
  }

  async function salva(e) {
    e.preventDefault()
    const data = oggi()
    const righe = serie
      .map((r, i) => ({
        set_no: i + 1,
        weight_kg: r.weight_kg === '' ? null : Number(r.weight_kg),
        reps: r.reps === '' ? null : Number(r.reps),
        rir: r.rir === '' ? null : Number(r.rir),
      }))
      .filter((r) => r.weight_kg !== null || r.reps !== null)

    setBusy(true)
    // Cancella sempre prima: se `righe` resta vuoto (l'atleta ha svuotato tutti i
    // campi) questo da solo elimina il carico di oggi, invece di non fare nulla.
    const { error: delError } = await supabase.from('workout_logs')
      .delete().eq('user_id', userId).eq('item_id', item.id).eq('date', data)
    if (delError) { setBusy(false); return toast.err(delError) }

    if (righe.length) {
      const { error } = await supabase.from('workout_logs').insert(
        righe.map((r) => ({ user_id: userId, item_id: item.id, date: data, notes: notes.trim() || null, ...r }))
      )
      if (error) { setBusy(false); return toast.err(error) }
    }
    setBusy(false)
    toast.ok(righe.length ? `Carico registrato · ${item.exercise?.name ?? ''}` : 'Carico di oggi eliminato')
    onClose(); onDone()
  }

  async function eliminaOggi() {
    const ok = await chiedi({
      title: 'Elimino il carico di oggi?',
      body: `Cancella tutte le serie registrate oggi per "${item.exercise?.name ?? 'questo esercizio'}". Non si torna indietro.`,
      conferma: 'Elimina',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('workout_logs')
      .delete().eq('user_id', userId).eq('item_id', item.id).eq('date', oggi())
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Carico di oggi eliminato')
    onClose(); onDone()
  }

  const sedute = []
  const indiceData = {}
  storico.forEach((l) => {
    if (!(l.date in indiceData)) { indiceData[l.date] = sedute.length; sedute.push({ date: l.date, righe: [], notes: l.notes }) }
    sedute[indiceData[l.date]].righe.push(l)
  })

  return (
    <Modal open={!!item} onClose={onClose} title={item.exercise?.name ?? 'Esercizio'}>
      <p className="-mt-2 mb-1 text-sm text-muted">
        Obiettivo di oggi: {item.sets} serie da {item.reps} ripetizioni{item.rir ? ` a RIR ${item.rir}` : ''}
      </p>
      {origine === 'ultima' && (
        <p className="mb-4 text-[13px] text-brand">Precompilato con le serie dell'ultima volta: modifica se serve.</p>
      )}
      {origine === 'oggi' && (
        <p className="mb-4 text-[13px] text-muted">Stai modificando la seduta già registrata oggi.</p>
      )}
      {!origine && <div className="mb-4" />}
      <form onSubmit={salva} className="space-y-3">
        {serie.length > 0 && (
          <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_auto] items-center gap-2 text-[12px] text-muted">
            <span /><span>kg</span><span>rip</span><span>RIR</span><span />
          </div>
        )}
        <div className="space-y-2">
          {serie.map((r, i) => (
            <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_1fr_auto] items-center gap-2">
              <span className="text-center text-[12px] font-medium text-muted">{i + 1}</span>
              {['weight_kg', 'reps', 'rir'].map((k) => (
                <input
                  key={k} className="field px-2 py-2 text-center" type="number" step="0.5" inputMode="decimal"
                  value={r[k]}
                  onChange={(e) => cambiaSerie(i, k, e.target.value)}
                />
              ))}
              <button
                type="button"
                onClick={() => setSerie((prev) => prev.filter((_, j) => j !== i))}
                className="p-2 text-muted"
                aria-label="Togli questa serie"
              >
                <IconTrash width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSerie((prev) => [...prev, rigaVuota()])}
          className="btn-ghost w-full border-dashed py-2 text-sm"
        >
          <IconPlus width={16} height={16} /> Aggiungi serie
        </button>
        <label className="block">
          <span className="label">Sensazioni su questo esercizio</span>
          <textarea
            className="field min-h-[74px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Esecuzione, fatica, dolore, stabilita, pompaggio..."
          />
        </label>
        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva il carico di oggi'}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Chiudi</button>
        </div>
        {origine === 'oggi' && (
          <button type="button" onClick={eliminaOggi} disabled={busy} className="btn-danger w-full text-sm">
            <IconTrash width={16} height={16} /> Elimina il carico di oggi
          </button>
        )}
      </form>

      {sedute.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-[13px] font-medium text-muted">Sedute precedenti</p>
          {sedute.map((s) => (
            <div key={s.date} className="flex gap-3 py-1.5 text-sm">
              <span className="w-16 shrink-0 text-muted">{s.date.slice(8, 10)}/{s.date.slice(5, 7)}</span>
              <div className="min-w-0">
                <p className="stat flex flex-wrap gap-x-3 gap-y-0.5 text-[15px]">
                  {s.righe.map((l) => (
                    <span key={l.id}>
                      {l.weight_kg ?? '–'}×{l.reps ?? '–'}{l.rir != null ? ` R${l.rir}` : ''}
                    </span>
                  ))}
                </p>
                {s.notes && <p className="text-[12px] font-normal text-muted">{s.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

/* ---------------- editor esercizio (solo coach) ---------------- */
function ModalItem({ item, onClose, onDone }) {
  const [ex, setEx] = useState([])
  const [f, setF] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => {
    if (!item) return
    setF({
      exercise_id: item.exercise_id ?? '', sets: item.sets ?? '3', reps: item.reps ?? '10',
      rir: item.rir ?? '2', rest_sec: item.rest_sec ?? 90, notes: item.notes ?? '',
    })
    supabase.from('exercises').select('id,name,muscle_group').order('name')
      .then(({ data }) => setEx(data ?? []))
  }, [item])

  if (!item) return null
  const nuovo = !item.id

  async function salva(e) {
    e.preventDefault()
    if (!f.exercise_id) return toast.err('Scegli un esercizio dalla libreria.')
    setBusy(true)
    const payload = {
      exercise_id: f.exercise_id, sets: f.sets, reps: f.reps, rir: f.rir,
      rest_sec: f.rest_sec ? Number(f.rest_sec) : null, notes: f.notes || null,
    }
    const { error } = nuovo
      ? await supabase.from('workout_items').insert({ ...payload, day_id: item.day_id, position: item.position })
      : await supabase.from('workout_items').update(payload).eq('id', item.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? 'Esercizio aggiunto' : 'Esercizio aggiornato')
    onClose(); onDone()
  }

  async function elimina() {
    const ok = await chiedi({
      title: 'Tolgo questo esercizio dalla scheda?',
      body: 'Vengono cancellati anche i carichi che l\'atleta ha registrato su questo esercizio.',
      conferma: 'Togli dalla scheda',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('workout_items').delete().eq('id', item.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Esercizio rimosso')
    onClose(); onDone()
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Aggiungi esercizio' : 'Modifica esercizio'}>
      <form onSubmit={salva} className="space-y-4">
        <label className="block">
          <span className="label">Esercizio</span>
          <select className="field" value={f.exercise_id}
                  onChange={(e) => setF({ ...f, exercise_id: e.target.value })} required>
            <option value="">Scegli dalla libreria…</option>
            {ex.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.muscle_group}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Serie" value={f.sets} onChange={(e) => setF({ ...f, sets: e.target.value })} />
          <Field label="Ripetizioni" value={f.reps} onChange={(e) => setF({ ...f, reps: e.target.value })} />
          <Field label="RIR" value={f.rir} onChange={(e) => setF({ ...f, rir: e.target.value })} />
        </div>
        <Field label="Recupero (secondi)" type="number" value={f.rest_sec}
               onChange={(e) => setF({ ...f, rest_sec: e.target.value })} />
        <label className="block">
          <span className="label">Nota tecnica per questo atleta</span>
          <textarea className="field min-h-[70px]" value={f.notes}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                    placeholder="Se vuota, viene mostrata l'indicazione generale dell'esercizio" />
        </label>
        <div className="flex gap-3 pt-1">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
          {!nuovo && <button type="button" onClick={elimina} className="btn-danger"><IconTrash width={18} height={18} /></button>}
        </div>
      </form>
    </Modal>
  )
}

/* ---------------- nuova scheda ---------------- */
function ModalPiano({ plan, userId, onClose, onDone }) {
  const [f, setF] = useState({ title: '', description: '', weeks: 8, start_date: oggi() })
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (plan) setF({
      title: plan.title ?? '', description: plan.description ?? '', weeks: plan.weeks ?? 8,
      start_date: plan.start_date ?? plan.created_at?.slice(0, 10) ?? oggi(),
    })
  }, [plan])

  if (!plan) return null
  const nuovo = !plan.id

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const p = { title: f.title, description: f.description || null, weeks: Number(f.weeks), start_date: f.start_date || null }
    const { error } = nuovo
      ? await supabase.from('workout_plans').insert({ ...p, user_id: userId, is_active: true })
      : await supabase.from('workout_plans').update(p).eq('id', plan.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? 'Scheda creata' : 'Scheda aggiornata')
    onClose(); onDone()
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Nuova scheda' : 'Modifica scheda'}>
      <form onSubmit={salva} className="space-y-4">
        <Field label="Titolo" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
               placeholder="Scheda personalizzata" required />
        <label className="block">
          <span className="label">Come leggere la scheda</span>
          <textarea className="field min-h-[140px]" value={f.description}
                    onChange={(e) => setF({ ...f, description: e.target.value })}
                    placeholder="Legenda RIR, recuperi, riscaldamento, progressione delle settimane..." />
          <span className="mt-1 block text-xs text-muted">
            L'atleta la legge aprendo "Come leggere la scheda" sotto al titolo.
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data di inizio" type="date" value={f.start_date}
                 onChange={(e) => setF({ ...f, start_date: e.target.value })} />
          <Field label="Durata (settimane)" type="number" value={f.weeks}
                 onChange={(e) => setF({ ...f, weeks: e.target.value })} />
        </div>
        <span className="-mt-2 block text-xs text-muted">
          Da qui in poi l'app calcola da sola a che settimana è arrivato l'atleta.
        </span>
        {nuovo && <p className="text-sm text-muted">Dopo la creazione aggiungi tu i giorni che ti servono.</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Salvo…' : nuovo ? 'Crea scheda' : 'Salva modifiche'}
        </button>
      </form>
    </Modal>
  )
}

const SCALE_CHECKIN = [
  { k: 'sleep_score',    l: 'Sonno',   estremi: '1 = malissimo · 5 = benissimo' },
  { k: 'stress_score',   l: 'Stress',  estremi: '1 = molto stressato · 5 = rilassato' },
  { k: 'energy_score',   l: 'Energia', estremi: '1 = scarico/a · 5 = pieno/a di energie' },
  { k: 'soreness_score', l: 'Dolori',  estremi: '1 = molto indolenzito/a · 5 = nessun dolore' },
]

function ScalaCheckin({ label, estremi, value, onChange }) {
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold ${
              value === n ? 'border-brand bg-brandsoft text-brand' : 'border-line text-muted'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted">{estremi}</p>
    </div>
  )
}

/* Autoresoconto giornaliero: niente punteggio calcolato, solo i quattro numeri
   grezzi. Un upsert su (user_id, date): al secondo tocco dello stesso giorno si
   aggiorna la riga invece di duplicarla. */
function ModalCheckin({ open, esistente, userId, onClose, onSalvato }) {
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open) setForm(esistente ?? {})
  }, [open, esistente])

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const payload = {
      user_id: userId,
      date: oggi(),
      sleep_score: form.sleep_score ?? null,
      stress_score: form.stress_score ?? null,
      energy_score: form.energy_score ?? null,
      soreness_score: form.soreness_score ?? null,
      notes: form.notes || null,
    }
    const { error } = await supabase.from('checkins').upsert(payload, { onConflict: 'user_id,date' })
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Check-in salvato')
    onSalvato()
  }

  return (
    <Modal open={open} onClose={onClose} title="Check-in di oggi">
      <form onSubmit={salva} className="space-y-5">
        {SCALE_CHECKIN.map(({ k, l, estremi }) => (
          <ScalaCheckin key={k} label={l} estremi={estremi} value={form[k]} onChange={(n) => setForm({ ...form, [k]: n })} />
        ))}
        <label className="block">
          <span className="label">Note (facoltative)</span>
          <textarea className="field min-h-[70px]" value={form.notes ?? ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Come ti senti oggi? Qualcosa da segnalare al coach?" />
        </label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Salvo…' : 'Salva check-in'}</button>
      </form>
    </Modal>
  )
}
