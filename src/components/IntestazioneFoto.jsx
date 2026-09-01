/*
  Foto vera come sfondo di tutta la pagina, non solo del titolo: un livello fisso
  a schermo intero (posizione fixed, dietro a tutto) con un velo scuro sopra, più
  scuro in alto dove sta il titolo bianco. Le card `.card` (bianche, opache) e i
  pulsanti restano sopra, esattamente come la card di accesso galleggia sulla
  foto nel login — qui lo stesso principio si estende a tutta la sezione.

  Le foto sono in src/assets/bg, già ridotte e compresse (~60-90 kB l'una): non
  rimetterci gli originali, pesano 700+ kB e in palestra si sentono.

  `SfondoFoto` è il solo livello fotografico, senza titolo: serve nelle schermate
  "vuote" (nessuna scheda/piano ancora creato), dove non c'è un titolo vero da
  mostrare ma la pagina deve comunque avere lo sfondo, non restare piatta.
*/
export function SfondoFoto({ src }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
      style={{
        backgroundImage:
          `linear-gradient(180deg, rgba(16,26,43,.8) 0%, rgba(16,26,43,.45) 20%, rgba(16,26,43,.45) 100%), url(${src})`,
      }}
    />
  )
}

export default function IntestazioneFoto({ src, titolo, sottotitolo, azione }) {
  return (
    <>
      <SfondoFoto src={src} />
      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-cond text-[28px] font-bold leading-none text-white [text-shadow:0_1px_12px_rgba(16,26,43,.5)]">
            {titolo}
          </h1>
          {sottotitolo && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/85 [text-shadow:0_1px_8px_rgba(16,26,43,.5)]">
              {sottotitolo}
            </p>
          )}
        </div>
        {azione}
      </div>
    </>
  )
}
