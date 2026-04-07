import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { ROUTES } from '../lib/constants'
import AppLoader from '../components/AppLoader'

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, rol, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AppLoader />

  if (!user) {
    // Guardar la ruta actual para volver después del login
    sessionStorage.setItem('gymflow_redirect', location.pathname)
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return children ? children : <Outlet />
}
