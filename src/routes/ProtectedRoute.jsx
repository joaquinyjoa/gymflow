import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { ROUTES } from '../lib/constants'
import AppLoader from '../components/AppLoader'

export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { user, rol, loading } = useAuth()

  if (loading) return <AppLoader />

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return children ? children : <Outlet />
}
