import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

export default function ClientePage() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <header>
        <div>
          <h2>GymFlow</h2>
          <p>{perfil?.nombre} {perfil?.apellido}</p>
        </div>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}