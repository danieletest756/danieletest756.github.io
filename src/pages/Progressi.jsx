import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Section, Empty, Spinner, IconChart } from '../components/ui'
import { urlFirmati } from '../lib/foto'
import GraficoAndamento from '../components/GraficoAndamento'
import IntestazioneFoto from '../components/IntestazioneFoto'
import fotoProgressi from '../assets/bg/progressi.jpg'

/* Non è un dato nuovo da registrare: è la messa in scena di quello che scheda,
   dieta e misure raccolgono già. */

const formatoData = (d) => d.slice(8, 10) + '/' + d.slice(5, 7)

export default function Progressi() {
  const { targetId } = useAuth()
  const [stato, setStato] = useState('carico')   // carico | pronto
  const [pesoSerie, setPesoSerie] = useState([])
  const [carichi, setCarichi] = useState({})     // { nomeEsercizio: [{data, peso}] }
  const [esercizioScelto, setEsercizioScelto] = useState('')
  const [primaFoto, setPrimaFoto] = useState(null)
  const [ultimaFoto, setUltimaFoto] = useState(null)
  const [urls, setUrls] = useState({})

  useEffect(() => {
    if (!targetId) return
    let annullato = false

    async function carica() {
      setStato('carico')

      const [{ data: misure }, { data: log }] = await Promise.all([
        supabase.from('measurements').select('date,weight_kg').eq('user_id', targetId).order('date'),
        supabase.from('workout_logs')
          .select('date, weight_kg, item:workout_items(exercise:exercises(name))')
          .eq('user_id', targetId).not('weight_kg', 'is', null).order('date'),
      ])
      if (annullato) return

      setPesoSerie(
        (misure ?? [])
          .filter((r) => r.weight_kg != null)
          .map((r) => ({ data: formatoData(r.date), peso: Number(r.weight_kg) }))
      )

      const perEsercizio = {}
      ;(log ?? []).forEach((l) => {
        const nome = l.item?.exercise?.name
        if (!nome) return
        ;(perEsercizio[nome] ||= []).push({ data: formatoData(l.date), peso: Number(l.weight_kg) })
      })
      setCarichi(perEsercizio)
      const nomi = Object.keys(perEsercizio)
      setEsercizioScelto((prec) => (prec && perEsercizio[prec] ? prec : (
        nomi.sort((a, b) => perEsercizio[b].length - perEsercizio[a].length)[0] ?? ''
      )))

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
  const vuoto = pesoSerie.length < 2 && nomiEsercizi.length === 0 && !primaFoto

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
            {pesoSerie.length > 1 && (
              <div className="card p-5 pl-1">
                <p className="mb-3 pl-4 text-[13px] text-muted">Andamento del peso</p>
                <GraficoAndamento dati={pesoSerie} chiave="peso" unita="kg" etichetta="Peso" />
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
