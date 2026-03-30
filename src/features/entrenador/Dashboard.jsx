import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/AuthContext'
import { ROUTES } from '../../lib/constants'

export default function DashboardEntrenador() {
  const [stats, setStats] = useState({
    totalEjercicios: 0,
    totalRutinas: 0,
    totalClientes: 0,
  })
  const [loading, setLoading] = useState(true)
  const { perfil } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarStats()
  }, [perfil])

  async function cargarStats() {
    try {
      const [
        { count: totalEjercicios },
        { count: totalRutinas },
        { count: totalClientes },
      ] = await Promise.all([
        supabase.from('ejercicios').select('*', { count: 'exact', head: true }).eq('created_by', perfil.id),
        supabase.from('rutinas').select('*', { count: 'exact', head: true }).eq('created_by', perfil.id),
        supabase.from('rutinas_clientes').select('*', { count: 'exact', head: true }),
      ])

      setStats({ totalEjercicios, totalRutinas, totalClientes })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Bienvenido, {perfil?.nombre}</h1>
          <p className="admin-page-subtitle">Panel del entrenador</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div
          className="stat-card"
          onClick={() => navigate(ROUTES.ENTRENADOR_EJERCICIOS)}
        >
          <div className="stat-card-icon stat-card-icon-acento">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/>
              <path d="M3 9.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-5z"/>
              <path d="M17 9.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-5z"/>
            </svg>
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.totalEjercicios}</div>
          <div className="stat-card-label">Ejercicios creados</div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate(ROUTES.ENTRENADOR_RUTINAS)}
        >
          <div className="stat-card-icon stat-card-icon-success">
            <svg className="icon" viewBox="0 0 24 24">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.totalRutinas}</div>
          <div className="stat-card-label">Rutinas creadas</div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate(ROUTES.ENTRENADOR_CLIENTES)}
        >
          <div className="stat-card-icon stat-card-icon-neutral">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.totalClientes}</div>
          <div className="stat-card-label">Clientes asignados</div>
        </div>
      </div>

      <div className="admin-form-section" style={{ marginTop: '24px' }}>
        <p className="admin-form-section-title">Acciones rápidas</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/entrenador/ejercicios/nuevo')}>
            + Nuevo ejercicio
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/entrenador/rutinas/nuevo')}>
            + Nueva rutina
          </button>
        </div>
      </div>
    </>
  )
}
