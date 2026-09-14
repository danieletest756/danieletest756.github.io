import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Spinner, IconFeedback, IconTrash } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'

/*
  Non passa da targetId/viewing: riguarda l'esperienza di chi sta davvero
  usando l'app in quel momento (bug, migliorie, idee), non la scheda o la
  dieta di un atleta. Il god vede le segnalazioni di tutti grazie alla RLS
  (feedback_select), chiunque altro vede solo le proprie.
*/

const CATEGORIE = [
  { v: 'bug',       l: 'Bug' },
  { v: 'miglioria', l: 'Miglioria' },
  { v: 'altro',     l: 'Altro' },
]

const STATI = [
  { v: 'nuovo',          l: 'Nuovo',          cls: 'bg-brandsoft text-brand' },
  { v: 'in_lavorazione', l: 'In lavorazione', cls: 'bg-saffron/15 text-[#9A6C00]' },
  { v: 'risolto',        l: 'Risolto',        cls: 'bg-good/10 text-good' },
]

const badgeCategoria = (v) =>
  v === 'bug' ? 'bg-bad/10 text-bad' : v === 'miglioria' ? 'bg-brandsoft text-brand' : 'bg-canvas text-muted'

export default function Segnalazioni() {
  const { profile, isGod } = useAuth()
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState({ category: 'bug', message: '' })
  const [invio, setInvio] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()

  async function load() {
    const { data, error } = await supabase
      .from('app_feedback')
      .select('*, autore:profiles(full_name,email)')
      .order('created_at', { ascending: false })
    if (error) { toast.err(error); return setRows([]) }
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  if (!profile || rows === null) return <Spinner />

  async function invia(e) {
    e.preventDefault()
    if (!form.message.trim()) return
    setInvio(true)
    const { error } = await supabase.from('app_feedback').insert({
      user_id: profile.id, category: form.category, message: form.message.trim(),
    })
    setInvio(false)
    if (error) return toast.err(error)
    setForm({ category: 'bug', message: '' })
    toast.ok('Segnalazione inviata, grazie!')
    load()
  }

  async function cambiaStato(r, status) {
    const { error } = await supabase.from('app_feedback').update({ status }).eq('id', r.id)
    if (error) return toast.err(error)
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)))
  }

  async function elimina(r) {
    const ok = await chiedi({
      title: 'Elimino questa segnalazione?',
      body: 'Non si torna indietro.',
      conferma: 'Elimina',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('app_feedback').delete().eq('id', r.id)
    if (error) return toast.err(error)
    setRows((prev) => prev.filter((x) => x.id !== r.id))
    toast.ok('Segnalazione eliminata')
  }

  return (
    <>
      <Section title="Feedback" accent>
        <p className="-mt-1 mb-4 text-sm leading-relaxed text-muted">
          {isGod
            ? 'Bug, migliorie e idee segnalate da te e dai tuoi atleti.'
            : 'Hai trovato un problema o hai un\'idea per migliorare l\'app? Scrivila qui: arriva dritta al coach.'}
        </p>

        <form onSubmit={invia} className="card mb-5 space-y-3 p-4">
          <div className="flex gap-2">
            {CATEGORIE.map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({ ...form, category: v })}
                className={`flex-1 rounded-xl border px-2 py-2 text-[13px] font-medium ${
                  form.category === v ? 'border-brand bg-brandsoft text-brand' : 'border-line text-muted'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <textarea
            className="field min-h-[90px]"
            placeholder="Racconta cosa hai visto o cosa cambieresti…"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />
          <button className="btn-primary w-full" disabled={invio}>
            {invio ? 'Invio…' : 'Invia segnalazione'}
          </button>
        </form>

        {rows.length === 0 ? (
          <Empty
            title="Nessuna segnalazione"
            hint="Quando invii un bug o un'idea, la trovi qui insieme al suo stato."
            icon={IconFeedback}
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const cat = CATEGORIE.find((c) => c.v === r.category)
              const stato = STATI.find((s) => s.v === r.status)
              const puoEliminare = isGod || r.user_id === profile.id
              return (
                <li key={r.id} className="card p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${badgeCategoria(r.category)}`}>
                        {cat?.l ?? r.category}
                      </span>
                      {isGod && (
                        <span className="text-[12px] text-muted">
                          {r.autore?.full_name || r.autore?.email || 'Atleta'}
                        </span>
                      )}
                    </div>
                    {puoEliminare && (
                      <button onClick={() => elimina(r)} className="shrink-0 p-1 text-muted hover:text-bad" aria-label="Elimina">
                        <IconTrash width={17} height={17} />
                      </button>
                    )}
                  </div>

                  <p className="whitespace-pre-line text-sm leading-relaxed">{r.message}</p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[12px] text-muted">
                      {new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {isGod ? (
                      <select
                        className="field w-auto py-1.5 text-[13px]"
                        value={r.status}
                        onChange={(e) => cambiaStato(r, e.target.value)}
                        aria-label="Stato della segnalazione"
                      >
                        {STATI.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${stato?.cls}`}>
                        {stato?.l ?? r.status}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </>
  )
}
