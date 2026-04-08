import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import CambiarPinModal from '../../components/CambiarPinModal'
import ConfirmModal from '../../components/ConfirmModal'
import '../../styles/features/admin.css'

function IconGrid() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconEntrenador() {
  return (
    <svg className="icon" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V8a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
      <path d="M14 10V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/>
      <path d="M10 10.5V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1"/>
    </svg>
  )
}

function IconPersona() {
  return (
    <svg className="icon icon-sm" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: <IconGrid />, end: true },
  { to: '/admin/clientes', label: 'Clientes', icon: <IconUsers /> },
  { to: '/admin/entrenadores', label: 'Entrenadores', icon: <IconEntrenador /> },
]

export default function AdminPage() {
  const { perfil, logout } = useAuth()
  const { tema, toggleTema } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [mostrarCambiarPin, setMostrarCambiarPin] = useState(false)
  const [confirmarLogout, setConfirmarLogout] = useState(false)
  const drawerRef = useRef(null)

  useEffect(() => { setDrawerAbierto(false) }, [location.pathname])

  useEffect(() => {
    if (!drawerAbierto) return
    function handleClick(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [drawerAbierto])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="ent-shell">

      {/* ── Topbar ── */}
      <header className="ent-topbar">
        <div className="ent-topbar-logo">
          <div className="admin-logo-icono"><IconPuno /></div>
          <span className="admin-logo-texto">GymFlow</span>
        </div>
        <div className="ent-topbar-acciones">
          <button className="btn btn-icon btn-icon-sm" onClick={toggleTema} title="Cambiar tema">
            {tema === 'dark' ? <IconSol /> : <IconLuna />}
          </button>
          <button
            className={`ent-hamburguesa${drawerAbierto ? ' abierto' : ''}`}
            onClick={() => setDrawerAbierto(v => !v)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {drawerAbierto && (
        <div className="ent-drawer-overlay" onClick={() => setDrawerAbierto(false)} />
      )}

      {/* ── Drawer ── */}
      <aside ref={drawerRef} className={`ent-drawer${drawerAbierto ? ' abierto' : ''}`}>
        <div className="ent-drawer-header">
          <div className="admin-user-row">
            <div className="admin-user-avatar"><IconPersona /></div>
            <div className="admin-user-info">
              <div className="admin-user-nombre">{perfil?.nombre ?? 'Admin'}</div>
              <div className="admin-user-rol">Administrador</div>
            </div>
          </div>
        </div>

        <nav className="ent-drawer-nav">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className="admin-nav-link">
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ent-drawer-footer">
          <button className="admin-nav-link" onClick={() => { setDrawerAbierto(false); setMostrarCambiarPin(true) }}>
            <svg className="icon" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Cambiar PIN</span>
          </button>
          <button className="admin-nav-link ent-nav-salida" onClick={() => { setDrawerAbierto(false); setConfirmarLogout(true) }}>
            <IconSalida />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {mostrarCambiarPin && <CambiarPinModal onClose={() => setMostrarCambiarPin(false)} />}

      <ConfirmModal
        open={confirmarLogout}
        titulo="¿Cerrar sesión?"
        desc="Tu sesión se cerrará y tendrás que volver a ingresar tu PIN."
        onConfirm={handleLogout}
        onCancel={() => setConfirmarLogout(false)}
      />

      {/* ── Contenido ── */}
      <main className="ent-main">
        <div className="ent-content">
          <Outlet />
        </div>
      </main>

    </div>
  )
}
