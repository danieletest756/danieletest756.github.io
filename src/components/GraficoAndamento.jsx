import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

/*
  Grafico a linea per un andamento nel tempo: peso corporeo, carico di un
  esercizio, ecc. Condiviso da Misure e Progressi — usa recharts, quindi ogni
  pagina che lo importa va caricata in lazy loading (vedi App.jsx).
*/
export default function GraficoAndamento({ dati, chiave, unita, etichetta, colore = '#1F4FD8' }) {
  if (dati.length < 2) return null
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dati} margin={{ top: 5, right: 16, bottom: 0, left: 0 }}>
          <XAxis dataKey="data" tick={{ fontSize: 12, fill: '#5D6C85' }} axisLine={false} tickLine={false} />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} width={38}
                 tick={{ fontSize: 12, fill: '#5D6C85' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} ${unita}`, etichetta]} />
          <Line type="monotone" dataKey={chiave} stroke={colore} strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
