import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/AuthContext'
import { FeedbackProvider } from './components/Feedback'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FeedbackProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FeedbackProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// PWA: senza questo, Android non offre mai "Installa app" e su iPhone
// l'icona in home si aprirebbe comunque dentro Safari invece che da sola.
// Solo in produzione: in sviluppo un service worker mette in cache i file di
// Vite e fa vedere pagine vecchie invece delle modifiche appena fatte.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
