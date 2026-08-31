import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')      // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState(null)           // { type, text }
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } },
        })
        if (error) throw error
        setMsg({ type: 'ok', text: 'Account creato. Controlla la mail per confermare l\'indirizzo, poi accedi.' })
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMsg({ type: 'err', text: traduci(err.message) })
    } finally { setBusy(false) }
  }

  async function google() {
    setBusy(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setMsg({ type: 'err', text: traduci(error.message) }); setBusy(false) }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="font-cond text-[46px] font-bold leading-[0.95] text-white">
            Allenamento<br />e alimentazione
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            La tua scheda, i carichi che stai usando e i macro del giorno, tutto in un posto.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-5 shadow-card">
          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <label className="block">
                <span className="label">Nome e cognome</span>
                <input className="field" value={name} onChange={(e) => setName(e.target.value)}
                       autoComplete="name" required />
              </label>
            )}
            <label className="block">
              <span className="label">Email</span>
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     autoComplete="email" required />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                     minLength={6} required />
            </label>

            {msg && (
              <p className={`rounded-xl px-3 py-2.5 text-sm ${
                msg.type === 'ok' ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`}>
                {msg.text}
              </p>
            )}

            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Un attimo…' : mode === 'login' ? 'Entra' : 'Crea account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />oppure<span className="h-px flex-1 bg-line" />
          </div>

          <button onClick={google} disabled={busy} className="btn-ghost w-full">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#4285F4" d="M45 24.5c0-1.6-.1-2.7-.4-4H24v7.5h12c-.2 2-1.6 5-4.6 7l7 5.4c4.1-3.8 6.6-9.4 6.6-15.9z"/>
              <path fill="#34A853" d="M24 46c6 0 11-2 14.7-5.4l-7-5.4c-1.9 1.3-4.4 2.2-7.7 2.2-5.9 0-10.9-3.9-12.7-9.3l-7.2 5.6C7.7 41 15.2 46 24 46z"/>
              <path fill="#FBBC05" d="M11.3 28.1c-.5-1.4-.7-2.9-.7-4.1s.3-2.8.7-4.1l-7.2-5.6C2.7 17.2 2 20.5 2 24s.8 6.8 2.1 9.7z"/>
              <path fill="#EA4335" d="M24 10.2c3.3 0 6.2 1.2 8.5 3.3l6.3-6.3C35 3.6 30 1.5 24 1.5 15.2 1.5 7.7 6.5 4.1 14.3l7.2 5.6C13.1 14.4 18.1 10.2 24 10.2z"/>
            </svg>
            Continua con Google
          </button>

          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? 'Primo accesso?' : 'Hai già un account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }}
              className="font-semibold text-brand"
            >
              {mode === 'login' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-white/45">
          Dopo la registrazione il tuo coach ti assegna scheda e piano alimentare.
        </p>
      </div>
    </div>
  )
}

function traduci(m = '') {
  if (m.includes('Invalid login credentials')) return 'Email o password non corrette.'
  if (m.includes('Email not confirmed')) return 'Devi prima confermare l\'email che ti abbiamo inviato.'
  if (m.includes('User already registered')) return 'Questa email è già registrata: accedi.'
  if (m.includes('at least 6')) return 'La password deve avere almeno 6 caratteri.'
  return m
}
