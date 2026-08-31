/*
  Compressione delle foto prima di caricarle, fatta nel telefono.

  Una foto scattata con un telefono recente pesa 3-5 MB: il piano gratuito di Supabase
  ne conterrebbe circa 250 in tutto. Ridotte a 1600px di lato lungo in JPEG scendono
  intorno ai 250 KB — stesso identico uso per confrontare i progressi, ma ce ne stanno
  qualche migliaio e si caricano anche con la linea della palestra.

  Niente librerie: canvas e basta.
*/

const MAX_LATO = 1600
const QUALITA = 0.82

export async function comprimiImmagine(file, { maxLato = MAX_LATO, qualita = QUALITA } = {}) {
  const bitmap = await leggi(file)
  const { width, height } = bitmap

  const scala = Math.min(1, maxLato / Math.max(width, height))
  const w = Math.round(width * scala)
  const h = Math.round(height * scala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', qualita))
  if (!blob) throw new Error('Non sono riuscito a leggere questa immagine.')

  // Se comprimere non è servito (immagine già piccola), tengo l'originale
  return blob.size < file.size ? blob : file
}

/*
  Le foto scattate in verticale portano la rotazione nei metadati EXIF: disegnandole
  su canvas senza tenerne conto uscirebbero coricate. createImageBitmap la applica,
  l'elemento <img> fa lo stesso nei browser recenti e copre i casi in cui manca.
*/
async function leggi(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch { /* browser vecchio: sotto c'è la strada alternativa */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    // l'immagine è già disegnata sul canvas quando questo viene revocato
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

/** "1,2 MB", "312 kB" — per dire all'utente quanto sta caricando */
export const peso = (byte) =>
  byte >= 1024 * 1024
    ? `${(byte / 1024 / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`
    : `${Math.round(byte / 1024)} kB`
