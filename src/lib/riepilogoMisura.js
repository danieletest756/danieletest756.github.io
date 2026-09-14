/*
  Immagine PNG riassuntiva di UNA misurazione (non le foto: quelle hanno già il
  loro export in esportaFoto.js). Pensata per essere condivisa da telefono
  (WhatsApp, Messaggi, salvata in galleria): niente libreria PDF in più, solo
  canvas nativo, coerente con la compressione già fatta a mano in immagini.js.
*/

const LARGHEZZA = 1000
const MARGINE = 56
const RIGA_CAMPO = 76

const COLORE = {
  brand: '#1F4FD8',
  ink: '#101A2B',
  muted: '#5D6C85',
  linea: '#E4E9F2',
  buono: '#1B7F5A',
}

function nuovoCanvas(w, h) {
  const scala = Math.min(2, window.devicePixelRatio || 2)
  const c = document.createElement('canvas')
  c.width = Math.round(w * scala)
  c.height = Math.round(h * scala)
  const ctx = c.getContext('2d')
  ctx.scale(scala, scala)
  return { c, ctx }
}

function spezzaRighe(ctx, testo, maxWidth) {
  const parole = testo.split(/\s+/)
  const righe = []
  let riga = ''
  for (const parola of parole) {
    const prova = riga ? `${riga} ${parola}` : parola
    if (riga && ctx.measureText(prova).width > maxWidth) {
      righe.push(riga)
      riga = parola
    } else {
      riga = prova
    }
  }
  if (riga) righe.push(riga)
  return righe
}

/*
  `righe`: [{ label, valore, unita, delta }] — delta già formattato come testo
  ("+1.2 cm") oppure null/undefined se non c'è una misurazione precedente.
*/
export async function generaImmagineMisurazione({ nomeAtleta, dataLabel, righe, note }) {
  const largMisura = LARGHEZZA - MARGINE * 2

  // Un canvas piccolo, usa e getta, solo per misurare quante righe occupa la nota
  const { ctx: ctxMisura } = nuovoCanvas(10, 10)
  ctxMisura.font = '400 25px Inter, system-ui, sans-serif'
  const righeNota = note ? spezzaRighe(ctxMisura, note, largMisura) : []

  const altezzaHeader = 168
  const altezzaCampi = righe.length * RIGA_CAMPO + 40
  const altezzaNota = righeNota.length ? 66 + righeNota.length * 34 : 0
  const altezza = altezzaHeader + altezzaCampi + altezzaNota + MARGINE

  const { c: canvas, ctx } = nuovoCanvas(LARGHEZZA, altezza)

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, LARGHEZZA, altezza)

  // Intestazione
  ctx.fillStyle = COLORE.brand
  ctx.fillRect(0, 0, LARGHEZZA, altezzaHeader)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 44px "Barlow Condensed", Inter, system-ui, sans-serif'
  ctx.fillText(nomeAtleta || 'Le mie misure', MARGINE, 78)
  ctx.font = '500 25px Inter, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,.88)'
  ctx.fillText(dataLabel, MARGINE, 118)

  // Campi misurati
  let y = altezzaHeader + 54
  righe.forEach(({ label, valore, unita, delta }, i) => {
    ctx.fillStyle = COLORE.muted
    ctx.font = '500 23px Inter, system-ui, sans-serif'
    ctx.fillText(label, MARGINE, y)

    ctx.fillStyle = COLORE.ink
    ctx.font = '600 36px "Barlow Condensed", Inter, system-ui, sans-serif'
    const testoValore = `${valore} ${unita}`
    ctx.fillText(testoValore, MARGINE, y + 36)
    const largValore = ctx.measureText(testoValore).width

    if (delta) {
      ctx.font = '500 21px Inter, system-ui, sans-serif'
      ctx.fillStyle = COLORE.buono
      ctx.fillText(delta, MARGINE + largValore + 16, y + 33)
    }

    if (i < righe.length - 1) {
      ctx.strokeStyle = COLORE.linea
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(MARGINE, y + 52)
      ctx.lineTo(LARGHEZZA - MARGINE, y + 52)
      ctx.stroke()
    }

    y += RIGA_CAMPO
  })

  // Note
  if (righeNota.length) {
    y += 14
    ctx.fillStyle = COLORE.muted
    ctx.font = '500 21px Inter, system-ui, sans-serif'
    ctx.fillText('Note', MARGINE, y)
    y += 34
    ctx.fillStyle = COLORE.ink
    ctx.font = '400 25px Inter, system-ui, sans-serif'
    righeNota.forEach((riga) => { ctx.fillText(riga, MARGINE, y); y += 34 })
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
