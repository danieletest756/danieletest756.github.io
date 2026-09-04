import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Profilo from './pages/Profilo'
const Misure = lazy(() => import('./pages/Misure'))
const Progressi = lazy(() => import('./pages/Progressi'))
import Allenamento from './pages/Allenamento'
import Dieta from './pages/Dieta'
const Atleti = lazy(() => import('./pages/Atleti'))
const Esercizi = lazy(() => import('./pages/Esercizi'))
import { Spinner } from './components/ui'

export default function App() {
  const { session, profile, loading, isGod } = useAuth()

  if (loading) return <div className="min-h-dvh"><Spinner label="Un attimo…" /></div>
  if (!session) return <Login />
  if (!profile) return <Spinner label="Preparo il profilo…" />

  return (
    <Suspense fallback={<Spinner />}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/allenamento" element={<Allenamento />} />
        <Route path="/dieta" element={<Dieta />} />
        <Route path="/misure" element={<Misure />} />
        <Route path="/progressi" element={<Progressi />} />
        <Route path="/profilo" element={<Profilo />} />
        {isGod && <Route path="/atleti" element={<Atleti />} />}
        {isGod && <Route path="/esercizi" element={<Esercizi />} />}
        <Route path="*" element={<Navigate to={isGod ? '/atleti' : '/allenamento'} replace />} />
      </Route>
    </Routes>
    </Suspense>
  )
}
