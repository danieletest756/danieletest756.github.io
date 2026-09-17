/*
  Decide se una variazione di una misura del corpo è un progresso o no, in base
  a `profiles.goal_direction`. Usato da Misure.jsx e Progressi.jsx: condiviso qui
  per non farlo divergere fra le due pagine.

  La vita conta sempre come "meglio se scende", qualunque obiettivo abbia
  l'atleta: nessuno la vuole più larga. Per le altre misure invece un aumento può
  essere il progresso VERO se l'obiettivo è aumentare massa (coscia, gluteo,
  petto, polpaccio, peso che salgono) — non solo se scendono come nel dimagrimento.
  Se `direzione` non è impostata, si comporta come il vecchio criterio: scende = verde.
*/
export function sensoBuono(campo, delta, direzione) {
  if (!delta) return null
  if (campo === 'waist_cm') return delta < 0
  if (direzione === 'massa') return delta > 0
  return delta < 0
}
