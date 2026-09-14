import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Modal, Field, Spinner, IconChart, IconAward, IconTarget, IconPlus, IconEdit, IconTrash } from '../components/ui'
import { useToast, useConfirm } from '../components/Feedback'
import { urlFirmati } from '../lib/foto'
import GraficoAndamento from '../components/GraficoAndamento'
import IntestazioneFoto from '../components/IntestazioneFoto'
import fotoProgressi from '../assets/bg/progressi.jpg'

/* Non è un dato nuovo da registrare: è la messa in scena di quello che scheda,
   dieta e misure raccolgono già (gli Obiettivi sono l'unica eccezione: quelli
   il coach li scrive apposta). */

const formatoData = (d) => d.slice(8, 10) + '/' + d.slice(5, 7)
const formatoDataBreve = (d) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

// Stesse misure del corpo di Misure.jsx, tranne il peso: quello ha già il suo grafico.
const CAMPI_CORPO = [
  { k: 'chest_cm', l: 'Petto',       u: 'cm' },
  { k: 'waist_cm', l: 'Vita',        u: 'cm' },
  { k: 'hips_cm',  l: 'Fianchi',     u: 'cm' },
  { k: 'thigh_cm', l: 'Coscia',      u: 'cm' },
  { k: 'glute_cm', l: 'Metà gluteo', u: 'cm' },
  { k: 'calf_cm',  l: 'Polpaccio',   u: 'cm' },
]

// Le metriche che un obiettivo può inseguire: le stesse misure del corpo, più il
// peso, più "carico in un esercizio" (che invece guarda i record di workout_logs).
const METRICHE = [
  { v: 'weight_kg', l: 'Peso',                u: 'kg' },
  ...CAMPI_CORPO.map((c) => ({ v: c.k, l: c.l, u: c.u })),
  { v: 'exercise',  l: 'Carico in un esercizio', u: 'kg' },
]

const ultimoValore = (misure, campo) => {
  for (let i = misure.length - 1; i >= 0; i--) {
    if (misure[i][campo] != null) return Number(misure[i][campo])
  }
  return null
}

