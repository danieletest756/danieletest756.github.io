import { supabase } from './supabase'

/*
  Esporta tutti i dati di allenamento/progressi di un atleta (tutto tranne la
  dieta) in un vero file .xlsx: scheda attiva, storico carichi, misurazioni,
  check-in, obiettivi — un foglio per categoria, intestazioni in grassetto,
  colonne dimensionate, numeri e date come tali (non testo). Il secondo
  argomento (`da`) filtra le tre categorie che hanno una storia (carichi,
  misurazioni, check-in) da quella data in poi; Scheda e Obiettivi restano
  sempre completi perché non sono uno storico, sono lo stato attuale.

  Libreria: `exceljs`, non `xlsx`/SheetJS — quella ha due vulnerabilità ALTE su
  npm senza correzione disponibile (prototype pollution, ReDoS), scartata dopo
  averla provata in questa stessa sessione. `exceljs` ne ha una MODERATA in una
  dipendenza interna (`uuid`, un controllo mancante quando si passa un buffer
  personalizzato): qui non la tocchiamo mai, generiamo solo un file da dati
  nostri, nessun input esterno da parsare. Se in futuro cambi libreria,
  controlla `npm audit` di nuovo prima — è già capitato di dover tornare
  indietro una volta.
*/

const RIGA_INTESTAZIONE = 1

function foglio(wb, nome, colonne, righe) {
  const ws = wb.addWorksheet(nome, { views: [{ state: 'frozen', ySplit: RIGA_INTESTAZIONE }] })
  ws.columns = colonne
  ws.addRows(righe)
  ws.getRow(RIGA_INTESTAZIONE).eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4EBFC' } }   // brandsoft
  })
  return ws
}

