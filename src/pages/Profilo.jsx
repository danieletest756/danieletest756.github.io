import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Modal, Field, Spinner, IconDownload, IconPlus, IconTrash, IconCalendar } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'
import IntestazioneFoto from '../components/IntestazioneFoto'
import { scaricaICS } from '../lib/ics'
import fotoProfilo from '../assets/bg/profilo.jpg'

export default function Profilo() {
  const { target, targetId, isGod, canEdit, viewing, signOut, refreshProfile } = useAuth()
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [appuntamenti, setAppuntamenti] = useState([])
  const [nuovoApp, setNuovoApp] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => { setForm(target ? { ...target } : null) }, [target])

  const caricaAgenda = useCallback(() => {
    if (!targetId) return
    supabase.from('appointments').select('*')
      .eq('user_id', targetId).gte('starts_at', new Date().toISOString()).order('starts_at')
      .then(({ data }) => setAppuntamenti(data ?? []))
  }, [targetId])

  useEffect(() => { caricaAgenda() }, [caricaAgenda])

  async function eliminaAppuntamento(a) {
    const ok = await chiedi({ title: 'Elimino questo appuntamento?', body: 'Non si torna indietro.', conferma: 'Elimina', danger: true })
    if (!ok) return
    const { error } = await supabase.from('appointments').delete().eq('id', a.id)
    if (error) return toast.err(error)
    setAppuntamenti((prev) => prev.filter((x) => x.id !== a.id))
    toast.ok('Appuntamento eliminato')
  }

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
      <IntestazioneFoto src={fotoProfilo} titolo={viewing ? `Profilo di ${form.full_name || 'atleta'}` : 'Dati personali'} />

      <Section>
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

      {(appuntamenti.length > 0 || canEdit) && (
        <Section
          title="Prossimi appuntamenti"
          action={canEdit && (
            <button onClick={() => setNuovoApp(true)} className="btn-ghost px-3 py-2 text-sm">
              <IconPlus width={16} height={16} /> Nuovo
            </button>
          )}
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
                      <IconDownload width={18} height={18} />
                    </button>
                    {canEdit && (
                      <button onClick={() => eliminaAppuntamento(a)} className="p-1 text-muted hover:text-bad" aria-label="Elimina">
                        <IconTrash width={18} height={18} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {canEdit && (
        <ModalAppuntamentoProfilo
          open={nuovoApp}
          userId={targetId}
          onClose={() => setNuovoApp(false)}
          onSalvato={() => { setNuovoApp(false); caricaAgenda() }}
        />
      )}

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

/* Come ModalAppuntamento in Atleti.jsx, ma senza il selettore atleta: qui l'atleta
   è già fissato (targetId) — utile anche al semi-god, che può gestire i propri
   appuntamenti pur non vedendo la pagina Atleti (isGod-only). */
function ModalAppuntamentoProfilo({ open, userId, onClose, onSalvato }) {
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (open) setForm({ title: 'Sessione di allenamento', duration_min: 60 })
  }, [open])

  async function salva(e) {
    e.preventDefault()
    if (!form.starts_at) return
    setBusy(true)
    const { error } = await supabase.from('appointments').insert({
      user_id: userId,
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
