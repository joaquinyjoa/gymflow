import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { ROUTES } from '../../lib/constants'

export default function EntrenadorPage() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div>
      <aside>
        <div>
          <h2>GymFlow</h2>
          <p>{perfil?.nombre} {perfil?.apellido}</p>
        </div>

        <nav>
          <NavLink to="/entrenador">Dashboard</NavLink>
          <NavLink to="/entrenador/ejercicios">Ejercicios</NavLink>
          <NavLink to="/entrenador/rutinas">Rutinas</NavLink>
          <NavLink to="/entrenador/clientes">Clientes</NavLink>
        </nav>

        <button onClick={handleLogout}>Cerrar sesión</button>
      </aside>

      <main>
        <Outlet />
      </main>
    </div>
  )
}