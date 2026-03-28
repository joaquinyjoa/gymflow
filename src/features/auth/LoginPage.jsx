import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

export default function LoginPage() {
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [intentoLogin, setIntentoLogin] = useState(false)

  const { login, getRutaInicial, perfilListo, rol, authError, setAuthError } = useAuth()
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
    <div>
      <h1>GymFlow</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Número de documento</label>
          <input
            type="text"
            value={dni}
            onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
            placeholder="12345678"
            maxLength={11}
            autoComplete="off"
          />
        </div>
        <div>
          <label>PIN</label>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 dígitos"
            maxLength={4}
            autoComplete="off"
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}