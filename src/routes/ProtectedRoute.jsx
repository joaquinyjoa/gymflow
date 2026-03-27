import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { ROUTES } from '../lib/constants'

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, rol, loading } = useAuth()

  if (loading) return <div>Cargando...</div>

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return children ? children : <Outlet />
}