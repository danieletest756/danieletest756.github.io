/*
  Service worker minimo, senza librerie: serve solo a far comparire "Installa
  app" su Android e a far partire l'app installata senza passare dal browser.
  Rete sempre prima di tutto: i dati di scheda/dieta/misure vengono da Supabase
  e devono restare sempre aggiornati. La cache è solo una riserva per quando
  la connessione manca del tutto, e riguarda solo i file dell'app (mai le
  chiamate a Supabase, che sono un altro dominio e restano fuori da qui).
*/
const CACHE = 'atleti-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copia = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copia))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
