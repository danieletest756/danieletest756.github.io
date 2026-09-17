// Edge Function: crea l'account di un atleta dal pannello del coach.
//
// Il frontend NON ha mai la chiave service_role (vedi CLAUDE.md): questa
// funzione gira sul server di Supabase, dove quella chiave è iniettata in modo
// sicuro come variabile d'ambiente, e la usa per creare l'utente al posto
// dell'atleta stesso (che oggi si registra da solo dalla schermata di accesso).
//
// Come si chiama dal frontend:
//   const { data, error } = await supabase.functions.invoke('create-athlete', {
//     body: { email, full_name },
//   })
//
// Chi può chiamarla: solo chi ha già un profilo con role = 'god'. Non ci si fida
// del frontend per questo controllo — lo rifacciamo qui, verificando il JWT di
// chi chiama con la chiave anonima, esattamente come farebbe una policy RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, full_name } = await req.json()
    if (!email || !email.includes('@')) throw new Error('Email non valida.')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // 1) Chi chiama deve essere il coach.
    const authHeader = req.headers.get('Authorization') ?? ''
    const utenteClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: sessione } = await utenteClient.auth.getUser()
    if (!sessione?.user) throw new Error('Non autenticato.')

    const { data: profilo } = await utenteClient
      .from('profiles').select('role').eq('id', sessione.user.id).single()
    if (profilo?.role !== 'god') throw new Error('Solo il coach può creare account atleta.')

    // 2) Creiamo l'utente e gli mandiamo subito l'invito via email per
    // impostare la propria password. Il trigger handle_new_user (schema.sql)
    // crea da solo la riga in profiles non appena l'utente esiste in auth.users.
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name || '' },
    })
    if (error) throw error

    return new Response(JSON.stringify({ ok: true, user_id: data.user?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
