import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Spinner, IconChart, IconAward } from '../components/ui'
import { urlFirmati } from '../lib/foto'
import GraficoAndamento from '../components/GraficoAndamento'
import IntestazioneFoto from '../components/IntestazioneFoto'
import fotoProgressi from '../assets/bg/progressi.jpg'

/* Non è un dato nuovo da registrare: è la messa in scena di quello che scheda,
   dieta e misure raccolgono già. */

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

export default function Progressi() {
  const { targetId } = useAuth()
  const [stato, setStato] = useState('carico')   // carico | pronto
  const [pesoSerie, setPesoSerie] = useState([])
  const [pesoAttuale, setPesoAttuale] = useState(null)
  const [deltaPeso, setDeltaPeso] = useState(null)
  const [misureCorpo, setMisureCorpo] = useState({})   // { chest_cm: [{data, valore}], ... }
  const [misuraCorpoScelta, setMisuraCorpoScelta] = useState('')
  const [carichi, setCarichi] = useState({})     // { nomeEsercizio: [{data, peso}] }
  const [esercizioScelto, setEsercizioScelto] = useState('')
  const [recordPersonali, setRecordPersonali] = useState([])
  const [sedute30, setSedute30] = useState(0)
  const [primaFoto, setPrimaFoto] = useState(null)
  const [ultimaFoto, setUltimaFoto] = useState(null)
  const [urls, setUrls] = useState({})

  useEffect(() => {
    if (!targetId) return
    let annullato = false

    async function carica() {
      setStato('carico')

      const [{ data: misure }, { data: log }] = await Promise.all([
        supabase.from('measurements').select('*').eq('user_id', targetId).order('date'),
        supabase.from('workout_logs')
          .select('date, weight_kg, item:workout_items(exercise:exercises(name))')
          .eq('user_id', targetId).not('weight_kg', 'is', null).order('date'),
      ])
      if (annullato) return

      const pesiValidi = (misure ?? []).filter((r) => r.weight_kg != null)
      setPesoSerie(pesiValidi.map((r) => ({ data: formatoData(r.date), peso: Number(r.weight_kg) })))
      setPesoAttuale(pesiValidi.length ? Number(pesiValidi[pesiValidi.length - 1].weight_kg) : null)
      setDeltaPeso(
        pesiValidi.length > 1
          ? Math.round((Number(pesiValidi[pesiValidi.length - 1].weight_kg) - Number(pesiValidi[0].weight_kg)) * 10) / 10
          : null
      )

      const perCampo = {}
      CAMPI_CORPO.forEach(({ k }) => {
        perCampo[k] = (misure ?? [])
          .filter((m) => m[k] != null)
          .map((m) => ({ data: formatoData(m.date), valore: Number(m[k]) }))
      })
      setMisureCorpo(perCampo)
      setMisuraCorpoScelta((prec) => (prec && (perCampo[prec]?.length ?? 0) > 1 ? prec : (
        CAMPI_CORPO.find((c) => (perCampo[c.k]?.length ?? 0) > 1)?.k ?? ''
      )))

      const perEsercizio = {}
      const record = {}
      ;(log ?? []).forEach((l) => {
        const nome = l.item?.exercise?.name
        if (!nome) return
        const peso = Number(l.weight_kg)
        ;(perEsercizio[nome] ||= []).push({ data: formatoData(l.date), peso })
        if (!record[nome] || peso >= record[nome].peso) record[nome] = { nome, peso, data: l.date }
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

      const soglia = new Date()
      soglia.setDate(soglia.getDate() - 30)
      setSedute30(new Set((log ?? []).filter((l) => new Date(l.date) >= soglia).map((l) => l.date)).size)

      // Foto: la più vecchia e la più recente fra le misurazioni che ne hanno almeno una
      const idsConData = new Map((misure ?? []).map((m) => [m.id, m.date]))
      const idMisure = (misure ?? []).map((m) => m.id)
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

  const vuoto =
    pesoSerie.length < 2 && nomiEsercizi.length === 0 && !primaFoto &&
    recordPersonali.length === 0 && campiCorpoConDati.length === 0 && sedute30 === 0

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
    </>
  )
}