/*
  `da`: data ISO ('YYYY-MM-DD') da cui includere i dati con una data (storico
  carichi, misurazioni, check-in), oppure null/undefined per tutta la storia.
  Scheda e Obiettivi non hanno una "storia" da filtrare — sono lo stato
  attuale — quindi restano sempre completi, qualunque intervallo si scelga.
*/
export async function esportaDatiAtleta(userId, da = null) {
  let queryLogs = supabase.from('workout_logs')
    .select('date, set_no, weight_kg, reps, rir, notes, item:workout_items(exercise:exercises(name))')
    .eq('user_id', userId).order('date')
  let queryMisure = supabase.from('measurements').select('*').eq('user_id', userId).order('date')
  let queryCheckins = supabase.from('checkins').select('*').eq('user_id', userId).order('date')
  if (da) {
    queryLogs = queryLogs.gte('date', da)
    queryMisure = queryMisure.gte('date', da)
    queryCheckins = queryCheckins.gte('date', da)
  }

  const [
    { data: piano },
    { data: logs },
    { data: misure },
    { data: checkins },
    { data: obiettivi },
  ] = await Promise.all([
    supabase.from('workout_plans').select('*')
      .eq('user_id', userId).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    queryLogs,
    queryMisure,
    queryCheckins,
    supabase.from('goals').select('*, esercizio:exercises(name)').eq('user_id', userId).order('created_at'),
  ])

  let righeScheda = []
  if (piano) {
    const { data: giorni } = await supabase.from('workout_days').select('*').eq('plan_id', piano.id).order('position')
    const idGiorni = (giorni ?? []).map((g) => g.id)
    const { data: voci } = idGiorni.length
      ? await supabase.from('workout_items').select('*, exercise:exercises(name, muscle_group)')
          .in('day_id', idGiorni).order('position')
      : { data: [] }
    const titoloGiorno = Object.fromEntries((giorni ?? []).map((g) => [g.id, g.title]))
    righeScheda = (voci ?? []).map((v) => ({
      giorno: titoloGiorno[v.day_id] ?? '',
      esercizio: v.exercise?.name ?? '',
      gruppo: v.exercise?.muscle_group ?? '',
      serie: v.sets ?? '',
      ripetizioni: v.reps ?? '',
      rir: v.rir ?? '',
      recupero: v.rest_sec ?? null,
      note: v.notes ?? '',
    }))
  }

  const righeLogs = (logs ?? []).map((l) => ({
    data: l.date,
    esercizio: l.item?.exercise?.name ?? '',
    serie: l.set_no,
    peso: l.weight_kg != null ? Number(l.weight_kg) : null,
    ripetizioni: l.reps ?? null,
    rir: l.rir != null ? Number(l.rir) : null,
    note: l.notes ?? '',
  }))

  const righeMisure = (misure ?? []).map((m) => ({
    data: m.date,
    peso: m.weight_kg != null ? Number(m.weight_kg) : null,
    petto: m.chest_cm != null ? Number(m.chest_cm) : null,
    vita: m.waist_cm != null ? Number(m.waist_cm) : null,
    fianchi: m.hips_cm != null ? Number(m.hips_cm) : null,
    coscia: m.thigh_cm != null ? Number(m.thigh_cm) : null,
    gluteo: m.glute_cm != null ? Number(m.glute_cm) : null,
    polpaccio: m.calf_cm != null ? Number(m.calf_cm) : null,
    note: m.notes ?? '',
  }))

  const righeCheckin = (checkins ?? []).map((c) => ({
    data: c.date,
    sonno: c.sleep_score ?? null,
    stress: c.stress_score ?? null,
    energia: c.energy_score ?? null,
    dolori: c.soreness_score ?? null,
    note: c.notes ?? '',
  }))

  const righeObiettivi = (obiettivi ?? []).map((g) => ({
    titolo: g.title,
    metrica: g.metric === 'exercise' ? (g.esercizio?.name ?? 'esercizio') : g.metric,
    partenza: g.start_value != null ? Number(g.start_value) : null,
    obiettivo: g.target_value != null ? Number(g.target_value) : null,
    scadenza: g.target_date ?? '',
    creato_il: g.created_at?.slice(0, 10) ?? '',
  }))

  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Atleti'
  wb.created = new Date()

  foglio(wb, 'Scheda', [
    { header: 'Giorno', key: 'giorno', width: 20 },
    { header: 'Esercizio', key: 'esercizio', width: 28 },
    { header: 'Gruppo muscolare', key: 'gruppo', width: 16 },
    { header: 'Serie', key: 'serie', width: 10 },
    { header: 'Ripetizioni', key: 'ripetizioni', width: 12 },
    { header: 'RIR', key: 'rir', width: 8 },
    { header: 'Recupero (sec)', key: 'recupero', width: 14 },
    { header: 'Note', key: 'note', width: 34 },
  ], righeScheda)

  foglio(wb, 'Storico carichi', [
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Esercizio', key: 'esercizio', width: 28 },
    { header: 'Serie n.', key: 'serie', width: 9 },
    { header: 'Peso (kg)', key: 'peso', width: 10 },
    { header: 'Ripetizioni', key: 'ripetizioni', width: 12 },
    { header: 'RIR', key: 'rir', width: 8 },
    { header: 'Note', key: 'note', width: 34 },
  ], righeLogs)

  foglio(wb, 'Misurazioni', [
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Peso (kg)', key: 'peso', width: 10 },
    { header: 'Petto (cm)', key: 'petto', width: 11 },
    { header: 'Vita (cm)', key: 'vita', width: 10 },
    { header: 'Fianchi (cm)', key: 'fianchi', width: 12 },
    { header: 'Coscia (cm)', key: 'coscia', width: 12 },
    { header: 'Metà gluteo (cm)', key: 'gluteo', width: 16 },
    { header: 'Polpaccio (cm)', key: 'polpaccio', width: 14 },
    { header: 'Note', key: 'note', width: 34 },
  ], righeMisure)

  foglio(wb, 'Check-in', [
    { header: 'Data', key: 'data', width: 12 },
    { header: 'Sonno (1-5)', key: 'sonno', width: 12 },
    { header: 'Stress (1-5)', key: 'stress', width: 12 },
    { header: 'Energia (1-5)', key: 'energia', width: 13 },
    { header: 'Dolori (1-5)', key: 'dolori', width: 12 },
    { header: 'Note', key: 'note', width: 34 },
  ], righeCheckin)

  foglio(wb, 'Obiettivi', [
    { header: 'Titolo', key: 'titolo', width: 28 },
    { header: 'Metrica', key: 'metrica', width: 18 },
    { header: 'Partenza', key: 'partenza', width: 10 },
    { header: 'Obiettivo', key: 'obiettivo', width: 10 },
    { header: 'Scadenza', key: 'scadenza', width: 12 },
    { header: 'Creato il', key: 'creato_il', width: 12 },
  ], righeObiettivi)

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
