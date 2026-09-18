/*
  Formato testo semplice per importare una scheda — l'alternativa "non
  convince" al JSON: niente parentesi né virgolette, ogni riga si legge da
  sola. Restituisce la stessa forma che si aspetta importaScheda(userId, dati),
  quindi la parte che scrive sul database resta un'unica versione, condivisa.

  Vedi templates/scheda_allenamento_import.txt per il template completo con le
  istruzioni da dare a un'IA insieme al PDF di un atleta.

    Titolo: ...
    Descrizione: ... (facoltativa)
    Durata: 8

    Giorno: ...
    Nota: ... (facoltativa)
    - Nome esercizio | 3 serie | 8-10 rip | RIR 2 | 90 rec | nota libera

  I pezzi dopo il nome (separati da "|") possono stare in qualunque ordine:
  si riconoscono dalla parola scritta vicino al numero ("serie", "rip", "rir",
  "rec"/"recupero"), non dalla posizione. Un gruppo muscolare (Petto, Dorso...)
  si riconosce da solo. Qualunque pezzo che non si riconosce diventa una nota
  libera sull'esercizio, invece di far fallire l'importazione.
*/

const GRUPPI = [
  'Quadricipiti', 'Femorali', 'Glutei', 'Polpacci', 'Petto',
  'Dorso', 'Spalle', 'Braccia', 'Core', 'Cardio',
]

const estraiNumero = (testo) => testo.match(/\d+(\.\d+)?/)?.[0] ?? null

function interpretaSegmento(segmento, es) {
  const s = segmento.trim()
  if (!s) return
  const lower = s.toLowerCase()

  const gruppo = GRUPPI.find((g) => g.toLowerCase() === lower)
  if (gruppo) { es.gruppo_muscolare = gruppo; return }

  if (lower.startsWith('rir')) { es.rir = s.replace(/rir/i, '').trim() || null; return }
  if (/rec|recupero/.test(lower)) { es.recupero_sec = estraiNumero(s) ? Number(estraiNumero(s)) : null; return }
  if (/serie|set/.test(lower)) { es.serie = s.replace(/serie|set/gi, '').trim(); return }
  if (/rip|reps?/.test(lower)) { es.ripetizioni = s.replace(/ripetizioni|rip|reps?/gi, '').trim(); return }

  // pezzo non riconosciuto: nota libera, non un errore
  es.note = es.note ? `${es.note} ${s}` : s
}

export function leggiSchedaTesto(testo) {
  const dati = { titolo: '', descrizione: null, durata_settimane: 8, giorni: [] }
  let giornoCorrente = null
  const descrizioneRighe = []

  for (const rigaGrezza of testo.split(/\r?\n/)) {
    const riga = rigaGrezza.trim()
    if (!riga || riga.startsWith('#')) continue   // righe vuote e commenti: ignorate

    let m
    if (!giornoCorrente && (m = riga.match(/^titolo\s*:\s*(.+)$/i))) { dati.titolo = m[1].trim(); continue }
    if (!giornoCorrente && (m = riga.match(/^durata\s*:\s*(\d+)/i))) { dati.durata_settimane = Number(m[1]); continue }
    if (!giornoCorrente && (m = riga.match(/^descrizione\s*:\s*(.*)$/i))) {
      if (m[1]) descrizioneRighe.push(m[1]); continue
    }

    if ((m = riga.match(/^giorno\s*:\s*(.+)$/i))) {
      giornoCorrente = { titolo: m[1].trim(), note: null, esercizi: [] }
      dati.giorni.push(giornoCorrente)
      continue
    }

    if (giornoCorrente && (m = riga.match(/^nota\s*:\s*(.+)$/i))) { giornoCorrente.note = m[1].trim(); continue }

    if (giornoCorrente && (m = riga.match(/^[-•]\s*(.+)$/))) {
      const parti = m[1].split('|')
      const nome = parti[0].trim()
      if (!nome) continue
      const es = { nome, gruppo_muscolare: null, serie: null, ripetizioni: null, rir: null, recupero_sec: null, note: null }
      parti.slice(1).forEach((seg) => interpretaSegmento(seg, es))
      giornoCorrente.esercizi.push(es)
      continue
    }

    // riga fuori formato prima del primo giorno: la teniamo come descrizione
    // invece di scartarla, così un testo scritto un po' a mano non va perso
    if (!giornoCorrente) descrizioneRighe.push(riga)
  }

  if (descrizioneRighe.length) {
    dati.descrizione = dati.descrizione ? `${dati.descrizione}\n${descrizioneRighe.join('\n')}` : descrizioneRighe.join('\n')
  }
  if (!dati.titolo) throw new Error('Manca la riga "Titolo: ...".')
  if (!dati.giorni.length) throw new Error('Manca almeno un giorno (una riga "Giorno: ...").')
  return dati
}
