import { supabase } from './supabase'
import { urlFirmati } from './foto'

/*
  Scarica in un unico zip tutte le foto delle misurazioni di tutti gli atleti,
  una cartella per atleta e una sottocartella per data di misurazione.
  Solo per il coach: la query legge measurement_photos senza filtrare per
  user_id, e le policy RLS lo permettono solo a is_god().

  jszip si carica solo quando questa funzione viene chiamata (import
  dinamico): gli atleti non la scaricano mai, la usa solo il coach.
*/
export async function esportaTutteLeFoto(onProgresso) {
  const { data, error } = await supabase.from('measurement_photos')
    .select('path, position, measurement:measurements(date, user_id, profiles:user_id(full_name, email))')
    .order('path')
  if (error) throw error

  const foto = data ?? []
  if (!foto.length) return null

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const urls = await urlFirmati(foto.map((f) => f.path))

  for (let i = 0; i < foto.length; i++) {
    const f = foto[i]
    onProgresso?.(i + 1, foto.length)

    const url = urls[f.path]
    if (!url) continue
    try {
      const blob = await fetch(url).then((r) => r.blob())
      const persona = f.measurement?.profiles
      const cartellaAtleta = pulisci(persona?.full_name || persona?.email || 'atleta sconosciuto')
      const cartellaData = f.measurement?.date || 'senza-data'
      zip.file(`${cartellaAtleta}/${cartellaData}/${String(f.position ?? i + 1).padStart(2, '0')}.jpg`, blob)
    } catch {
      // una foto persa (link scaduto, rete) non deve bloccare tutte le altre
    }
  }

  return zip.generateAsync({ type: 'blob' })
}

const pulisci = (s) => s.replace(/[\\/:*?"<>|]/g, '_').trim() || 'sconosciuto'

/*
  Zip delle foto di UNA sola misurazione: usato dal pulsante di download
  accanto a ogni misurazione in Misure.jsx. Non fa nessuna query: usa le foto
  e i link firmati già caricati dalla pagina (niente giri in più al database).
*/
export async function esportaFotoMisurazione(foto, urls) {
  if (!foto?.length) return null

  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  for (let i = 0; i < foto.length; i++) {
    const f = foto[i]
    const url = urls[f.path]
    if (!url) continue
    try {
      const blob = await fetch(url).then((r) => r.blob())
      zip.file(`${String(f.position ?? i + 1).padStart(2, '0')}.jpg`, blob)
    } catch {
      // una foto persa (link scaduto, rete) non deve bloccare le altre
    }
  }

  return zip.generateAsync({ type: 'blob' })
}
