/*
  Decorazioni vettoriali: sfumature CSS, nessuna immagine da scaricare. Servono solo
  a dare respiro alle intestazioni — sempre aria-hidden, dietro al contenuto
  (position:absolute con z negativo) e pointer-events-none, così non intercettano
  mai un tocco. Il colore è preso dalla stessa palette di tailwind.config.js: non
  aggiungerne altri qui, per restare coerenti con "Non introdurre altri colori".
*/

const TINTA = { brand: '31,79,216', saffron: '242,183,5' }

export function Sfumatura({ colore = 'brand', opacita = 0.16, className = '' }) {
  const rgb = TINTA[colore] ?? TINTA.brand
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute -z-10 rounded-full ${className}`}
      style={{ background: `radial-gradient(circle, rgba(${rgb},${opacita}) 0%, rgba(${rgb},0) 72%)` }}
    />
  )
}

/**
 * Coppia di sfumature dietro al titolo di una pagina o di una sezione.
 * Va messa dentro un contenitore con `position: relative` (il titolo, essendo
 * in flusso normale, si dispone sopra automaticamente: non serve altro).
 */
export function AccentoIntestazione({ principale = 'brand' }) {
  const secondario = principale === 'saffron' ? 'brand' : 'saffron'
  return (
    <>
      <Sfumatura colore={principale} opacita={0.16} className="-right-8 -top-10 h-40 w-40" />
      <Sfumatura colore={secondario} opacita={0.09} className="left-1/4 -top-6 h-24 w-24" />
    </>
  )
}

/**
 * Sfondo in stile "attrezzi", per schermate scure come il login: icone sparse a
 * bassissima opacità. Le icone le passa chi chiama (di solito da ui.jsx), così
 * questo file non ha bisogno di importarle.
 */
export function MotivoIcone({ icone }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {icone.map(({ Icon, top, left, size = 90, rot = 0, opacita = 0.08 }, i) => (
        <Icon
          key={i} width={size} height={size}
          style={{ position: 'absolute', top, left, opacity: opacita, transform: `rotate(${rot}deg)`, color: '#fff' }}
        />
      ))}
    </div>
  )
}
