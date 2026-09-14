/*
  Sagome uomo/donna con i punti dove prendere le misure, per chi si misura da
  solo e non è sicuro di dove passare il metro. SVG disegnato a mano, in stile
  con le icone di ui.jsx: niente foto da cercare/licenziare, zero peso in più.
  I numeri seguono l'ordine di CAMPI in Misure.jsx.
*/

const PUNTI = [
  { n: 1, label: 'Petto',       testo: 'Intorno al torace, all\'altezza dei capezzoli, nastro parallelo al pavimento.' },
  { n: 2, label: 'Vita',        testo: 'Nel punto più stretto dell\'addome, di solito appena sopra l\'ombelico.' },
  { n: 3, label: 'Fianchi',     testo: 'Nel punto più largo di fianchi e glutei, in piedi con i talloni uniti.' },
  { n: 4, label: 'Coscia',      testo: 'A metà tra inguine e ginocchio, con la gamba rilassata.' },
  { n: 5, label: 'Metà gluteo', testo: 'Di spalle, a metà altezza del gluteo, nel punto più sporgente.' },
  { n: 6, label: 'Polpaccio',   testo: 'Nel punto più largo, a metà tra caviglia e ginocchio.' },
]

const CORPO = {
  uomo: {
    braccioDx: 'M100,50 L118,54 L108,135 L96,132 Z',
    braccioSx: 'M40,50 L22,54 L32,135 L44,132 Z',
    gambaDx: 'M70,140 L90,140 L83,248 L71,248 Z',
    gambaSx: 'M50,140 L70,140 L69,248 L57,248 Z',
    torso: 'M42,50 L98,50 Q90,75 88,108 Q92,128 90,140 L50,140 Q48,128 52,108 Q50,75 42,50 Z',
    collo: 'M58,37 L82,37 L86,52 L54,52 Z',
    testaR: 17,
  },
  donna: {
    braccioDx: 'M92,50 L106,53 L98,128 L88,125 Z',
    braccioSx: 'M48,50 L34,53 L42,128 L52,125 Z',
    gambaDx: 'M70,140 L94,140 L85,248 L73,248 Z',
    gambaSx: 'M46,140 L70,140 L67,248 L55,248 Z',
    torso: 'M48,50 L92,50 Q86,78 84,105 Q90,125 94,140 L46,140 Q50,125 56,105 Q54,78 48,50 Z',
    collo: 'M60,36 L80,36 L83,50 L57,50 Z',
    testaR: 15,
  },
}

function Sagoma({ tipo, etichetta }) {
  const f = CORPO[tipo]
  return (
    <div className="flex-1">
      <svg viewBox="0 0 220 260" className="w-full">
        <g transform="translate(35,0)">
          <g fill="#E4EBFC" stroke="#1F4FD8" strokeWidth="1.6" strokeLinejoin="round">
            <path d={f.braccioDx} /><path d={f.braccioSx} />
            <path d={f.gambaDx} /><path d={f.gambaSx} />
            <path d={f.torso} /><path d={f.collo} />
            <circle cx="70" cy="22" r={f.testaR} />
          </g>

          <g stroke="#5D6C85" strokeWidth="1.3" strokeDasharray="3,3">
            <line x1="10" y1="82" x2="130" y2="82" />
            <line x1="10" y1="110" x2="130" y2="110" />
            <line x1="10" y1="140" x2="130" y2="140" />
            <line x1="72" y1="168" x2="100" y2="168" />
            <line x1="72" y1="215" x2="98" y2="215" />
          </g>

          <g fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">
            {[
              [0, 82, 1], [0, 110, 2], [140, 140, 3], [140, 168, 4], [140, 120, 5], [140, 215, 6],
            ].map(([x, y, n]) => (
              <g key={n}>
                <circle cx={x} cy={y} r="10" fill="#1F4FD8" />
                <text x={x} y={y + 4}>{n}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>
      <p className="mt-1 text-center text-[12px] text-muted">{etichetta}</p>
    </div>
  )
}

export default function GuidaMisure() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Sagoma tipo="uomo" etichetta="Uomo" />
        <Sagoma tipo="donna" etichetta="Donna" />
      </div>
      <ul className="space-y-2.5">
        {PUNTI.map(({ n, label, testo }) => (
          <li key={n} className="flex gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
              {n}
            </span>
            <p className="text-sm leading-snug">
              <span className="font-medium">{label}</span> — <span className="text-muted">{testo}</span>
            </p>
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-muted">
        Il peso non è in figura: basta la bilancia, a digiuno, sempre nelle stesse condizioni.
      </p>
    </div>
  )
}
