import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

export default function AdminPage() {
  const { perfil, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div>
      <aside>
        <div>
          <h2>GymFlow</h2>
          <p>{perfil?.correo}</p>
        </div>
        <nav>
          <NavLink to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/clientes">Clientes</NavLink>
          <NavLink to="/admin/entrenadores">Entrenadores</NavLink>
        </nav>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}