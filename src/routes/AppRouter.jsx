import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../store/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import { ROUTES, ROLES } from '../lib/constants'

// Páginas
import LoginPage from '../features/auth/LoginPage'

// Placeholders hasta que creemos las páginas reales
const AdminPage = () => <div>Admin</div>
const EntrenadorPage = () => <div>Entrenador</div>
const ClientePage = () => <div>Cliente</div>

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pública */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Admin */}
          <Route path={ROUTES.ADMIN} element={
            <ProtectedRoute rolesPermitidos={[ROLES.ADMIN]}>
              <AdminPage />
            </ProtectedRoute>
          } />

          {/* Entrenador */}
          <Route path={ROUTES.ENTRENADOR} element={
            <ProtectedRoute rolesPermitidos={[ROLES.ENTRENADOR]}>
              <EntrenadorPage />
            </ProtectedRoute>
          } />

          {/* Cliente */}
          <Route path={ROUTES.CLIENTE} element={
            <ProtectedRoute rolesPermitidos={[ROLES.CLIENTE]}>
              <ClientePage />
            </ProtectedRoute>
          } />

          {/* Cualquier ruta desconocida manda al login */}
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}