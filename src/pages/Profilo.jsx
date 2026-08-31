import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Field, Spinner } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'

export default function Profilo() {
  const { target, targetId, isGod, viewing, signOut, refreshProfile } = useAuth()
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => { setForm(target ? { ...target } : null) }, [target])

  if (!form) return <Spinner />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    const payload = {
      full_name: form.full_name, birth_date: form.birth_date || null, sex: form.sex || null,
      height_cm: form.height_cm || null, phone: form.phone, goal: form.goal,
    }
    if (isGod) payload.notes = form.notes
    const { error } = await supabase.from('profiles').update(payload).eq('id', targetId)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(viewing ? `Profilo di ${form.full_name || 'l\'atleta'} salvato` : 'Profilo salvato')
    if (!viewing) refreshProfile()
  }

  async function esci() {
    const ok = await chiedi({
      title: 'Esci dall\'account?',
      body: 'Per rientrare ti servono di nuovo email e password.',
      conferma: 'Esci',
      danger: true,
    })
    if (ok) signOut()
  }

  const eta = form.birth_date
    ? Math.floor((Date.now() - new Date(form.birth_date)) / 31557600000)
    : null

  return (
    <>
      <Section title="Dati personali">
        <form onSubmit={save} className="card space-y-4 p-5">
          <Field label="Nome e cognome" value={form.full_name || ''} onChange={set('full_name')} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data di nascita" type="date" value={form.birth_date || ''} onChange={set('birth_date')}
                   hint={eta ? `${eta} anni` : undefined} />
            <label className="block">
              <span className="label">Sesso</span>
              <select className="field" value={form.sex || ''} onChange={set('sex')}>
                <option value="">—</option>
                <option value="F">F</option>
                <option value="M">M</option>
                <option value="altro">Altro</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Altezza (cm)" type="number" inputMode="decimal" value={form.height_cm || ''} onChange={set('height_cm')} />
            <Field label="Telefono" type="tel" value={form.phone || ''} onChange={set('phone')} />
          </div>
          <label className="block">
            <span className="label">Obiettivo</span>
            <textarea className="field min-h-[84px]" value={form.goal || ''} onChange={set('goal')}
                      placeholder="Es. costruire glutei e catena posteriore, gambe meno pesanti la sera" />
          </label>

          {isGod && (
            <label className="block">
              <span className="label">Note del coach (visibili solo a te)</span>
              <textarea className="field min-h-[84px]" value={form.notes || ''} onChange={set('notes')}
                        placeholder="Infortuni, limitazioni, storico" />
            </label>
          )}

          <div className="pt-1">
            <button className="btn-primary" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
          </div>
        </form>
      </Section>

      <Section title="Account">
        <div className="card divide-y divide-line">
          <Riga k="Email" v={form.email} />
          <Riga k="Ruolo" v={form.role === 'god' ? 'Coach' : 'Atleta'} />
        </div>
        {!viewing && (
          <button onClick={esci} className="btn-danger mt-4 w-full">Esci dall'account</button>
        )}
      </Section>
    </>
  )
}

const Riga = ({ k, v }) => (
  <div className="flex items-center justify-between px-5 py-3.5">
    <span className="text-sm text-muted">{k}</span>
    <span className="font-medium">{v || '—'}</span>
  </div>
)
