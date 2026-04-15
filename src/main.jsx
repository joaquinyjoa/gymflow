import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import AppRouter from './routes/AppRouter'

// Recargar cuando el service worker toma control (actualización en background)
if ('serviceWorker' in navigator) {
  let recargando = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recargando) return
    recargando = true
    window.location.reload()
  })
}

// Aplicar tema inicial antes de renderizar
const temaGuardado = localStorage.getItem('gymflow-tema') ?? 'dark'
document.documentElement.setAttribute('data-tema', temaGuardado)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)