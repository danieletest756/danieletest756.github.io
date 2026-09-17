import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  Section, Empty, Modal, Field, Spinner,
  IconChevron, IconTeam, IconCamera, IconWarning, IconCalendar, IconPlus, IconDownload, IconTrash,
} from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'
import { esportaTutteLeFoto } from '../lib/esportaFoto'
import { scaricaICS } from '../lib/ics'

export default function Atleti() {
  const { setViewing, profile } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [copia, setCopia] = useState(false)
  const [esportando, setEsportando] = useState(null)   // null | { fatte, totali }
  const [segnali, setSegnali] = useState({})   // { atleta_id: ['testo avviso', ...] }
  const [appuntamenti, setAppuntamenti] = useState([])
  const [nuovoApp, setNuovoApp] = useState(null)   // null chiuso | {} aperto
  const toast = useToast()
  const chiedi = useConfirm()

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function caricaAgenda() {
    const { data } = await supabase.from('appointments')
      .select('*, atleta:profiles(full_name,email)')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
    setAppuntamenti(data ?? [])
  }
  useEffect(() => { caricaAgenda() }, [])

  async function eliminaAppuntamento(app) {
    const ok = await chiedi({ title: 'Elimino questo appuntamento?', body: 'Non si torna indietro.', conferma: 'Elimina', danger: true })
    if (!ok) return
    const { error } = await supabase.from('appointments').delete().eq('id', app.id)
    if (error) return toast.err(error)
    setAppuntamenti((prev) => prev.filter((a) => a.id !== app.id))
    toast.ok('Appuntamento eliminato')
  }

  useEffect(() => {
    if (!rows) return
    const ids = rows.filter((r) => r.id !== profile.id).map((r) => r.id)
    if (!ids.length) return
    calcolaSegnali(ids).then(setSegnali)
  }, [rows])   // eslint-disable-line react-hooks/exhaustive-deps

  if (rows === null) return <Spinner />

  const atleti = rows.filter((r) => r.id !== profile.id)
  const filtrati = atleti.filter((a) =>
    (a.full_name || a.email || '').toLowerCase().includes(q.toLowerCase()))

  function apri(a) { setViewing(a); navigate('/allenamento') }

  async function cambiaRuolo(a, ruolo) {
    const { error } = await supabase.from('profiles').update({ role: ruolo }).eq('id', a.id)
    if (error) return toast.err(error)
    setRows((prev) => prev.map((r) => (r.id === a.id ? { ...r, role: ruolo } : r)))
    toast.ok(
      ruolo === 'semi_god'
        ? `${a.full_name || a.email} può ora modificare la propria scheda e dieta`
        : `${a.full_name || a.email} è tornato/a un atleta normale`
    )
  }

  async function scaricaFoto() {
    setEsportando({ fatte: 0, totali: 0 })
    try {
      const zip = await esportaTutteLeFoto((fatte, totali) => setEsportando({ fatte, totali }))
      if (!zip) { toast.info('Non ci sono ancora foto da scaricare.'); return }

      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = `foto-misure-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.ok('Zip scaricato')
    } catch (err) {
      toast.err(err)
    } finally {
      setEsportando(null)
    }
  }

  return (
    <>
      <Section title={`Atleti · ${atleti.length}`} accent>
        <div className="mb-4 flex gap-2">
          <input className="field" placeholder="Cerca per nome" value={q} onChange={(e) => setQ(e.target.value)} />
          <Link to="/esercizi" className="btn-ghost shrink-0 px-3 text-sm">Esercizi</Link>
        </div>

        {atleti.length === 0 ? (
          <Empty
            title="Ancora nessun atleta"
            hint="Fai registrare i tuoi atleti dalla schermata di accesso: appariranno qui appena creano l'account."
            icon={IconTeam}
          />
        ) : (
          <ul className="space-y-3">
            {filtrati.map((a) => (
              <li key={a.id} className="card flex items-center gap-3 p-4">
                <button onClick={() => apri(a)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brandsoft font-cond text-[19px] font-semibold text-brand">
                    {iniziali(a.full_name || a.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-tight">{a.full_name || 'Senza nome'}</span>
                    <span className="block truncate text-[13px] text-muted">{a.email}</span>
                    {(segnali[a.id]?.length ?? 0) > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {segnali[a.id].map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-bad/10 px-1.5 py-0.5 text-[11px] font-medium text-bad">
                            <IconWarning width={11} height={11} /> {s}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  <IconChevron width={18} height={18} className="shrink-0 text-muted" />
                </button>
                {a.role === 'god' ? (
                  <span className="shrink-0 rounded-lg bg-brandsoft px-2.5 py-2 text-[13px] font-medium text-brand">
                    Coach
                  </span>
                ) : (
                  <select
                    className="field w-auto shrink-0 py-2 text-[13px]"
                    value={a.role}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => cambiaRuolo(a, e.target.value)}
                    aria-label={`Ruolo di ${a.full_name || a.email}`}
                    title="Atleta: legge soltanto. Semi-god: può modificare la propria scheda e dieta, ma non vede gli altri atleti."
                  >
                    <option value="atleta">Atleta</option>
                    <option value="semi_god">Semi-god</option>
                  </select>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <button onClick={() => setCopia(true)} className="btn-ghost w-full">
            Copia una scheda su un altro atleta
          </button>
          <button onClick={scaricaFoto} disabled={!!esportando} className="btn-ghost w-full">
            <IconCamera width={16} height={16} /> Scarica tutte le foto misure (zip)
          </button>
        </div>
      </Section>

      <Section
        title="Agenda"
        action={
          <button onClick={() => setNuovoApp({})} className="btn-ghost px-3 py-2 text-sm">
            <IconPlus width={16} height={16} /> Appuntamento
          </button>
        }
      >
        {appuntamenti.length === 0 ? (
          <Empty title="Nessun appuntamento in programma" icon={IconCalendar} />
        ) : (
          <ul className="space-y-3">
            {appuntamenti.map((a) => (
              <li key={a.id} className="card flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brandsoft text-center font-cond leading-none text-brand">
                  <span className="block text-[17px] font-bold">{new Date(a.starts_at).getDate()}</span>
                  <span className="block text-[10px] uppercase">
                    {new Date(a.starts_at).toLocaleDateString('it-IT', { month: 'short' })}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="text-[12px] text-muted">
                    {a.atleta?.full_name || a.atleta?.email || 'Atleta'} ·{' '}
                    {new Date(a.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                    {a.duration_min} min
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => scaricaICS({ id: a.id, title: a.title, startsAt: a.starts_at, durationMin: a.duration_min, notes: a.notes })}
                    className="p-1 text-muted hover:text-brand"
                    aria-label="Aggiungi al calendario"
                  >
                    <IconDownload width={17} height={17} />
                  </button>
                  <button onClick={() => eliminaAppuntamento(a)} className="p-1 text-muted hover:text-bad" aria-label="Elimina">
                    <IconTrash width={17} height={17} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <ModalCopia open={copia} onClose={() => setCopia(false)} atleti={atleti} />
      <ModalAppuntamento
        open={!!nuovoApp}
        atleti={atleti}
        onClose={() => setNuovoApp(null)}
        onSalvato={() => { setNuovoApp(null); caricaAgenda() }}
      />

      <Modal open={!!esportando} onClose={() => {}} title="Scarico le foto">
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-brand" />
          <p className="text-sm text-muted">
            {esportando?.totali
              ? `Foto ${esportando.fatte} di ${esportando.totali}…`
              : 'Preparo l\'elenco delle foto…'}
          </p>
          <p className="text-center text-xs text-muted">
            Può volerci un po' se sono tante: non chiudere la pagina.
          </p>
        </div>
      </Modal>
    </>
  )
}

const iniziali = (s = '') =>
  s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

/*
  Avvisi trasparenti, non un punteggio calcolato: ogni regola qui sotto si spiega
  da sola in una frase, niente formula "scientifica" improvvisata che nessuno può
  verificare. Tre regole, tutte semplici:
  1. carico in calo su un esercizio (ultime due sedute registrate, in calo)
  2. check-in fermo da troppi giorni (solo se l'atleta lo usa già)
  3. energia o sonno bassi negli ultimi check-in (media <= 2 su 5)
*/
async function calcolaSegnali(ids) {
  const soglia = new Date()
  soglia.setDate(soglia.getDate() - 21)

  const [{ data: logs }, { data: checks }] = await Promise.all([
    supabase.from('workout_logs')
      .select('user_id, item_id, date, weight_kg')
      .in('user_id', ids).not('weight_kg', 'is', null)
      .gte('date', soglia.toISOString().slice(0, 10))
      .order('date', { ascending: false }),
    supabase.from('checkins')
      .select('user_id, date, sleep_score, energy_score')
      .in('user_id', ids)
      .order('date', { ascending: false }),
  ])

  const out = {}
  const aggiungi = (id, testo) => { (out[id] ||= []).push(testo) }

  // 1) carico in calo: confronta le ultime due sedute (non le ultime due righe —
  // un esercizio ha più serie lo stesso giorno, va aggregato al "top set" del
  // giorno prima di confrontare due sedute vere)
  const perItem = {}
  ;(logs ?? []).forEach((l) => {
    const perData = (perItem[l.item_id] ||= {})
    const peso = Number(l.weight_kg)
    if (!perData[l.date] || peso > perData[l.date].peso) perData[l.date] = { peso, user_id: l.user_id }
  })
  const segnalatoCalo = new Set()
  Object.values(perItem).forEach((perData) => {
    const date = Object.keys(perData).sort((a, b) => b.localeCompare(a))
    if (date.length < 2) return
    const ultima = perData[date[0]]
    const precedente = perData[date[1]]
    if (!segnalatoCalo.has(ultima.user_id) && ultima.peso < precedente.peso) {
      aggiungi(ultima.user_id, 'Carico in calo')
      segnalatoCalo.add(ultima.user_id)
    }
  })

  // 2) e 3): check-in fermo da troppi giorni, oppure energia/sonno bassi di recente
  const perUtente = {}
  ;(checks ?? []).forEach((c) => { (perUtente[c.user_id] ||= []).push(c) })
  Object.entries(perUtente).forEach(([uid, righe]) => {
    const ordinate = [...righe].sort((a, b) => b.date.localeCompare(a.date))
    const giorni = Math.floor((Date.now() - new Date(ordinate[0].date)) / 86400000)
    if (giorni >= 5) aggiungi(uid, `Check-in fermo da ${giorni} giorni`)

    const ultimi3 = ordinate.slice(0, 3)
    if (ultimi3.length === 3) {
      const media = (campo) => ultimi3.reduce((s, c) => s + (c[campo] ?? 3), 0) / 3
      if (media('energy_score') <= 2) aggiungi(uid, 'Energia bassa di recente')
      if (media('sleep_score') <= 2) aggiungi(uid, 'Sonno scarso di recente')
    }
  })

  return out
}

/* Duplica una scheda esistente su un altro atleta: giorni ed esercizi compresi. */
function ModalCopia({ open, onClose, atleti }) {
  const [plans, setPlans] = useState([])
  const [src, setSrc] = useState('')
  const [dst, setDst] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    supabase.from('workout_plans').select('id,title,user_id,profiles:user_id(full_name,email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPlans(data ?? []))
  }, [open])

  async function copia(e) {
    e.preventDefault()
    if (!src || !dst) return
    setBusy(true)
    try {
      const { data: p } = await supabase.from('workout_plans').select('*').eq('id', src).single()
      const { data: nuovo } = await supabase.from('workout_plans').insert({
        user_id: dst, title: p.title, description: p.description, weeks: p.weeks, is_active: true,
      }).select().single()

      const { data: days } = await supabase.from('workout_days').select('*').eq('plan_id', src).order('position')
      for (const d of days ?? []) {
        const { data: nd } = await supabase.from('workout_days')
          .insert({ plan_id: nuovo.id, position: d.position, title: d.title, notes: d.notes }).select().single()
        const { data: items } = await supabase.from('workout_items').select('*').eq('day_id', d.id).order('position')
        if (items?.length) {
          await supabase.from('workout_items').insert(items.map((i) => ({
            day_id: nd.id, exercise_id: i.exercise_id, position: i.position,
            sets: i.sets, reps: i.reps, rir: i.rir, rest_sec: i.rest_sec, notes: i.notes,
          })))
        }
      }
      const nome = atleti.find((a) => a.id === dst)
      onClose()
      setSrc(''); setDst('')
      toast.ok(`Scheda copiata su ${nome?.full_name || nome?.email || 'l\'atleta'}`)
    } catch (err) {
      toast.err(err)
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Copia una scheda">
      <form onSubmit={copia} className="space-y-4">
        <label className="block">
          <span className="label">Scheda da copiare</span>
          <select className="field" value={src} onChange={(e) => setSrc(e.target.value)} required>
            <option value="">Scegli…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — {p.profiles?.full_name || p.profiles?.email}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Assegnala a</span>
          <select className="field" value={dst} onChange={(e) => setDst(e.target.value)} required>
            <option value="">Scegli l'atleta…</option>
            {atleti.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
          </select>
        </label>
        <p className="text-sm text-muted">
          Vengono copiati giorni, esercizi e parametri. I carichi registrati restano di chi li ha fatti.
        </p>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Copio…' : 'Copia scheda'}</button>
      </form>
    </Modal>
  )
}

/* Crea un appuntamento in agenda. La data/ora è un solo input datetime-local:
   il browser mostra già il fuso locale, salviamo l'ISO string che ne esce. */
function ModalAppuntamento({ open, atleti, onClose, onSalvato }) {
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open) setForm({ title: 'Sessione di allenamento', duration_min: 60 })
  }, [open])

  async function salva(e) {
    e.preventDefault()
    if (!form.user_id || !form.starts_at) return
    setBusy(true)
    const { error } = await supabase.from('appointments').insert({
      user_id: form.user_id,
      title: form.title?.trim() || 'Sessione di allenamento',
      starts_at: new Date(form.starts_at).toISOString(),
      duration_min: Number(form.duration_min) || 60,
      notes: form.notes || null,
    })
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Appuntamento aggiunto')
    onSalvato()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuovo appuntamento">
      <form onSubmit={salva} className="space-y-4">
        <label className="block">
          <span className="label">Atleta</span>
          <select className="field" value={form.user_id ?? ''} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
            <option value="">Scegli…</option>
            {atleti.map((a) => <option key={a.id} value={a.id}>{a.full_name || a.email}</option>)}
          </select>
        </label>
        <Field label="Titolo" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data e ora" type="datetime-local" value={form.starts_at ?? ''}
                 onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
          <Field label="Durata (minuti)" type="number" value={form.duration_min ?? 60}
                 onChange={(e) => setForm({ ...form, duration_min: e.target.value })} />
        </div>
        <label className="block">
          <span className="label">Note (facoltative)</span>
          <textarea className="field min-h-[70px]" value={form.notes ?? ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Salvo…' : 'Aggiungi appuntamento'}</button>
      </form>
    </Modal>
  )
}
