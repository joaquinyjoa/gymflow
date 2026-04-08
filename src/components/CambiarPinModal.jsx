import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CambiarPinModal({ onClose }) {
  const [pinActual, setPinActual]   = useState('')
  const [pinNuevo, setPinNuevo]     = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError]           = useState('')
  const [exito, setExito]           = useState(false)
  const [guardando, setGuardando]   = useState(false)

  async function guardar() {
    setError('')
    if (!pinActual || !pinNuevo || !pinConfirm) { setError('Completá todos los campos'); return }
    if (pinNuevo.length < 4) { setError('El PIN debe tener al menos 4 caracteres'); return }
    if (pinNuevo !== pinConfirm) { setError('Los PINs nuevos no coinciden'); return }

    setGuardando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pinActual,
      })
      if (signInError) { setError('El PIN actual es incorrecto'); return }

      const { error: updateError } = await supabase.auth.updateUser({ password: pinNuevo })
      if (updateError) throw updateError

      setExito(true)
      setTimeout(onClose, 1500)
    } catch {
      setError('Error al cambiar el PIN, intentá de nuevo')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="confirm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="confirm-modal">
        <div className="confirm-icono" style={{ background: 'var(--acento-bg)', border: '1px solid var(--acento-border)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--acento-glow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 className="confirm-titulo">Cambiar PIN</h3>

        {exito ? (
          <p className="confirm-desc" style={{ color: '#22C55E', fontWeight: 600 }}>PIN actualizado correctamente</p>
        ) : (
          <>
            {error && <div className="msg-error mb-16" style={{ textAlign: 'left' }}>{error}</div>}
            <div className="input-group">
              <label className="input-label">PIN actual</label>
              <input className="input" type="password" inputMode="numeric"
                value={pinActual} onChange={e => setPinActual(e.target.value)} placeholder="••••" />
            </div>
            <div className="input-group">
              <label className="input-label">Nuevo PIN</label>
              <input className="input" type="password" inputMode="numeric"
                value={pinNuevo} onChange={e => setPinNuevo(e.target.value)} placeholder="••••" />
            </div>
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Confirmar nuevo PIN</label>
              <input className="input" type="password" inputMode="numeric"
                value={pinConfirm} onChange={e => setPinConfirm(e.target.value)} placeholder="••••" />
            </div>
            <div className="confirm-acciones">
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
