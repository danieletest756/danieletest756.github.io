/*
  File .ics (iCalendar) per un appuntamento: lo standard che Google Calendar,
  Apple Calendar e Outlook aprono tutti allo stesso modo con un tocco. Niente
  account Google da collegare, niente OAuth, niente token da rinnovare — solo
  testo, generato al volo, come le altre esportazioni del progetto.
*/

const perICS = (data) => data.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

const escapeICS = (t = '') =>
  t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export function generaICS({ id, title, startsAt, durationMin, notes }) {
  const inizio = new Date(startsAt)
  const fine = new Date(inizio.getTime() + durationMin * 60000)
  const righe = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atleti//IT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${id}@atleti-app`,
    `DTSTAMP:${perICS(new Date())}`,
    `DTSTART:${perICS(inizio)}`,
    `DTEND:${perICS(fine)}`,
    `SUMMARY:${escapeICS(title)}`,
    notes ? `DESCRIPTION:${escapeICS(notes)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  return new Blob([righe.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
}

export function scaricaICS(appuntamento) {
  const blob = generaICS(appuntamento)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(appuntamento.title || 'appuntamento').replace(/[^\w\-]+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
