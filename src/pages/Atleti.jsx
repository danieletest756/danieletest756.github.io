import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Modal, Spinner, IconChevron } from '../components/ui'
import { useToast } from '../components/Feedback'

export default function Atleti() {
  const { setViewing, profile } = useAuth()
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [copia, setCopia] = useState(false)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  if (rows === null) return <Spinner />

  const atleti = rows.filter((r) => r.id !== profile.id)
  const filtrati = atleti.filter((a) =>
    (a.full_name || a.email || '').toLowerCase().includes(q.toLowerCase()))

  function apri(a) { setViewing(a); navigate('/allenamento') }

  return (
    <>
      <Section title={`Atleti · ${atleti.length}`}>
        <div className="mb-4 flex gap-2">
          <input className="field" placeholder="Cerca per nome" value={q} onChange={(e) => setQ(e.target.value)} />
          <Link to="/esercizi" className="btn-ghost shrink-0 px-3 text-sm">Esercizi</Link>
        </div>

        {atleti.length === 0 ? (
          <Empty
            title="Ancora nessun atleta"
            hint="Fai registrare i tuoi atleti dalla schermata di accesso: appariranno qui appena creano l'account."
          />
        ) : (
          <ul className="space-y-3">
            {filtrati.map((a) => (
              <li key={a.id}>
                <button onClick={() => apri(a)} className="card flex w-full items-center gap-3 p-4 text-left">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brandsoft font-cond text-[19px] font-semibold text-brand">
                    {iniziali(a.full_name || a.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold leading-tight">{a.full_name || 'Senza nome'}</span>
                    <span className="block truncate text-[13px] text-muted">{a.email}</span>
                  </span>
                  <IconChevron width={18} height={18} className="text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button onClick={() => setCopia(true)} className="btn-ghost mt-4 w-full">
          Copia una scheda su un altro atleta
        </button>
      </Section>

      <ModalCopia open={copia} onClose={() => setCopia(false)} atleti={atleti} />
    </>
  )
}

const iniziali = (s = '') =>
  s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

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
