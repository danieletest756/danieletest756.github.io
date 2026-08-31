import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Modal, Field, Spinner, Empty, IconPlus, IconBack, IconTrash, IconPlay } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'

export default function Esercizi() {
  const { isGod } = useAuth()
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  async function load() {
    const { data } = await supabase.from('exercises').select('*').order('muscle_group').order('name')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])
  if (rows === null) return <Spinner />

  const filtrati = rows.filter((r) =>
    `${r.name} ${r.muscle_group}`.toLowerCase().includes(q.toLowerCase()))
  const gruppi = filtrati.reduce((a, r) => { (a[r.muscle_group || 'Altro'] ||= []).push(r); return a }, {})

  return (
    <>
      <Link to="/atleti" className="mb-3 inline-flex items-center gap-1 text-sm text-muted">
        <IconBack width={16} height={16} /> Atleti
      </Link>

      <Section
        title="Libreria esercizi"
        accent
        action={isGod && (
          <button onClick={() => setEdit({})} className="btn-primary px-3 py-2 text-sm">
            <IconPlus width={17} height={17} /> Nuovo
          </button>
        )}
      >
        <input className="field mb-4" placeholder="Cerca esercizio" value={q} onChange={(e) => setQ(e.target.value)} />

        {filtrati.length === 0 ? (
          <Empty title="Nessun esercizio trovato" hint="Cambia la ricerca oppure aggiungine uno nuovo." />
        ) : (
          Object.entries(gruppi).map(([g, list]) => (
            <div key={g} className="mb-5">
              <p className="mb-2 font-cond text-[18px] font-semibold text-muted">{g}</p>
              <ul className="card divide-y divide-line">
                {list.map((x) => (
                  <li key={x.id} className="flex items-center gap-3 px-4 py-3">
                    {x.image_url
                      ? <img src={x.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover" />
                      : <span className="h-11 w-11 shrink-0 rounded-lg bg-canvas" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight">{x.name}</p>
                      {x.cues && <p className="truncate text-[13px] text-muted">{x.cues}</p>}
                    </div>
                    {x.video_url && (
                      <a href={x.video_url} target="_blank" rel="noreferrer" className="text-brand" aria-label="Video">
                        <IconPlay width={18} height={18} />
                      </a>
                    )}
                    {isGod && (
                      <button onClick={() => setEdit(x)} className="text-sm font-medium text-muted">Modifica</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Section>

      <ModalEsercizio ex={edit} onClose={() => setEdit(null)} onDone={load} />
    </>
  )
}

function ModalEsercizio({ ex, onClose, onDone }) {
  const [f, setF] = useState({})
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()
  const chiedi = useConfirm()
  useEffect(() => { if (ex) setF({ ...ex }) }, [ex])
  if (!ex) return null
  const nuovo = !ex.id

  async function carica(file) {
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '')}`
    const { error } = await supabase.storage.from('exercise-media').upload(path, file, { upsert: false })
    if (error) { setUploading(false); return toast.err(error) }
    const { data } = supabase.storage.from('exercise-media').getPublicUrl(path)
    setF((s) => ({ ...s, image_url: data.publicUrl }))
    setUploading(false)
  }

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    const p = {
      name: f.name, muscle_group: f.muscle_group || null, image_url: f.image_url || null,
      video_url: f.video_url || null, cues: f.cues || null,
    }
    const { error } = nuovo
      ? await supabase.from('exercises').insert(p)
      : await supabase.from('exercises').update(p).eq('id', ex.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(nuovo ? `«${p.name}» aggiunto alla libreria` : 'Esercizio aggiornato')
    onClose(); onDone()
  }

  async function elimina() {
    const ok = await chiedi({
      title: `Elimino «${ex.name}»?`,
      body: 'Sparisce dalla libreria. Nelle schede in cui è già inserito resta la riga, ma senza esercizio collegato.',
      conferma: 'Elimina dalla libreria',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    const { error } = await supabase.from('exercises').delete().eq('id', ex.id)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok('Esercizio eliminato')
    onClose(); onDone()
  }

  return (
    <Modal open onClose={onClose} title={nuovo ? 'Nuovo esercizio' : f.name}>
      <form onSubmit={salva} className="space-y-4">
        <Field label="Nome" value={f.name ?? ''} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <Field label="Gruppo muscolare" value={f.muscle_group ?? ''} list="gruppi"
               onChange={(e) => setF({ ...f, muscle_group: e.target.value })} />
        <datalist id="gruppi">
          {['Quadricipiti','Femorali','Glutei','Polpacci','Dorso','Petto','Spalle','Braccia','Core','Cardio']
            .map((g) => <option key={g} value={g} />)}
        </datalist>

        <Field label="Link al video" value={f.video_url ?? ''}
               onChange={(e) => setF({ ...f, video_url: e.target.value })}
               placeholder="https://youtube.com/..." hint="Va bene qualsiasi link: YouTube, Instagram, Drive." />

        <div>
          <span className="label">Immagine</span>
          {f.image_url && (
            <img src={f.image_url} alt="" className="mb-2 h-32 w-full rounded-xl border border-line object-cover" />
          )}
          <input type="file" accept="image/*" onChange={(e) => carica(e.target.files[0])}
                 className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink" />
          {uploading && <p className="mt-1 text-xs text-muted">Carico l'immagine…</p>}
        </div>

        <label className="block">
          <span className="label">Indicazioni tecniche</span>
          <textarea className="field min-h-[80px]" value={f.cues ?? ''}
                    onChange={(e) => setF({ ...f, cues: e.target.value })}
                    placeholder="Scendere fino a coscia parallela, senza rimbalzare in basso" />
        </label>

        <div className="flex gap-3">
          <button className="btn-primary flex-1" disabled={busy || uploading}>{busy ? 'Salvo…' : 'Salva'}</button>
          {!nuovo && (
            <button type="button" onClick={elimina} disabled={busy} className="btn-danger" aria-label="Elimina esercizio">
              <IconTrash width={18} height={18} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
