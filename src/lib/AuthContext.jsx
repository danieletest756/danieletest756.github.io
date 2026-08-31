import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Quando il coach (god) sta guardando la scheda di un atleta, qui c'è il suo profilo
  const [viewing, setViewing] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s) await loadProfile(s.user.id)
      else { setProfile(null); setViewing(null) }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const isGod = profile?.role === 'god'
  // Di chi stiamo guardando i dati: l'atleta selezionato dal coach, oppure me stesso
  const target = isGod && viewing ? viewing : profile
  const targetId = target?.id ?? null
  const canEdit = isGod   // solo il coach modifica schede e diete

  const value = {
    session, profile, loading, isGod, viewing, setViewing, target, targetId, canEdit,
    refreshProfile: () => session && loadProfile(session.user.id),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
