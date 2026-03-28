import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import '../../styles/features/login.css'

export default function LoginPage() {
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [intentoLogin, setIntentoLogin] = useState(false)

  const { login, getRutaInicial, perfilListo, rol, authError, setAuthError } = useAuth()
  const { tema, toggleTema } = useTheme()
  const navigate = useNavigate()

  // Navegar cuando el perfil esté listo
  useEffect(() => {
    if (intentoLogin && perfilListo && rol) {
      setCargando(false)
      navigate(getRutaInicial())
    }
  }, [perfilListo, rol, intentoLogin])

  // Mostrar error de autenticación en el login
  useEffect(() => {
    if (authError && intentoLogin) {
      setError(authError)
      setAuthError(null)
      setCargando(false)
      setIntentoLogin(false)
    }
  }, [authError])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!dni) { setError('El DNI es obligatorio'); return }
    if (!/^\d+$/.test(dni)) { setError('El DNI solo puede contener números'); return }
    if (dni.length < 6 || dni.length > 11) { setError('El DNI debe tener entre 6 y 11 dígitos'); return }
    if (!pin) { setError('El PIN es obligatorio'); return }
    if (pin.length !== 4) { setError('El PIN debe tener 4 dígitos'); return }

    try {
      setCargando(true)
      setIntentoLogin(true)
      await login(dni, pin)
    } catch (err) {
      setError(err.message)
      setIntentoLogin(false)
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <button className="btn btn-icon login-tema-toggle" onClick={toggleTema} title="Cambiar tema">
        {tema === 'dark' ? (
          <svg className="icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>
      <div className="login-container">

        {/* Branding */}
        <div className="login-logo">
          <div className="login-logo-icono">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
              <path d="M14 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/>
              <path d="M10 10.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/>
            </svg>
          </div>
          <p className="login-logo-titulo">GymFlow</p>
          <p className="login-logo-sub">Tu entrenamiento, siempre contigo</p>
        </div>

        {/* Form */}
        <div className="login-form-card">
          <p className="login-form-titulo">Iniciar sesión</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Número de documento</label>
              <input
                className="input"
                type="text"
                value={dni}
                onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="12345678"
                maxLength={11}
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label className="input-label">PIN</label>
              <input
                className="input"
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 dígitos"
                maxLength={4}
                autoComplete="off"
              />
            </div>

            {error && <div className="msg-error mb-16">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-full login-submit"
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
