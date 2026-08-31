import { supabase } from './supabase'
import { comprimiImmagine } from './immagini'

const BUCKET = 'progress-photos'
const DURATA_LINK = 3600   // un'ora: il tempo di guardarle, poi il link scade da solo

/*
  Il bucket è privato. Il percorso comincia sempre con l'id dell'atleta perché è
  quello che le policy di Supabase confrontano: <atleta>/<misurazione>/<file>.
*/
const percorso = (userId, measurementId, i) =>
  `${userId}/${measurementId}/${Date.now()}-${i}.jpg`

/** Comprime e carica un gruppo di foto, poi registra le righe. Ritorna quelle inserite. */
export async function caricaFoto(files, { userId, measurementId, daPosizione = 1, onProgresso }) {
  const caricate = []

  for (let i = 0; i < files.length; i++) {
    onProgresso?.(i + 1, files.length)

    const compressa = await comprimiImmagine(files[i])
    const path = percorso(userId, measurementId, i)

    const { error } = await supabase.storage.from(BUCKET)
      .upload(path, compressa, { contentType: 'image/jpeg', upsert: false })
    if (error) throw error

    caricate.push({
      measurement_id: measurementId,
      user_id: userId,
      path,
      position: daPosizione + i,
    })
  }

  if (!caricate.length) return []

  const { data, error } = await supabase.from('measurement_photos').insert(caricate).select()
  if (error) {
    // La riga non è entrata: non lasciamo i file a occupare spazio per niente
    await supabase.storage.from(BUCKET).remove(caricate.map((c) => c.path))
    throw error
  }
  return data ?? []
}

/** Link temporanei per mostrare le foto: { path: url }. Una sola chiamata per tutte. */
export async function urlFirmati(paths) {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, DURATA_LINK)
  if (error) return {}
  const mappa = {}
  ;(data ?? []).forEach((r) => { if (r.signedUrl && !r.error) mappa[r.path] = r.signedUrl })
  return mappa
}

/** Toglie la riga: il file lo porta via il trigger cleanup_photo_file sul database. */
export async function eliminaFoto(id) {
  const { error } = await supabase.from('measurement_photos').delete().eq('id', id)
  if (error) throw error
}
