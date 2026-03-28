import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--acento-glow)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function IconWarning() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function IconEntrenador() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesActivos: 0,
    clientesVencidos: 0,
    totalEntrenadores: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarStats()
  }, [])

  async function cargarStats() {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const { data: clientes } = await supabase.from('clientes').select('id, estado, fecha_vencimiento')
      const { data: entrenadores } = await supabase.from('entrenadores').select('id')

      const totalClientes = clientes?.length ?? 0
      const clientesActivos = clientes?.filter(c => c.estado === true).length ?? 0
      const clientesVencidos = clientes?.filter(c => c.fecha_vencimiento && c.fecha_vencimiento < hoy).length ?? 0
      const totalEntrenadores = entrenadores?.length ?? 0

      setStats({ totalClientes, clientesActivos, clientesVencidos, totalEntrenadores })
    } catch (error) {
      console.error('Error cargando stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Panel de control</h1>
          <p className="admin-page-subtitle">Vista general del gimnasio</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-acento">
            <IconUsers />
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.totalClientes}</div>
          <div className="stat-card-label">Total clientes</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-success">
            <IconCheck />
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.clientesActivos}</div>
          <div className="stat-card-label">Clientes activos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-danger">
            <IconWarning />
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.clientesVencidos}</div>
          <div className="stat-card-label">Membresías vencidas</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-neutral">
            <IconEntrenador />
          </div>
          <div className="stat-card-val">{loading ? '—' : stats.totalEntrenadores}</div>
          <div className="stat-card-label">Entrenadores</div>
        </div>
      </div>
    </>
  )
}
