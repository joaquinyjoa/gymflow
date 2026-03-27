import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../store/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import { ROUTES, ROLES } from '../lib/constants'

import LoginPage from '../features/auth/LoginPage'
import AdminPage from '../features/admin/AdminPage'
import Dashboard from '../features/admin/Dashboard'
import ClientesList from '../features/admin/clientes/ClientesList'
import ClienteForm from '../features/admin/clientes/ClienteForm'
import EntrenadoresList from '../features/admin/entrenadores/EntrenadoresList'
import EntrenadorForm from '../features/admin/entrenadores/EntrenadorForm'

const EntrenadorPage = () => <div>Entrenador</div>
const ClientePage = () => <div>Cliente</div>

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          <Route path={ROUTES.ADMIN} element={
            <ProtectedRoute rolesPermitidos={[ROLES.ADMIN]}>
              <AdminPage />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<ClientesList />} />
            <Route path="clientes/nuevo" element={<ClienteForm />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />
            <Route path="entrenadores" element={<EntrenadoresList />} />
            <Route path="entrenadores/nuevo" element={<EntrenadorForm />} />
            <Route path="entrenadores/:id/editar" element={<EntrenadorForm />} />
          </Route>

          <Route path={ROUTES.ENTRENADOR} element={
            <ProtectedRoute rolesPermitidos={[ROLES.ENTRENADOR]}>
              <EntrenadorPage />
            </ProtectedRoute>
          } />

          <Route path={ROUTES.CLIENTE} element={
            <ProtectedRoute rolesPermitidos={[ROLES.CLIENTE]}>
              <ClientePage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}