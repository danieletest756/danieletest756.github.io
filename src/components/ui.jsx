import { useEffect } from 'react'
import { AccentoIntestazione } from './Decor'

/* ---------- Icone (SVG inline, niente dipendenze) ---------- */
const I = (p) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', ...p })

export const IconDumbbell = (p) => (
  <svg {...I(p)}><path d="M6.5 6.5v11M3 9v6M17.5 6.5v11M21 9v6M6.5 12h11" /></svg>
)
export const IconPlate = (p) => (
  <svg {...I(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3" /></svg>
)
export const IconRuler = (p) => (
  <svg {...I(p)}><path d="M3 8h18v8H3z" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></svg>
)
export const IconUser = (p) => (
  <svg {...I(p)}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
)
export const IconTeam = (p) => (
  <svg {...I(p)}><circle cx="9" cy="8" r="3" /><path d="M2.5 19a6.5 6.5 0 0 1 13 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 14.5a6 6 0 0 1 4 4.5" /></svg>
)
export const IconPlus = (p) => (<svg {...I(p)}><path d="M12 5v14M5 12h14" /></svg>)
export const IconChevron = (p) => (<svg {...I(p)}><path d="m9 6 6 6-6 6" /></svg>)
export const IconPlay = (p) => (<svg {...I(p)}><path d="m8 5 11 7-11 7z" /></svg>)
export const IconTrash = (p) => (<svg {...I(p)}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>)
export const IconEdit = (p) => (<svg {...I(p)}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" /></svg>)
export const IconBack = (p) => (<svg {...I(p)}><path d="M15 6 9 12l6 6" /></svg>)
export const IconCheck = (p) => (<svg {...I(p)}><path d="m5 13 4 4L19 7" /></svg>)
export const IconClose = (p) => (<svg {...I(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>)
export const IconInfo = (p) => (
  <svg {...I(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 7.6v.1" /></svg>
)
export const IconWarning = (p) => (
  <svg {...I(p)}><path d="M12 4.5 2.8 20h18.4z" /><path d="M12 10v4" /><path d="M12 17.4v.1" /></svg>
)
export const IconTimer = (p) => (
  <svg {...I(p)}><circle cx="12" cy="13.5" r="8" /><path d="M12 9.5v4.3l3 2" /><path d="M9.5 2h5M12 5.3V2" /></svg>
)
export const IconCamera = (p) => (
  <svg {...I(p)}>
    <path d="M3 8.5h3.2l1.4-2h7.8l1.4 2H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
)
export const IconChart = (p) => (
  <svg {...I(p)}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M3 20h18" /></svg>
)

/* ---------- Blocchi ---------- */
/** `accent`: vero (o "brand"/"saffron") disegna una sfumatura dietro al titolo.
    Usalo solo sul primo Section di una pagina, non su ogni sotto-sezione. */
export function Section({ title, action, accent, children }) {
  return (
    <section className="mb-7">
      {(title || action) && (
        <div className="relative mb-2.5 flex items-end justify-between gap-3">
          {accent && <AccentoIntestazione principale={accent === true ? 'brand' : accent} />}
          {title && <h2 className="font-cond text-[22px] font-semibold leading-none">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Empty({ title, hint, action, icon: Icon, children }) {
  return (
    <>
      <div className="card p-7 text-center">
        {Icon && (
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brandsoft text-brand">
            <Icon width={30} height={30} />
          </div>
        )}
        <p className="font-medium">{title}</p>
        {hint && <p className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p>}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
      {children}
    </>
  )
}

export function Field({ label, hint, ...props }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" {...props} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/* Quante finestre sono aperte: lo scroll della pagina si sblocca solo con l'ultima,
   altrimenti chiudere una conferma aperta sopra un form sbloccava lo sfondo. */
let aperte = 0

export function bloccaScroll() {
  aperte += 1
  document.body.style.overflow = 'hidden'
  return () => {
    aperte -= 1
    if (aperte === 0) document.body.style.overflow = ''
  }
}

/* `z` serve a chi deve comparire sopra qualcosa che è già a schermo intero:
   la conferma di eliminazione aperta dal visualizzatore delle foto, per esempio. */
export function Modal({ open, onClose, title, children, z = 'z-50' }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    const sblocca = bloccaScroll()
    return () => { document.removeEventListener('keydown', h); sblocca() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className={`fixed inset-0 ${z} flex items-end justify-center bg-ink/40 sm:items-center`} onClick={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-8 sm:max-w-lg sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" />
        {title && <h3 className="mb-4 font-cond text-[24px] font-semibold leading-none">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function Spinner({ label = 'Carico…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export const fmt = (n, unit = '') =>
  n === null || n === undefined || n === '' ? '—' : `${Number(n).toLocaleString('it-IT')}${unit}`
