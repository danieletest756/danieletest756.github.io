import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { IconDumbbell, IconPlate, IconRuler, IconUser, IconTeam } from './ui'

const tabs = [
  { to: '/allenamento', label: 'Scheda',  Icon: IconDumbbell },
  { to: '/dieta',       label: 'Dieta',   Icon: IconPlate },
  { to: '/misure',      label: 'Misure',  Icon: IconRuler },
  { to: '/profilo',     label: 'Profilo', Icon: IconUser },
]

export default function Layout() {
  const { profile, isGod, viewing, setViewing } = useAuth()
  const navigate = useNavigate()
  const items = isGod ? [...tabs, { to: '/atleti', label: 'Atleti', Icon: IconTeam }] : tabs

  return (
    <div className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
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

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
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
