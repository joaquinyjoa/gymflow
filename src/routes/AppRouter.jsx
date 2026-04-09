import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../store/AuthContext'
import { ToastProvider } from '../components/Toast'
import ProtectedRoute from './ProtectedRoute'
import ErrorBoundary from '../components/ErrorBoundary'
import InstallPrompt from '../components/InstallPrompt'
import OfflineBanner from '../components/OfflineBanner'
import { ROUTES, ROLES } from '../lib/constants'

const ROL_KEY = 'gymflow_rol'

function RootRedirect() {
  const rolCacheado = localStorage.getItem(ROL_KEY)
  if (rolCacheado === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN} replace />
  if (rolCacheado === ROLES.ENTRENADOR) return <Navigate to={ROUTES.ENTRENADOR} replace />
  if (rolCacheado === ROLES.CLIENTE) return <Navigate to={ROUTES.CLIENTE} replace />
  return <Navigate to={ROUTES.LOGIN} replace />
}

import LoginPage from '../features/auth/LoginPage'

// Páginas de admin
import AdminPage from '../features/admin/AdminPage'
import Dashboard from '../features/admin/Dashboard'
import ClientesList from '../features/admin/clientes/ClientesList'
import ClienteForm from '../features/admin/clientes/ClienteForm'
import EntrenadoresList from '../features/admin/entrenadores/EntrenadoresList'
import EntrenadorForm from '../features/admin/entrenadores/EntrenadorForm'
import EntrenadorPage from '../features/entrenador/EntrenadorPage'
import DashboardEntrenador from '../features/entrenador/Dashboard'

// paginas del entrenador
import EjerciciosList from '../features/entrenador/ejercicios/EjerciciosList'
import EjercicioForm from '../features/entrenador/ejercicios/EjercicioForm'
import EjercicioDetalle from '../features/entrenador/ejercicios/EjercicioDetalle'
import RutinasList from '../features/entrenador/rutinas/RutinasList'
import RutinaForm from '../features/entrenador/rutinas/RutinaForm'
import AsignarRutina from '../features/entrenador/rutinas/AsignarRutina'
import ClientesEntrenador from '../features/entrenador/clientes/ClientesEntrenador'
import RutinaClienteDetalle from '../features/entrenador/clientes/RutinaClienteDetalle'

// Páginas de cliente
import ClientePage from '../features/cliente/ClientePage'
import RutinaDelDia from '../features/cliente/RutinaDelDia'
import EjercicioDetalleCliente from '../features/cliente/EjercicioDetalle'
import PerfilCliente from '../features/cliente/PerfilCliente'

export default function AppRouter() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* // Rutas protegidas por rol */}
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
          }>
            <Route index element={<DashboardEntrenador />} />
            <Route path="ejercicios" element={<EjerciciosList />} />
            <Route path="ejercicios/nuevo" element={<EjercicioForm />} />
            <Route path="ejercicios/:id/editar" element={<EjercicioForm />} />
            <Route path="ejercicios/:id" element={<EjercicioDetalle />} />
            <Route path="rutinas" element={<RutinasList />} />
            <Route path="rutinas/nuevo" element={<RutinaForm />} />
            <Route path="rutinas/:id/editar" element={<RutinaForm />} />
            <Route path="rutinas/:id/asignar" element={<AsignarRutina />} />
            <Route path="clientes" element={<ClientesEntrenador />} />
            <Route path="clientes/:clienteId/rutina/:rutinaClienteId" element={<RutinaClienteDetalle />} />
          </Route>

          <Route path={ROUTES.CLIENTE} element={
          <ProtectedRoute rolesPermitidos={[ROLES.CLIENTE]}>
            <ClientePage />
          </ProtectedRoute>
        }>
          <Route index element={<RutinaDelDia />} />
          <Route path="ejercicio/:ejercicioId" element={<EjercicioDetalleCliente />} />
          <Route path="perfil" element={<PerfilCliente />} />
        </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
        <InstallPrompt />
        <OfflineBanner />
      </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}