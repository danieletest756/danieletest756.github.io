import { useEffect, useRef, useState } from 'react'
import { IconCamera, IconClose, IconPlus, IconTrash, bloccaScroll } from './ui'
import { useToast, useConfirm } from './Feedback'
import { caricaFoto, eliminaFoto } from '../lib/foto'

export const MAX_FOTO = 8

/* ============================================================
   Scelta delle foto dentro il form della nuova misurazione.
   Qui non si carica ancora niente: la misurazione non esiste, quindi i file
   restano in memoria e partono subito dopo il salvataggio.
   ============================================================ */
export function SceltaFoto({ files, onChange }) {
  const [anteprime, setAnteprime] = useState([])
  const toast = useToast()

  useEffect(() => {
    const url = files.map((f) => URL.createObjectURL(f))
    setAnteprime(url)
    return () => url.forEach(URL.revokeObjectURL)
  }, [files])

  function aggiungi(e) {
    const scelti = Array.from(e.target.files ?? [])
    e.target.value = ''            // così si può riscegliere lo stesso file
    if (!scelti.length) return
    const spazio = MAX_FOTO - files.length
    if (spazio <= 0) return toast.info(`Puoi allegare al massimo ${MAX_FOTO} foto per misurazione.`)
    if (scelti.length > spazio) toast.info(`Ne aggiungo ${spazio}: il massimo è ${MAX_FOTO} per misurazione.`)
    onChange([...files, ...scelti.slice(0, spazio)])
  }

  return (
    <div>
      <span className="label">Foto</span>

      {files.length > 0 && (
        <ul className="mb-2.5 grid grid-cols-4 gap-2">
          {anteprime.map((url, i) => (
            <li key={url} className="relative">
              <img src={url} alt="" className="aspect-square w-full rounded-xl border border-line object-cover" />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, k) => k !== i))}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-white shadow"
                aria-label="Togli questa foto"
              >
                <IconClose width={13} height={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="btn-ghost w-full cursor-pointer border-dashed">
        <IconCamera width={18} height={18} />
        {files.length ? 'Aggiungi un\'altra foto' : 'Scegli o scatta le foto'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={aggiungi} />
      </label>

      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Stessa luce, stessa posa, stessa distanza: è il confronto che conta, non la singola foto.
        Le vedi solo tu e il tuo coach.
      </p>
    </div>
  )
}

/* ============================================================
   Le foto di una misurazione già salvata.
   ============================================================ */
export function Galleria({ foto, urls, userId, measurementId, canDelete, onCambio }) {
  const [aperta, setAperta] = useState(null)   // indice della foto a schermo intero
  const [caricando, setCaricando] = useState(null)
  const toast = useToast()

  async function aggiungi(e) {
    const scelti = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!scelti.length) return

    const spazio = MAX_FOTO - foto.length
    if (spazio <= 0) return toast.info(`Questa misurazione ha già ${MAX_FOTO} foto.`)
    const daCaricare = scelti.slice(0, spazio)

    try {
      await caricaFoto(daCaricare, {
        userId,
        measurementId,
        daPosizione: foto.length + 1,
        onProgresso: (i, tot) => setCaricando(tot > 1 ? `le foto ${i} di ${tot}` : 'la foto'),
      })
      toast.ok(daCaricare.length === 1 ? 'Foto aggiunta' : `${daCaricare.length} foto aggiunte`)
      onCambio()
    } catch (err) {
      toast.err(err)
    } finally {
      setCaricando(null)
    }
  }

  if (!foto.length && !canDelete) return null

  return (
    <>
      {foto.length > 0 && (
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {foto.map((f, i) => (
            <li key={f.id}>
              <button onClick={() => setAperta(i)} className="block w-full" aria-label={`Apri la foto ${i + 1}`}>
                {urls[f.path] ? (
                  <img src={urls[f.path]} alt="" loading="lazy"
                       className="aspect-square w-full rounded-xl border border-line object-cover" />
                ) : (
                  <span className="block aspect-square w-full animate-pulse rounded-xl bg-canvas" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {canDelete && (
        <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-muted">
          {caricando !== null ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-brand" />
              Carico {caricando}…
            </>
          ) : (
            <>
              <IconPlus width={15} height={15} />
              {foto.length ? 'Aggiungi foto' : 'Allega delle foto'}
            </>
          )}
          <input type="file" accept="image/*" multiple className="hidden"
                 onChange={aggiungi} disabled={caricando !== null} />
        </label>
      )}

      {aperta !== null && (
        <Visualizzatore
          foto={foto} urls={urls} inizio={aperta} canDelete={canDelete}
          onClose={() => setAperta(null)} onEliminata={onCambio}
        />
      )}
    </>
  )
}

/* ============================================================
   Schermo intero. Lo scorrimento fra le foto è quello nativo del browser
   (scroll-snap): sul telefono scorre come la galleria di sistema.
   ============================================================ */
function Visualizzatore({ foto, urls, inizio, canDelete, onClose, onEliminata }) {
  const [i, setI] = useState(inizio)
  const [busy, setBusy] = useState(false)
  const strip = useRef(null)
  const toast = useToast()
  const chiedi = useConfirm()

  useEffect(() => {
    const el = strip.current
    if (el) el.scrollTo({ left: el.clientWidth * inizio })
    const h = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    const sblocca = bloccaScroll()
    return () => { document.removeEventListener('keydown', h); sblocca() }
  }, [inizio, onClose])

  function scorri(e) {
    const el = e.currentTarget
    setI(Math.round(el.scrollLeft / el.clientWidth))
  }

  async function elimina() {
    const ok = await chiedi({
      title: 'Elimino questa foto?',
      body: 'Viene cancellata anche dallo spazio di archiviazione. Non si recupera.',
      conferma: 'Elimina la foto',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await eliminaFoto(foto[i].id)
      toast.ok('Foto eliminata')
      onClose(); onEliminata()
    } catch (err) {
      toast.err(err)
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pb-2 pt-[calc(env(safe-area-inset-top)+12px)] text-white">
        <span className="stat text-[17px]">{i + 1} / {foto.length}</span>
        <button onClick={onClose} className="-mr-2 p-2" aria-label="Chiudi">
          <IconClose width={24} height={24} />
        </button>
      </div>

      <div ref={strip} onScroll={scorri}
           className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden">
        {foto.map((f) => (
          <div key={f.id} className="flex w-full shrink-0 snap-center items-center justify-center px-2">
            {urls[f.path] && <img src={urls[f.path]} alt="" className="max-h-full max-w-full object-contain" />}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
        <span className="text-[13px] text-white/50">
          {new Date(foto[i]?.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        {canDelete && (
          <button onClick={elimina} disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[14px] font-medium text-white/80">
            <IconTrash width={17} height={17} /> Elimina
          </button>
        )}
      </div>
    </div>
  )
}
