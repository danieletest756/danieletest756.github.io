import { supabase } from './supabase'

/*
  Crea una scheda intera (giorni + esercizi) da un oggetto JSON, con le stesse
  query che farebbe un coach a mano dall'app — nessuna chiave speciale, nessun
  passaggio da Supabase: usa la sessione già autenticata di chi lo chiama (deve
  avere il permesso di scrittura su workout_plans, quindi coach o semi-god su
  se stesso, esattamente come per "Crea scheda").

  Forma attesa (vedi anche templates/scheda_allenamento_import.json):
  {
    "titolo": "...", "descrizione": "...", "durata_settimane": 8,
    "giorni": [
      { "titolo": "...", "note": "...", "esercizi": [
        { "nome": "...", "gruppo_muscolare": "...", "serie": "3", "ripetizioni": "8-10",
          "rir": "2", "recupero_sec": 90, "note": "..." }
      ] }
    ]
  }

  Gli esercizi si abbinano alla libreria condivisa per nome (senza distinguere
  maiuscole/minuscole): se un nome non esiste già, viene creato al volo — non
  serve controllare a mano se un esercizio esiste già prima di importare.
*/
export async function importaScheda(userId, dati) {
  if (!dati?.titolo) throw new Error('Manca il campo "titolo".')
  if (!Array.isArray(dati.giorni) || !dati.giorni.length) throw new Error('Manca "giorni" (deve essere un elenco non vuoto).')

  // Un piano nuovo disattiva quelli precedenti: stessa regola di ModalPiano.
  await supabase.from('workout_plans').update({ is_active: false })
    .eq('user_id', userId).eq('is_active', true)

  const { data: piano, error: erroreP } = await supabase.from('workout_plans').insert({
    user_id: userId,
    title: dati.titolo,
    description: dati.descrizione || null,
    weeks: dati.durata_settimane ? Number(dati.durata_settimane) : 8,
    is_active: true,
  }).select().single()
  if (erroreP) throw erroreP

  // Tutta la libreria in una query sola, per non farne una per ogni esercizio.
  const { data: esistenti } = await supabase.from('exercises').select('id,name')
  const perNome = new Map((esistenti ?? []).map((e) => [e.name.trim().toLowerCase(), e.id]))
  let nuoviEsercizi = 0

  async function idEsercizio(nome, gruppo) {
    const chiave = nome.trim().toLowerCase()
    if (perNome.has(chiave)) return perNome.get(chiave)
    const { data, error } = await supabase.from('exercises')
      .insert({ name: nome.trim(), muscle_group: gruppo || null }).select().single()
    if (error) throw error
    perNome.set(chiave, data.id)
    nuoviEsercizi += 1
    return data.id
  }

  let giorniCreati = 0
  let eserciziCreati = 0

  for (let i = 0; i < dati.giorni.length; i++) {
    const g = dati.giorni[i]
    const { data: giorno, error: erroreG } = await supabase.from('workout_days').insert({
      plan_id: piano.id, position: i + 1, title: g.titolo || `Giorno ${i + 1}`, notes: g.note || null,
    }).select().single()
    if (erroreG) throw erroreG
    giorniCreati += 1

    const voci = (g.esercizi ?? []).filter((e) => e?.nome)
    const righe = []
    for (const e of voci) {
      const exerciseId = await idEsercizio(e.nome, e.gruppo_muscolare)
      righe.push({
        day_id: giorno.id, exercise_id: exerciseId, position: righe.length + 1,
        sets: e.serie != null ? String(e.serie) : null,
        reps: e.ripetizioni != null ? String(e.ripetizioni) : null,
        rir: e.rir != null ? String(e.rir) : null,
        rest_sec: e.recupero_sec ? Number(e.recupero_sec) : null,
        notes: e.note || null,
      })
    }
    if (righe.length) {
      const { error: erroreI } = await supabase.from('workout_items').insert(righe)
      if (erroreI) throw erroreI
      eserciziCreati += righe.length
    }
  }

  return { giorni: giorniCreati, esercizi: eserciziCreati, nuoviEsercizi }
}
