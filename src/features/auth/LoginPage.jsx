import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

export default function LoginPage() {
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login, getRutaInicial } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!dni || !pin) {
      setError('Completá todos los campos')
      return
    }
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos')
      return
    }

    try {
      setCargando(true)
      await login(dni, pin)
      navigate(getRutaInicial())
    } catch (err) {
      setError(err.message)
    } finally {
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
            onChange={(e) => setDni(e.target.value)}
            placeholder="12345678"
            maxLength={20}
          />
        </div>
        <div>
          <label>PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="4 dígitos"
            maxLength={4}
            autoComplete="current-password"
            />
        </div>
        {error && <p>{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}