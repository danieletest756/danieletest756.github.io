import { useCallback, useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Modal, Field, Empty, Spinner, IconPlus, IconTrash, IconRuler, IconDownload } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'
import { SceltaFoto, Galleria } from '../components/FotoMisura'
import { caricaFoto, urlFirmati } from '../lib/foto'
import { esportaFotoMisurazione } from '../lib/esportaFoto'
import IntestazioneFoto from '../components/IntestazioneFoto'
import GraficoAndamento from '../components/GraficoAndamento'
import fotoMisure from '../assets/bg/misure.jpg'

const CAMPI = [
  { k: 'weight_kg', l: 'Peso',        u: 'kg' },
  { k: 'chest_cm',  l: 'Petto',       u: 'cm' },
  { k: 'waist_cm',  l: 'Vita',        u: 'cm' },
  { k: 'hips_cm',   l: 'Fianchi',     u: 'cm' },
  { k: 'thigh_cm',  l: 'Coscia',      u: 'cm' },
  { k: 'glute_cm',  l: 'Metà gluteo', u: 'cm' },
  { k: 'calf_cm',   l: 'Polpaccio',   u: 'cm' },
]

const oggi = () => new Date().toISOString().slice(0, 10)

export default function Misure() {
  const { targetId } = useAuth()
  const [rows, setRows] = useState(null)
  const [foto, setFoto] = useState({})       // { measurement_id: [foto, ...] }
  const [urls, setUrls] = useState({})       // { path: link firmato }
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ date: oggi() })
  const [fotoNuove, setFotoNuove] = useState([])
  const [busy, setBusy] = useState(false)
  const [fase, setFase] = useState('')       // cosa sto facendo, mentre salvo
  const [scaricando, setScaricando] = useState(null)   // id della misurazione di cui sto zippando le foto
  const toast = useToast()
  const chiedi = useConfirm()

  const load = useCallback(async () => {
    if (!targetId) return
    const { data } = await supabase.from('measurements').select('*')
      .eq('user_id', targetId).order('date', { ascending: false })
    const misure = data ?? []
    setRows(misure)

    if (!misure.length) { setFoto({}); setUrls({}); return }

    const { data: f } = await supabase.from('measurement_photos').select('*')
      .in('measurement_id', misure.map((r) => r.id))
      .order('position')

    const gruppi = {}
    ;(f ?? []).forEach((r) => { (gruppi[r.measurement_id] ||= []).push(r) })
    setFoto(gruppi)

    // Il bucket è privato: servono link firmati, uno per foto ma in una chiamata sola
    setUrls(await urlFirmati((f ?? []).map((r) => r.path)))
  }, [targetId])

  useEffect(() => { setRows(null); load() }, [load])

  const serie = useMemo(() => (rows ?? [])
    .filter((r) => r.weight_kg != null)
    .map((r) => ({ data: r.date.slice(8, 10) + '/' + r.date.slice(5, 7), peso: Number(r.weight_kg) }))
    .reverse(), [rows])

  if (!targetId || rows === null) return <Spinner />

  const ultima = rows[0]
  const prima = rows[rows.length - 1]

  function chiudiForm() {
    setOpen(false)
    setForm({ date: oggi() })
    setFotoNuove([])
    setFase('')
  }

  async function salva(e) {
    e.preventDefault()
    setBusy(true)
    setFase('Salvo la misurazione…')

    const payload = { user_id: targetId, date: form.date, notes: form.notes || null }
    CAMPI.forEach(({ k }) => { payload[k] = form[k] === '' || form[k] == null ? null : Number(form[k]) })

    const { data, error } = await supabase.from('measurements').insert(payload).select().single()
    if (error) { setBusy(false); setFase(''); return toast.err(error) }

    // Le foto partono solo ora: prima non esisteva la misurazione a cui legarle
    if (fotoNuove.length) {
      try {
        await caricaFoto(fotoNuove, {
          userId: targetId,
          measurementId: data.id,
          onProgresso: (i, tot) => setFase(`Carico la foto ${i} di ${tot}…`),
        })
        toast.ok(`Misurazione salvata con ${fotoNuove.length === 1 ? 'la foto' : `${fotoNuove.length} foto`}`)
      } catch (err) {
        // la misurazione c'è comunque: le foto si riaggiungono dalla sua scheda
        toast.err(err)
        toast.info('La misurazione è salvata. Le foto puoi riaggiungerle da lì.')
      }
    } else {
      toast.ok('Misurazione salvata')
    }

    setBusy(false)
    chiudiForm()
    load()
  }

  async function scaricaFotoMisurazione(r) {
    setScaricando(r.id)
    try {
      const zip = await esportaFotoMisurazione(foto[r.id] ?? [], urls)
      if (!zip) { toast.info('Nessuna foto da scaricare per questa misurazione.'); return }
      const url = URL.createObjectURL(zip)
      const a = document.createElement('a')
      a.href = url
      a.download = `foto-misura-${r.date}.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.ok('Zip scaricato')
    } catch (err) {
      toast.err(err)
    } finally {
      setScaricando(null)
    }
  }

  async function elimina(r) {
    const n = (foto[r.id] ?? []).length
    const ok = await chiedi({
      title: 'Elimino questa misurazione?',
      body: n
        ? `Spariscono anche ${n === 1 ? 'la foto allegata' : `le ${n} foto allegate`}. Non si torna indietro.`
        : 'Non si torna indietro.',
      conferma: 'Elimina',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('measurements').delete().eq('id', r.id)
    if (error) return toast.err(error)
    toast.ok('Misurazione eliminata')
    load()
  }

  return (
    <>
      <IntestazioneFoto
        src={fotoMisure}
        titolo="Misurazioni"
        azione={
          <button onClick={() => setOpen(true)} className="btn-primary px-3 py-2 text-sm">
            <IconPlus width={17} height={17} /> Nuova
          </button>
        }
      />

      <Section>
        {rows.length === 0 ? (
          <Empty
            title="Nessuna misurazione registrata"
            hint="Prendi le misure la mattina, a digiuno, sempre nelle stesse condizioni. Ogni 4 settimane, non ogni settimana."
            action={<button onClick={() => setOpen(true)} className="btn-primary">Aggiungi la prima</button>}
            icon={IconRuler}
          />
        ) : (
          <>
            <div className="card mb-4 grid grid-cols-2 gap-x-3 gap-y-4 p-5 sm:grid-cols-4">
              {CAMPI.map(({ k, l, u }) => {
                const now = ultima?.[k]
                const then = prima?.[k]
                const d = now != null && then != null && rows.length > 1 ? now - then : null
                return (
                  <div key={k}>
                    <p className="text-[13px] text-muted">{l}</p>
                    <p className="stat text-[30px]">
                      {now ?? '—'}<span className="ml-0.5 text-[15px] font-medium text-muted">{now != null ? u : ''}</span>
                    </p>
                    {d != null && d !== 0 && (
                      <p className={`text-[12px] font-medium ${d < 0 ? 'text-good' : 'text-muted'}`}>
                        {d > 0 ? '+' : ''}{Math.round(d * 10) / 10} dall'inizio
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {serie.length > 1 && (
              <div className="card mb-4 p-5 pl-1">
                <p className="mb-3 pl-4 text-[13px] text-muted">Andamento del peso</p>
                <GraficoAndamento dati={serie} chiave="peso" unita="kg" etichetta="Peso" />
              </div>
            )}

            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="font-cond text-[19px] font-semibold">
                      {new Date(r.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-1">
                      {(foto[r.id]?.length ?? 0) > 0 && (
                        <button
                          onClick={() => scaricaFotoMisurazione(r)}
                          disabled={scaricando === r.id}
                          className="p-1 text-muted hover:text-brand disabled:opacity-50"
                          aria-label="Scarica le foto di questa misurazione"
                        >
                          {scaricando === r.id
                            ? <span className="block h-[18px] w-[18px] animate-spin rounded-full border-2 border-line border-t-brand" />
                            : <IconDownload width={18} height={18} />}
                        </button>
                      )}
                      <button onClick={() => elimina(r)} className="p-1 text-muted hover:text-bad" aria-label="Elimina">
                        <IconTrash width={18} height={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {CAMPI.filter(({ k }) => r[k] != null).map(({ k, l, u }) => (
                      <span key={k} className="text-sm text-muted">
                        {l} <b className="stat text-[16px] text-ink">{r[k]}</b> {u}
                      </span>
                    ))}
                  </div>
                  {r.notes && <p className="mt-2 text-sm text-muted">{r.notes}</p>}

                  <Galleria
                    foto={foto[r.id] ?? []} urls={urls}
                    userId={targetId} measurementId={r.id}
                    canDelete onCambio={load}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      <Modal open={open} onClose={busy ? () => {} : chiudiForm} title="Nuova misurazione">
        <form onSubmit={salva} className="space-y-4">
          <Field label="Data" type="date" value={form.date}
                 onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            {CAMPI.map(({ k, l, u }) => (
              <Field key={k} label={`${l} (${u})`} type="number" step="0.1" inputMode="decimal"
                     value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            ))}
          </div>
          <label className="block">
            <span className="label">Note</span>
            <textarea className="field min-h-[70px]" value={form.notes ?? ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Es. fase del ciclo, sensazioni, gonfiore" />
          </label>

          <SceltaFoto files={fotoNuove} onChange={setFotoNuove} />

          <div className="flex items-center gap-3 pt-1">
            <button className="btn-primary flex-1" disabled={busy}>
              {busy ? 'Salvo…' : 'Salva misurazione'}
            </button>
            <button type="button" onClick={chiudiForm} disabled={busy} className="btn-ghost">Annulla</button>
          </div>
          {busy && fase && <p className="text-center text-[13px] text-muted">{fase}</p>}
        </form>
      </Modal>
    </>
  )
}
