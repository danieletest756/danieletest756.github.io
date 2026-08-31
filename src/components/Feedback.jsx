import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Modal, IconCheck, IconInfo, IconWarning } from './ui'

/*
  Sostituisce alert() e confirm() del browser, che in palestra hanno due difetti seri:
  bloccano la pagina finché non tocchi OK, e con l'app installata sulla home di iOS
  vengono ignorati del tutto (il pulsante sembra rotto).

    const toast = useToast()          toast.ok('Seduta salvata')
    const chiedi = useConfirm()       if (!await chiedi({ ... })) return
*/

const FeedbackCtx = createContext(null)

export const useToast = () => useContext(FeedbackCtx).toast
export const useConfirm = () => useContext(FeedbackCtx).confirm

let seq = 0

export function FeedbackProvider({ children }) {
  const [avvisi, setAvvisi] = useState([])
  const [dialogo, setDialogo] = useState(null)
  const rispondi = useRef(null)

  const chiudiAvviso = useCallback((id) => {
    setAvvisi((l) => l.filter((a) => a.id !== id))
  }, [])

  const push = useCallback((tipo, testo, durata) => {
    if (!testo) return
    const id = ++seq
    setAvvisi((l) => [...l, { id, tipo, testo }])
    setTimeout(() => chiudiAvviso(id), durata)
  }, [chiudiAvviso])

  const toast = useMemo(() => ({
    ok:   (t) => push('ok', t, 3500),
    info: (t) => push('info', t, 4000),
    // gli errori restano più a lungo: c'è da leggerli, non solo da vederli
    err:  (t) => push('err', traduciErrore(t), 6500),
  }), [push])

  const confirm = useCallback((opzioni) => new Promise((resolve) => {
    rispondi.current = resolve
    setDialogo({ conferma: 'Conferma', annulla: 'Annulla', ...opzioni })
  }), [])

  const risolvi = useCallback((scelta) => {
    setDialogo(null)
    rispondi.current?.(scelta)
    rispondi.current = null
  }, [])

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  return (
    <FeedbackCtx.Provider value={value}>
      {children}

      {/* In alto: le finestre a scomparsa si aprono dal basso e lì ci sono i pulsanti */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2
                      px-3 pt-[calc(env(safe-area-inset-top)+10px)]">
        {avvisi.map((a) => (
          <Avviso key={a.id} {...a} onClose={() => chiudiAvviso(a.id)} />
        ))}
      </div>

      {/* sopra il visualizzatore delle foto, che occupa già tutto lo schermo a z-50 */}
      <Modal open={!!dialogo} onClose={() => risolvi(false)} title={dialogo?.title} z="z-[55]">
        {dialogo && (
          <>
            {dialogo.body && (
              <p className="-mt-1 mb-5 text-[15px] leading-relaxed text-muted">{dialogo.body}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => risolvi(true)}
                className={dialogo.danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}
                autoFocus
              >
                {dialogo.conferma}
              </button>
              <button onClick={() => risolvi(false)} className="btn-ghost flex-1">
                {dialogo.annulla}
              </button>
            </div>
          </>
        )}
      </Modal>
    </FeedbackCtx.Provider>
  )
}

const STILI = {
  ok:   { cls: 'bg-good text-white',   Icon: IconCheck,   ruolo: 'status' },
  info: { cls: 'bg-ink text-white',    Icon: IconInfo,    ruolo: 'status' },
  err:  { cls: 'bg-bad text-white',    Icon: IconWarning, ruolo: 'alert' },
}

function Avviso({ tipo, testo, onClose }) {
  const { cls, Icon, ruolo } = STILI[tipo] ?? STILI.info
  return (
    <div
      role={ruolo}
      onClick={onClose}
      className={`animate-toast pointer-events-auto flex w-full max-w-md cursor-pointer items-start gap-2.5
                  rounded-xl px-4 py-3 shadow-lg ${cls}`}
    >
      <Icon width={19} height={19} className="mt-px shrink-0" />
      <span className="text-[14.5px] font-medium leading-snug">{testo}</span>
    </div>
  )
}

/*
  I messaggi di Supabase arrivano in inglese e da database. Qui diventano frasi che
  dicono all'utente cosa è successo davvero, così non serve leggere "violates policy".
*/
export function traduciErrore(e) {
  const m = typeof e === 'string' ? e : e?.message || ''
  if (!m) return 'Non sono riuscito a completare l\'operazione.'

  if (/row-level security|violates row-level/i.test(m))
    return 'Non hai i permessi per modificare questo dato. Scheda e dieta le cambia solo il coach.'
  if (/Failed to fetch|NetworkError|network/i.test(m))
    return 'Connessione assente. Il dato non è stato salvato: riprova quando torna la linea.'
  if (/JWT|token|session/i.test(m))
    return 'La sessione è scaduta. Esci e rientra nell\'account.'
  if (/duplicate key|already exists/i.test(m))
    return 'Questo elemento esiste già.'
  if (/Payload too large|exceeded the maximum|too large/i.test(m))
    return 'Il file è troppo grande. Riprova con una foto più leggera.'
  if (/violates foreign key/i.test(m))
    return 'Manca un collegamento: ricarica la pagina e riprova.'
  if (/violates not-null|null value in column/i.test(m))
    return 'Manca un campo obbligatorio.'
  return m
}
