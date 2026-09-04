import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { IconDumbbell, IconPlate, IconRuler, IconChart, IconUser, IconTeam } from './ui'
import { Sfumatura } from './Decor'

const tabs = [
  { to: '/allenamento', label: 'Scheda',    Icon: IconDumbbell },
  { to: '/dieta',       label: 'Dieta',     Icon: IconPlate },
  { to: '/misure',      label: 'Misure',    Icon: IconRuler },
  { to: '/progressi',   label: 'Progressi', Icon: IconChart },
  { to: '/profilo',     label: 'Profilo',   Icon: IconUser },
]

/*
  Intestazione e barra in basso non sono più "sticky"/"fixed" rispetto al
  viewport: su alcuni browser mobili quel trucco può cedere (la barra scorre
  via insieme al contenuto). Qui invece è tutta la pagina a essere un blocco
  flex a tutta altezza: header e nav prendono lo spazio che gli serve, <main>
  si prende il resto e scorre al suo interno. Così la barra non è "ancorata al
  viewport mentre il resto scorre attorno": è semplicemente fuori dalla zona
  che scorre, e non può scapparne.
*/
export default function Layout() {
  const { profile, isGod, viewing, setViewing } = useAuth()
  const navigate = useNavigate()
  const items = isGod ? [...tabs, { to: '/atleti', label: 'Atleti', Icon: IconTeam }] : tabs

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative shrink-0 overflow-hidden border-b border-line/70 bg-canvas/90 backdrop-blur">
        <Sfumatura opacita={0.12} className="-right-6 -top-10 h-24 w-24" />
        <div className="relative mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="leading-tight">
            <p className="font-cond text-[21px] font-semibold">
              {viewing ? viewing.full_name || viewing.email : 'La tua scheda'}
            </p>
            <p className="text-[13px] text-muted">
              {viewing ? 'stai modificando questo atleta' : profile?.full_name || profile?.email}
            </p>
          </div>
          {viewing && (
            <button
              onClick={() => { setViewing(null); navigate('/atleti') }}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium"
            >
              Esci
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pb-6 pt-5">
        <Outlet />
      </main>

      <nav className="shrink-0 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl pb-[env(safe-area-inset-bottom)]">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-brand' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-lg px-3 py-1 ${isActive ? 'bg-brandsoft' : ''}`}>
                    <Icon width={21} height={21} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
