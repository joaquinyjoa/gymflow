import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { IosSheet } from '../../components/InstallPrompt'
import AppLoader from '../../components/AppLoader'
import '../../styles/features/login.css'

export default function LoginPage() {
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [intentoLogin, setIntentoLogin] = useState(false)

  const { login, getRutaInicial, perfilListo, rol, authError, setAuthError, loading } = useAuth()
  const { tema, toggleTema } = useTheme()
  const { triggerInstall, showIosSheet, isIos, isInstalled, dismiss } = useInstallPrompt()
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

  if (loading) return <AppLoader />

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
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cabeza */}
              <circle cx="32" cy="10" r="6" fill="white"/>
              {/* Cuerpo */}
              <line x1="32" y1="16" x2="32" y2="36" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Barra de pesas — brazos extendidos arriba */}
              <line x1="10" y1="22" x2="54" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              {/* Pesa izquierda */}
              <rect x="6" y="17" width="6" height="10" rx="2" fill="white"/>
              {/* Pesa derecha */}
              <rect x="52" y="17" width="6" height="10" rx="2" fill="white"/>
              {/* Brazo izquierdo */}
              <line x1="32" y1="22" x2="16" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              {/* Brazo derecho */}
              <line x1="32" y1="22" x2="48" y2="22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              {/* Pierna izquierda */}
              <line x1="32" y1="36" x2="22" y2="52" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
              {/* Pierna derecha */}
              <line x1="32" y1="36" x2="42" y2="52" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
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

        {/* Botón obtener app */}
        {!isInstalled && (
          <button className="login-get-app-btn" onClick={triggerInstall}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
              <path d="M8 12l4 4 4-4"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
            </svg>
            Obtener app
          </button>
        )}

      </div>

      {showIosSheet && <IosSheet onDismiss={dismiss} isIos={isIos} />}
    </div>
  )
}
