import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import '../../styles/features/cliente.css'

function IconSol() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function IconLuna() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function IconSalida() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconPuno() {
  return (
    <svg className="icon-puno" viewBox="0 0 24 24">
      <path d="M18 11V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
      <path d="M14 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/>
      <path d="M10 10.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/>
    </svg>
  )
}

export default function ClientePage() {
  const { perfil, logout } = useAuth()
  const { tema, toggleTema } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const enPerfil = location.pathname === '/rutina/perfil'
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="cliente-header">
          <div className="cliente-header-info">
            <IconPuno />
            <div>
              <p className="cliente-saludo">{saludo}</p>
              <h1 className="cliente-nombre">{perfil?.nombre}</h1>
            </div>
          </div>
          <div className="cliente-acciones">
            <button className="btn btn-icon" onClick={toggleTema} title="Cambiar tema">
              {tema === 'dark' ? <IconSol /> : <IconLuna />}
            </button>
            <button
              className={`btn btn-icon${enPerfil ? ' active' : ''}`}
              onClick={() => navigate(enPerfil ? '/rutina' : '/rutina/perfil')}
              title="Mi perfil"
            >
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
            <button
              className="btn btn-icon btn-icon-danger"
              onClick={() => setConfirmLogout(true)}
              title="Cerrar sesión"
            >
              <IconSalida />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <Outlet />
      </div>

      {/* Modal confirmación logout */}
      {confirmLogout && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <div className="modal-handle" />

            <h2 className="modal-titulo">¿Cerrar sesión?</h2>
            <p className="modal-desc">
              Vas a salir de tu cuenta en este dispositivo.
            </p>

            <div className="modal-acciones">
              <button
                className="btn btn-danger btn-full btn-modal"
                onClick={handleLogout}
              >
                Sí, cerrar sesión
              </button>
              <button
                className="btn btn-secondary btn-full btn-modal"
                onClick={() => setConfirmLogout(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
