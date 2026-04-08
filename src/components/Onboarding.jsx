import { useState } from 'react'
import './Onboarding.css'

const PASOS = [
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--acento)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
        <path d="M14 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/>
        <path d="M10 10.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/>
      </svg>
    ),
    titulo: 'Bienvenido a GymFlow',
    desc: 'Tu app de entrenamiento personalizado. Tu rutina, tus ejercicios y tu progreso, siempre a mano.',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--acento)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="13" y2="17"/>
      </svg>
    ),
    titulo: 'Tu rutina del día',
    desc: 'Cada día de entrenamiento tenés tu rutina lista. Deslizá entre ejercicios y seguí las instrucciones paso a paso.',
  },
  {
    icono: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--acento)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    titulo: 'Seguí tu progreso',
    desc: 'Registrá los kilos de cada serie, usá el temporizador de descanso y marcá los ejercicios completados.',
  },
]

const STORAGE_KEY = 'gymflow_onboarding_done'

export function useOnboarding() {
  return !localStorage.getItem(STORAGE_KEY)
}

export default function Onboarding({ onTerminar }) {
  const [paso, setPaso] = useState(0)
  const total = PASOS.length

  function siguiente() {
    if (paso < total - 1) {
      setPaso(paso + 1)
    } else {
      localStorage.setItem(STORAGE_KEY, '1')
      onTerminar()
    }
  }

  const p = PASOS[paso]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-icono">{p.icono}</div>
        <h2 className="onboarding-titulo">{p.titulo}</h2>
        <p className="onboarding-desc">{p.desc}</p>

        <div className="onboarding-dots">
          {PASOS.map((_, i) => (
            <div key={i} className={`onboarding-dot${i === paso ? ' activo' : ''}`} />
          ))}
        </div>

        <button className="btn btn-primary btn-full" onClick={siguiente}>
          {paso < total - 1 ? 'Siguiente' : 'Comenzar'}
        </button>

        {paso < total - 1 && (
          <button className="btn btn-ghost btn-full" onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1')
            onTerminar()
          }}>
            Saltar
          </button>
        )}
      </div>
    </div>
  )
}
