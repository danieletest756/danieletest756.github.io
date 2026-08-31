import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  Section, Empty, Modal, Field, Spinner,
  IconPlus, IconPlay, IconTrash, IconEdit, IconChevron, IconCheck, IconTimer, IconDumbbell,
} from '../components/ui'
import { AccentoIntestazione } from '../components/Decor'
import { useToast, useConfirm } from '../components/Feedback'

const oggi = () => new Date().toISOString().slice(0, 10)

/* Countdown di recupero: parte quando si registra un carico o si tocca "Avvia recupero".
   Vive qui, non in un context, perché serve solo mentre si è su questa pagina. */
function useTimerRecupero() {
  const [stato, setStato] = useState(null)   // { fine, durata, nome }
  const [restante, setRestante] = useState(0)

  useEffect(() => {
    if (!stato) return
    const tick = () => {
      const r = Math.max(0, Math.round((stato.fine - Date.now()) / 1000))
      setRestante(r)
      if (r === 0) { navigator.vibrate?.(200); setStato(null) }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [stato])

  return {
    attivo: !!stato, restante, durata: stato?.durata ?? 0, nome: stato?.nome,
    avvia: (durata, nome) => durata > 0 && setStato({ fine: Date.now() + durata * 1000, durata, nome }),
    ferma: () => setStato(null),
  }
}

export default function Allenamento() {
  const { targetId, canEdit } = useAuth()
  const [plan, setPlan] = useState(undefined)   // undefined = carico, null = nessuna scheda
  const [days, setDays] = useState([])
  const [items, setItems] = useState({})        // { day_id: [item, ...] }
  const [ultimi, setUltimi] = useState({})      // { item_id: log }
  const [tab, setTab] = useState(0)
  const [logFor, setLogFor] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [editDay, setEditDay] = useState(null)
  const [newPlan, setNewPlan] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()
  const timer = useTimerRecupero()

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
    const last = {}
    ;(logs ?? []).forEach((l) => { if (!last[l.item_id]) last[l.item_id] = l })
    setUltimi(last)
  }, [targetId])

  useEffect(() => { setPlan(undefined); setTab(0); load() }, [load])

  if (!targetId || plan === undefined) return <Spinner />

  if (!plan) {
    return (
      <Empty
        title="Nessuna scheda attiva"
        hint={canEdit ? 'Crea la scheda per questo atleta.' : 'Il tuo coach non ha ancora caricato la scheda.'}
        action={canEdit && <button onClick={() => setNewPlan(true)} className="btn-primary">Crea scheda</button>}
        icon={IconDumbbell}
      >
        <ModalPiano open={newPlan} onClose={() => setNewPlan(false)} userId={targetId} onDone={load} />
      </Empty>
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

  return (
    <>
      <Section>
        <div className="relative mb-4 flex items-start justify-between gap-3">
          <AccentoIntestazione principale="brand" />
          <div>
            <h1 className="font-cond text-[30px] font-bold leading-none">{plan.title}</h1>
            {plan.description && <p className="mt-2 text-sm leading-relaxed text-muted">{plan.description}</p>}
          </div>
          {canEdit && (
            <button onClick={eliminaScheda} className="btn-danger px-3 py-2 text-sm">
              <IconTrash width={16} height={16} /> Elimina scheda
            </button>
          )}
        </div>

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
              className="shrink-0 rounded-xl border border-dashed border-line px-4 text-muted"
              aria-label="Aggiungi giorno"
            >
              <IconPlus />
            </button>
          )}
        </div>

        {giorno?.notes && (
          <p className="mb-4 rounded-xl bg-brandsoft px-4 py-3 text-sm leading-relaxed text-ink/80">
            {giorno.notes}
          </p>
        )}

        {canEdit && giorno && (
          <button onClick={() => setEditDay(giorno)}
                  className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <IconEdit width={15} height={15} /> Modifica il giorno «{giorno.title}»
          </button>
        )}

        {lista.length === 0 ? (
          <Empty title="Giorno vuoto" hint={canEdit ? 'Aggiungi gli esercizi qui sotto.' : 'Nessun esercizio previsto.'} />
        ) : (
          <ol className="space-y-3">
            {lista.map((it, i) => (
              <Esercizio
                key={it.id} item={it} n={i + 1} ultimo={ultimi[it.id]} oggi={oggi()}
                canEdit={canEdit}
                onLog={() => setLogFor(it)}
                onEdit={() => setEditItem(it)}
                onTimer={() => timer.avvia(it.rest_sec, it.exercise?.name)}
              />
            ))}
          </ol>
        )}

        {canEdit && giorno && (
          <button onClick={() => setEditItem({ day_id: giorno.id, position: lista.length + 1 })}
                  className="btn-ghost mt-4 w-full border-dashed">
            <IconPlus width={18} height={18} /> Aggiungi esercizio
          </button>
        )}
      </Section>

      <ModalLog
        item={logFor} userId={targetId} onClose={() => setLogFor(null)} onDone={load}
        onSalvato={(it) => timer.avvia(it.rest_sec, it.exercise?.name)}
      />
      <ModalItem item={editItem} onClose={() => setEditItem(null)} onDone={load} />
      <ModalGiorno
        day={editDay}
        onClose={() => setEditDay(null)}
        onDone={(eliminato) => { if (eliminato) setTab(0); load() }}
      />
      <BarraRecupero timer={timer} />
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
function ModalGiorno({ day, onClose, onDone }) {
  const [f, setF] = useState({ title: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => {
    if (day) setF({ title: day.title ?? '', notes: day.notes ?? '' })
  }, [day])

  if (!day) return null
  const nuovo = !day.id

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

/* ---------------- riga esercizio ---------------- */
function Esercizio({ item, n, ultimo, oggi, canEdit, onLog, onEdit, onTimer }) {
  const [aperto, setAperto] = useState(false)
  const ex = item.exercise
  const fattoOggi = ultimo?.date === oggi
  return (
    <li className="card overflow-hidden">
      <button onClick={() => setAperto(!aperto)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className={`stat grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[17px] ${
          fattoOggi ? 'bg-good/10 text-good' : 'bg-canvas text-muted'}`}>
          {fattoOggi ? <IconCheck width={16} height={16} /> : n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold leading-tight">{ex?.name ?? 'Esercizio'}</span>
          {ultimo && (
            <span className={`text-[12.5px] ${fattoOggi ? 'font-medium text-good' : 'text-muted'}`}>
              {fattoOggi ? 'fatto oggi' : 'ultima volta'} {ultimo.weight_kg ?? '—'} kg × {ultimo.reps ?? '—'}
            </span>
          )}
        </span>
        <span className="text-right">
          <span className="stat block text-[22px]">{item.sets} × {item.reps}</span>
          {item.rir && <span className="text-[12px] text-muted">RIR {item.rir}</span>}
        </span>
        <span className={`text-muted transition-transform ${aperto ? 'rotate-90' : ''}`}>
          <IconChevron width={18} height={18} />
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
          <div className="flex flex-wrap gap-2">
            {ex?.video_url && (
              <a href={ex.video_url} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-sm">
                <IconPlay width={16} height={16} /> Guarda l'esecuzione
              </a>
            )}
            <button onClick={onLog} className="btn-primary px-3 py-2 text-sm">Registra i carichi</button>
            {canEdit && (
              <button onClick={onEdit} className="btn-ghost px-3 py-2 text-sm">
                <IconEdit width={16} height={16} /> Modifica
              </button>
            )}
          </div>
          {item.rest_sec ? (
            <button onClick={onTimer} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand">
              <IconTimer width={16} height={16} /> Avvia recupero di {item.rest_sec}s
            </button>
          ) : null}
        </div>
      )}
    </li>
  )
}

/* ---------------- registrazione carichi ---------------- */
function ModalLog({ item, userId, onClose, onDone, onSalvato }) {
  const [riga, setRiga] = useState({ weight_kg: '', reps: '', rir: '', notes: '' })
  const [storico, setStorico] = useState([])
  const [origine, setOrigine] = useState(null)   // 'oggi' | 'ultima' | null
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!item) return
    setRiga({ weight_kg: '', reps: '', rir: '', notes: '' })
    setStorico([]); setOrigine(null)
    supabase.from('workout_logs').select('*').eq('item_id', item.id).eq('user_id', userId)
      .order('date', { ascending: false }).order('set_no').limit(12)
      .then(({ data }) => {
        const s = data ?? []
        setStorico(s)
        // Se l'atleta ha già registrato oggi, sta modificando quella riga.
        // Altrimenti gli propongo i valori dell'ultima volta: di solito è quello che rialza.
        const diOggi = s.find((l) => l.date === oggi())
        if (diOggi) {
          setRiga({
            weight_kg: diOggi.weight_kg ?? '', reps: diOggi.reps ?? '',
            rir: diOggi.rir ?? '', notes: diOggi.notes ?? '',
          })
          setOrigine('oggi')
        } else if (s[0]) {
          setRiga({ weight_kg: s[0].weight_kg ?? '', reps: s[0].reps ?? '', rir: s[0].rir ?? '', notes: '' })
          setOrigine('ultima')
        }
      })
  }, [item, userId])

  if (!item) return null

  async function salva(e) {
    e.preventDefault()
    const data = oggi()
    const log = {
      user_id: userId,
      item_id: item.id,
      date: data,
      set_no: 1,
      weight_kg: riga.weight_kg === '' ? null : Number(riga.weight_kg),
      reps: riga.reps === '' ? null : Number(riga.reps),
      rir: riga.rir === '' ? null : Number(riga.rir),
      notes: riga.notes.trim() || null,
    }
    if (log.weight_kg === null && log.reps === null) return onClose()
    setBusy(true)
    const { error: delError } = await supabase.from('workout_logs')
      .delete().eq('user_id', userId).eq('item_id', item.id).eq('date', data)
    if (delError) { setBusy(false); return toast.err(delError) }

    const { error } = await supabase.from('workout_logs').insert(log)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(`Carico registrato · ${item.exercise?.name ?? ''}`)
    onSalvato?.(item)
    onClose(); onDone()
  }

  const visti = new Set()
  const perData = []
  storico.forEach((l) => {
    if (visti.has(l.date)) return
    visti.add(l.date)
    perData.push(l)
  })

  return (
    <Modal open={!!item} onClose={onClose} title={item.exercise?.name ?? 'Esercizio'}>
      <p className="-mt-2 mb-1 text-sm text-muted">
        Obiettivo di oggi: {item.sets} × {item.reps}{item.rir ? ` a RIR ${item.rir}` : ''}
      </p>
      {origine === 'ultima' && (
        <p className="mb-4 text-[13px] text-brand">Precompilato con i valori dell'ultima volta: modifica se serve.</p>
      )}
      {origine === 'oggi' && (
        <p className="mb-4 text-[13px] text-muted">Stai modificando la seduta già registrata oggi.</p>
      )}
      {!origine && <div className="mb-4" />}
      <form onSubmit={salva} className="space-y-3">
        <div className="grid grid-cols-3 items-center gap-2 text-[12px] text-muted">
          <span>kg</span><span>rip</span><span>RIR</span>
        </div>
        <div className="grid grid-cols-3 items-center gap-2">
          {['weight_kg', 'reps', 'rir'].map((k) => (
            <input
              key={k} className="field px-2 py-2 text-center" type="number" step="0.5" inputMode="decimal"
              value={riga[k]}
              onChange={(e) => setRiga((prev) => ({ ...prev, [k]: e.target.value }))}
            />
          ))}
        </div>
        <label className="block">
          <span className="label">Sensazioni su questo esercizio</span>
          <textarea
            className="field min-h-[74px]"
            value={riga.notes}
            onChange={(e) => setRiga((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Esecuzione, fatica, dolore, stabilita, pompaggio..."
          />
        </label>
        <div className="flex gap-3 pt-2">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva il carico di oggi'}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Chiudi</button>
        </div>
      </form>

      {perData.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-[13px] font-medium text-muted">Sedute precedenti</p>
          {perData.map((l) => (
            <div key={l.id} className="flex gap-3 py-1.5 text-sm">
              <span className="w-16 shrink-0 text-muted">{l.date.slice(8, 10)}/{l.date.slice(5, 7)}</span>
              <div>
                <p className="stat text-[16px]">
                  {l.weight_kg ?? '–'}×{l.reps ?? '–'}{l.rir != null ? ` · RIR ${l.rir}` : ''}
                </p>
                {l.notes && <p className="text-[12px] text-muted">{l.notes}</p>}
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
function ModalPiano({ open, onClose, userId, onDone }) {
  const [f, setF] = useState({ title: '', description: '', weeks: 8 })
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from('workout_plans')
      .insert({ user_id: userId, title: f.title, description: f.description, weeks: Number(f.weeks), is_active: true })
      .select().single()
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Scheda creata')
    onClose(); onDone()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuova scheda">
      <form onSubmit={salva} className="space-y-4">
        <Field label="Titolo" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })}
               placeholder="Scheda personalizzata" required />
        <label className="block">
          <span className="label">Descrizione</span>
          <textarea className="field min-h-[80px]" value={f.description}
                    onChange={(e) => setF({ ...f, description: e.target.value })}
                    placeholder="Obiettivo e linee guida della scheda." />
        </label>
        <Field label="Durata (settimane)" type="number" value={f.weeks}
               onChange={(e) => setF({ ...f, weeks: e.target.value })} />
        <p className="text-sm text-muted">Dopo la creazione aggiungi tu i giorni che ti servono.</p>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creo…' : 'Crea scheda'}</button>
      </form>
    </Modal>
  )
}
