import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

let idSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((msg, tipo = 'exito', duracion = 3000) => {
    const id = ++idSeq
    setToasts(prev => [...prev, { id, msg, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duracion)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            {t.tipo === 'exito' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {t.tipo === 'error' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