export default function Progressi() {
  const { targetId, canEdit } = useAuth()
  const [stato, setStato] = useState('carico')   // carico | pronto
  const [misure, setMisure] = useState([])
  const [pesoSerie, setPesoSerie] = useState([])
  const [pesoAttuale, setPesoAttuale] = useState(null)
  const [deltaPeso, setDeltaPeso] = useState(null)
  const [misureCorpo, setMisureCorpo] = useState({})   // { chest_cm: [{data, valore}], ... }
  const [misuraCorpoScelta, setMisuraCorpoScelta] = useState('')
  const [carichi, setCarichi] = useState({})     // { nomeEsercizio: [{data, peso}] }
  const [esercizioScelto, setEsercizioScelto] = useState('')
  const [recordPersonali, setRecordPersonali] = useState([])
  const [recordPorId, setRecordPorId] = useState({})   // { exercise_id: pesoMax }
  const [sedute30, setSedute30] = useState(0)
  const [primaFoto, setPrimaFoto] = useState(null)
  const [ultimaFoto, setUltimaFoto] = useState(null)
  const [urls, setUrls] = useState({})
  const [obiettivi, setObiettivi] = useState([])
  const [modaleObiettivo, setModaleObiettivo] = useState(null)   // null chiuso | {} nuovo | goal esistente
  const toast = useToast()
  const chiedi = useConfirm()

  const caricaObiettivi = async () => {
    if (!targetId) return
    const { data } = await supabase.from('goals')
      .select('*, esercizio:exercises(name)').eq('user_id', targetId).order('created_at')
    setObiettivi(data ?? [])
  }

  useEffect(() => {
    if (!targetId) return
    let annullato = false

    async function carica() {
      setStato('carico')

      const [{ data: misureData }, { data: log }, { data: goalsData }] = await Promise.all([
        supabase.from('measurements').select('*').eq('user_id', targetId).order('date'),
        supabase.from('workout_logs')
          .select('date, weight_kg, item:workout_items(exercise_id, exercise:exercises(name))')
          .eq('user_id', targetId).not('weight_kg', 'is', null).order('date'),
        supabase.from('goals').select('*, esercizio:exercises(name)').eq('user_id', targetId).order('created_at'),
      ])
      if (annullato) return

      const misureOrdinate = misureData ?? []
      setMisure(misureOrdinate)
      setObiettivi(goalsData ?? [])

      const pesiValidi = misureOrdinate.filter((r) => r.weight_kg != null)
      setPesoSerie(pesiValidi.map((r) => ({ data: formatoData(r.date), peso: Number(r.weight_kg) })))
      setPesoAttuale(pesiValidi.length ? Number(pesiValidi[pesiValidi.length - 1].weight_kg) : null)
      setDeltaPeso(
        pesiValidi.length > 1
          ? Math.round((Number(pesiValidi[pesiValidi.length - 1].weight_kg) - Number(pesiValidi[0].weight_kg)) * 10) / 10
          : null
      )

      const perCampo = {}
      CAMPI_CORPO.forEach(({ k }) => {
        perCampo[k] = misureOrdinate
          .filter((m) => m[k] != null)
          .map((m) => ({ data: formatoData(m.date), valore: Number(m[k]) }))
      })
      setMisureCorpo(perCampo)
      setMisuraCorpoScelta((prec) => (prec && (perCampo[prec]?.length ?? 0) > 1 ? prec : (
        CAMPI_CORPO.find((c) => (perCampo[c.k]?.length ?? 0) > 1)?.k ?? ''
      )))

      const perEsercizio = {}
      const record = {}
      const recordId = {}
      ;(log ?? []).forEach((l) => {
        const nome = l.item?.exercise?.name
        const peso = Number(l.weight_kg)
        if (nome) {
          ;(perEsercizio[nome] ||= []).push({ data: formatoData(l.date), peso })
          if (!record[nome] || peso >= record[nome].peso) record[nome] = { nome, peso, data: l.date }
        }
        const exId = l.item?.exercise_id
        if (exId && (recordId[exId] == null || peso > recordId[exId])) recordId[exId] = peso
      })
      setCarichi(perEsercizio)
      const nomi = Object.keys(perEsercizio)
      setEsercizioScelto((prec) => (prec && perEsercizio[prec] ? prec : (
        nomi.sort((a, b) => perEsercizio[b].length - perEsercizio[a].length)[0] ?? ''
      )))
      setRecordPersonali(
        Object.values(record)
          .sort((a, b) => b.peso - a.peso)
          .map((r) => ({ ...r, dataLabel: formatoDataBreve(r.data) }))
      )
      setRecordPorId(recordId)

      const soglia = new Date()
      soglia.setDate(soglia.getDate() - 30)
      setSedute30(new Set((log ?? []).filter((l) => new Date(l.date) >= soglia).map((l) => l.date)).size)

      // Foto: la più vecchia e la più recente fra le misurazioni che ne hanno almeno una
      const idsConData = new Map(misureOrdinate.map((m) => [m.id, m.date]))
      const idMisure = misureOrdinate.map((m) => m.id)
      let primaF = null, ultimaF = null
      if (idMisure.length) {
        const { data: foto } = await supabase.from('measurement_photos')
          .select('measurement_id, path').in('measurement_id', idMisure).eq('position', 1)
        const conData = (foto ?? [])
          .map((f) => ({ ...f, date: idsConData.get(f.measurement_id) }))
          .filter((f) => f.date)
          .sort((a, b) => a.date.localeCompare(b.date))
        if (conData.length >= 2) {
          primaF = conData[0]
          ultimaF = conData[conData.length - 1]
          setUrls(await urlFirmati([primaF.path, ultimaF.path]))
        }
      }
      if (annullato) return
      setPrimaFoto(primaF)
      setUltimaFoto(ultimaF)
      setStato('pronto')
    }

    carica()
    return () => { annullato = true }
  }, [targetId])

  if (!targetId || stato === 'carico') return <Spinner />

  const serieCarico = carichi[esercizioScelto] ?? []
  const nomiEsercizi = Object.keys(carichi).sort((a, b) => a.localeCompare(b, 'it'))
  const campoCorpoScelto = CAMPI_CORPO.find((c) => c.k === misuraCorpoScelta)
  const serieMisuraCorpo = misureCorpo[misuraCorpoScelta] ?? []
  const campiCorpoConDati = CAMPI_CORPO.filter((c) => (misureCorpo[c.k]?.length ?? 0) > 1)
  const recordInEvidenza = recordPersonali[0]

  function valoreAttualeObiettivo(g) {
    if (g.metric === 'exercise') return recordPorId[g.exercise_id] ?? null
    return ultimoValore(misure, g.metric)
  }

  async function eliminaObiettivo(g) {
    const ok = await chiedi({ title: 'Elimino questo obiettivo?', body: 'Non si torna indietro.', conferma: 'Elimina', danger: true })
    if (!ok) return
    const { error } = await supabase.from('goals').delete().eq('id', g.id)
    if (error) return toast.err(error)
    setObiettivi((prev) => prev.filter((x) => x.id !== g.id))
    toast.ok('Obiettivo eliminato')
  }

  const vuoto =
    pesoSerie.length < 2 && nomiEsercizi.length === 0 && !primaFoto &&
    recordPersonali.length === 0 && campiCorpoConDati.length === 0 && sedute30 === 0 && obiettivi.length === 0

  return (
    <>
      <IntestazioneFoto src={fotoProgressi} titolo="Progressi" />

      <Section>
        {vuoto ? (
          <Empty
            title="Non c'è ancora niente da vedere qui"
            hint="Registra qualche misurazione e qualche carico: appena ci sono almeno due punti nel tempo, qui comparirà il grafico."
            icon={IconChart}
          />
        ) : (
          <div className="space-y-4">
            {(obiettivi.length > 0 || canEdit) && (
              <div className="card p-5">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[13px] text-muted">
                    <IconTarget width={16} height={16} /> Obiettivi
                  </p>
                  {canEdit && (
                    <button onClick={() => setModaleObiettivo({})} className="p-1 text-muted hover:text-brand" aria-label="Aggiungi obiettivo">
                      <IconPlus width={18} height={18} />
                    </button>
                  )}
                </div>

                {obiettivi.length === 0 ? (
                  <p className="py-2 text-sm text-muted">
                    Nessun obiettivo impostato. Dai un traguardo concreto: motiva più di un grafico storico.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {obiettivi.map((g) => {
                      const metrica = METRICHE.find((m) => m.v === g.metric)
                      const attuale = valoreAttualeObiettivo(g)
                      const range = g.target_value - g.start_value
                      const percento = attuale == null ? null
                        : range === 0 ? 1
                        : Math.min(1, Math.max(0, (attuale - g.start_value) / range))
                      const raggiunto = percento != null && percento >= 1
                      const c = 2 * Math.PI * 26

                      return (
                        <li key={g.id} className="flex items-center gap-3 py-3">
                          <div className="relative h-14 w-14 shrink-0">
                            <svg width="56" height="56" viewBox="0 0 64 64" className="-rotate-90">
                              <circle cx="32" cy="32" r="26" fill="none" stroke="#E4EBFC" strokeWidth="7" />
                              {percento != null && (
                                <circle cx="32" cy="32" r="26" fill="none" strokeWidth="7" strokeLinecap="round"
                                        stroke={raggiunto ? '#1B7F5A' : '#1F4FD8'}
                                        strokeDasharray={`${c * percento} ${c}`} />
                              )}
                            </svg>
                            <span className="stat absolute inset-0 grid place-items-center text-[12px] font-bold">
                              {percento != null ? `${Math.round(percento * 100)}%` : '—'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{g.title}</p>
                            <p className="text-[12px] text-muted">
                              {attuale != null ? `${attuale} ${metrica?.u ?? ''}` : 'ancora nessun dato'} → {g.target_value} {metrica?.u ?? ''}
                              {g.target_date && ` · entro il ${formatoDataBreve(g.target_date)}`}
                            </p>
                            {raggiunto && <p className="text-[12px] font-medium text-good">Obiettivo raggiunto 🎉</p>}
                          </div>
                          {canEdit && (
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button onClick={() => setModaleObiettivo(g)} className="p-1 text-muted hover:text-brand" aria-label="Modifica">
                                <IconEdit width={16} height={16} />
                              </button>
                              <button onClick={() => eliminaObiettivo(g)} className="p-1 text-muted hover:text-bad" aria-label="Elimina">
                                <IconTrash width={16} height={16} />
                              </button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="card grid grid-cols-3 gap-3 p-5">
              <div>
                <p className="text-[12px] text-muted">Sedute (30gg)</p>
                <p className="stat text-[26px]">{sedute30}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Peso</p>
                <p className="stat text-[26px]">
                  {pesoAttuale ?? '—'}
                  <span className="ml-0.5 text-[13px] font-medium text-muted">{pesoAttuale != null ? 'kg' : ''}</span>
                </p>
                {deltaPeso != null && deltaPeso !== 0 && (
                  <p className={`text-[11px] font-medium ${deltaPeso < 0 ? 'text-good' : 'text-muted'}`}>
                    {deltaPeso > 0 ? '+' : ''}{deltaPeso} dall'inizio
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-muted">Record in evidenza</p>
                {recordInEvidenza ? (
                  <>
                    <p className="stat text-[20px] leading-tight">
                      {recordInEvidenza.peso}<span className="ml-0.5 text-[12px] font-medium text-muted">kg</span>
                    </p>
                    <p className="truncate text-[12px] text-muted">{recordInEvidenza.nome}</p>
                  </>
                ) : <p className="stat text-[26px] text-muted">—</p>}
              </div>
            </div>

            {pesoSerie.length > 1 && (
              <div className="card p-5 pl-1">
                <p className="mb-3 pl-4 text-[13px] text-muted">Andamento del peso</p>
                <GraficoAndamento dati={pesoSerie} chiave="peso" unita="kg" etichetta="Peso" />
              </div>
            )}

            {campiCorpoConDati.length > 0 && (
              <div className="card p-5 pl-1">
                <p className="mb-2 pl-4 text-[13px] text-muted">Altre misure nel tempo</p>
                <div className="px-4">
                  <select
                    className="field mb-3"
                    value={misuraCorpoScelta}
                    onChange={(e) => setMisuraCorpoScelta(e.target.value)}
                  >
                    {campiCorpoConDati.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
                  </select>
                </div>
                <GraficoAndamento
                  dati={serieMisuraCorpo} chiave="valore" unita={campoCorpoScelto?.u ?? 'cm'}
                  etichetta={campoCorpoScelto?.l ?? ''} colore="#5D6C85"
                />
              </div>
            )}

            {nomiEsercizi.length > 0 && (
              <div className="card p-5">
                <p className="mb-2 text-[13px] text-muted">Carico nel tempo</p>
                <select
                  className="field mb-3"
                  value={esercizioScelto}
                  onChange={(e) => setEsercizioScelto(e.target.value)}
                >
                  {nomiEsercizi.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                {serieCarico.length > 1 ? (
                  <GraficoAndamento dati={serieCarico} chiave="peso" unita="kg" etichetta="Carico" colore="#F2B705" />
                ) : (
                  <p className="text-sm text-muted">
                    Serve almeno un'altra seduta registrata su questo esercizio per vedere un andamento.
                  </p>
                )}
              </div>
            )}

            {recordPersonali.length > 0 && (
              <div className="card p-5">
                <p className="mb-1 flex items-center gap-1.5 text-[13px] text-muted">
                  <IconAward width={16} height={16} /> Record personali
                </p>
                <ul className="mt-2 divide-y divide-line">
                  {recordPersonali.map((r) => (
                    <li key={r.nome} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-sm">{r.nome}</span>
                      <span className="shrink-0 text-right">
                        <span className="stat text-[17px]">
                          {r.peso}<span className="ml-0.5 text-[12px] font-medium text-muted">kg</span>
                        </span>
                        <span className="ml-2 text-[12px] text-muted">{r.dataLabel}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {primaFoto && ultimaFoto && (
              <div className="card p-5">
                <p className="mb-3 text-[13px] text-muted">Prima e ora</p>
                <div className="grid grid-cols-2 gap-3">
                  {[primaFoto, ultimaFoto].map((f, i) => (
                    <div key={f.path}>
                      {urls[f.path] ? (
                        <img src={urls[f.path]} alt={i === 0 ? 'Prima' : 'Ora'}
                             className="aspect-[3/4] w-full rounded-xl border border-line object-cover" />
                      ) : (
                        <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-canvas" />
                      )}
                      <p className="mt-1.5 text-center text-[12px] font-medium text-muted">
                        {i === 0 ? 'Prima' : 'Ora'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {canEdit && (
        <ModalObiettivo
          goal={modaleObiettivo}
          targetId={targetId}
          misure={misure}
          recordPorId={recordPorId}
          onClose={() => setModaleObiettivo(null)}
          onSalvato={() => { setModaleObiettivo(null); caricaObiettivi() }}
        />
      )}
    </>
  )
}

/* `goal`: null = chiusa, {} = nuovo obiettivo, oggetto esistente = modifica. */
function ModalObiettivo({ goal, targetId, misure, recordPorId, onClose, onSalvato }) {
  const aperto = !!goal
  const modifica = !!goal?.id
  const [form, setForm] = useState({})
  const [esercizi, setEsercizi] = useState([])
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!aperto) return
    setForm(modifica ? { ...goal } : { metric: 'weight_kg' })
    supabase.from('exercises').select('id,name').order('name').then(({ data }) => setEsercizi(data ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal])

  if (!aperto) return null

  const metrica = METRICHE.find((m) => m.v === form.metric)

  function suggerisciPartenza(metric, exerciseId) {
    if (modifica) return form.start_value ?? ''
    if (metric === 'exercise') return exerciseId ? (recordPorId[exerciseId] ?? '') : ''
    return ultimoValore(misure, metric) ?? ''
  }

  function cambiaMetrica(metric) {
    setForm((f) => ({ ...f, metric, exercise_id: '', start_value: suggerisciPartenza(metric, '') }))
  }
  function cambiaEsercizio(exercise_id) {
    setForm((f) => ({ ...f, exercise_id, start_value: suggerisciPartenza('exercise', exercise_id) }))
  }

  async function salva(e) {
    e.preventDefault()
    if (form.metric === 'exercise' && !form.exercise_id) return toast.info('Scegli un esercizio.')
    setBusy(true)
    const payload = {
      user_id: targetId,
      title: form.title?.trim(),
      metric: form.metric,
      exercise_id: form.metric === 'exercise' ? form.exercise_id : null,
      start_value: Number(form.start_value),
      target_value: Number(form.target_value),
      target_date: form.target_date || null,
    }
    const { error } = modifica
      ? await supabase.from('goals').update(payload).eq('id', goal.id)
      : await supabase.from('goals').insert(payload)
    setBusy(false)
    if (error) return toast.err(error)
    toast.ok(modifica ? 'Obiettivo aggiornato' : 'Obiettivo creato')
    onSalvato()
  }

  return (
    <Modal open={aperto} onClose={onClose} title={modifica ? 'Modifica obiettivo' : 'Nuovo obiettivo'}>
      <form onSubmit={salva} className="space-y-4">
        <Field label="Titolo" placeholder="Es. Arrivare a 75 kg" value={form.title ?? ''}
               onChange={(e) => setForm({ ...form, title: e.target.value })} required />

        <label className="block">
          <span className="label">Cosa misura</span>
          <select className="field" value={form.metric ?? 'weight_kg'} onChange={(e) => cambiaMetrica(e.target.value)}>
            {METRICHE.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </label>

        {form.metric === 'exercise' && (
          <label className="block">
            <span className="label">Esercizio</span>
            <select className="field" value={form.exercise_id ?? ''} onChange={(e) => cambiaEsercizio(e.target.value)} required>
              <option value="">Scegli…</option>
              {esercizi.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Partenza (${metrica?.u ?? ''})`} type="number" step="0.1" inputMode="decimal"
                 value={form.start_value ?? ''} onChange={(e) => setForm({ ...form, start_value: e.target.value })} required />
          <Field label={`Obiettivo (${metrica?.u ?? ''})`} type="number" step="0.1" inputMode="decimal"
                 value={form.target_value ?? ''} onChange={(e) => setForm({ ...form, target_value: e.target.value })} required />
        </div>

        <Field label="Entro il (facoltativo)" type="date" value={form.target_date ?? ''}
               onChange={(e) => setForm({ ...form, target_date: e.target.value })} />

        <div className="flex items-center gap-3 pt-1">
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Salvo…' : 'Salva obiettivo'}</button>
          <button type="button" onClick={onClose} disabled={busy} className="btn-ghost">Annulla</button>
        </div>
      </form>
    </Modal>
  )
}
