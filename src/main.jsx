import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import AppRouter from './routes/AppRouter'

// Aplicar tema inicial antes de renderizar
const temaGuardado = localStorage.getItem('gymflow-tema') ?? 'dark'
document.documentElement.setAttribute('data-tema', temaGuardado)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
)