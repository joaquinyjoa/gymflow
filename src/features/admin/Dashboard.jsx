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

function IconRutina() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
}

function IconEjercicio() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4"/>
    </svg>
  )
}

// Gráfico donut SVG puro
function DonutChart({ activos, vencidos, total }) {
  const r = 54
  const cx = 70
  const cy = 70
  const circunferencia = 2 * Math.PI * r

  const pctActivos = total > 0 ? activos / total : 0
  const pctVencidos = total > 0 ? vencidos / total : 0
  const pctResto = total > 0 ? Math.max(0, 1 - pctActivos - pctVencidos) : 1

  const dashActivos  = circunferencia * pctActivos
  const dashVencidos = circunferencia * pctVencidos
  const dashResto    = circunferencia * pctResto

  const offsetActivos  = 0
  const offsetVencidos = dashActivos
  const offsetResto    = dashActivos + dashVencidos

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* Base gris */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="14"/>

      {total > 0 && <>
        {/* Activos */}
        {pctActivos > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="#22C55E" strokeWidth="14"
            strokeDasharray={`${dashActivos} ${circunferencia - dashActivos}`}
            strokeDashoffset={-offsetActivos}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
        {/* Vencidos */}
        {pctVencidos > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="#ef4444" strokeWidth="14"
            strokeDasharray={`${dashVencidos} ${circunferencia - dashVencidos}`}
            strokeDashoffset={-offsetVencidos}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
        {/* Resto (sin fecha) */}
        {pctResto > 0.01 && (
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--border-hover)" strokeWidth="14"
            strokeDasharray={`${dashResto} ${circunferencia - dashResto}`}
            strokeDashoffset={-offsetResto}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        )}
      </>}

      {/* Centro */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.5">CLIENTES</text>
    </svg>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesActivos: 0,
    clientesVencidos: 0,
    totalEntrenadores: 0,
    totalRutinas: 0,
    totalEjercicios: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarStats()
  }, [])

  async function cargarStats() {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const [
        { data: clientes },
        { data: entrenadores },
        { count: totalRutinas },
        { count: totalEjercicios },
      ] = await Promise.all([
        supabase.from('clientes').select('id, estado, fecha_vencimiento'),
        supabase.from('entrenadores').select('id'),
        supabase.from('rutinas').select('*', { count: 'exact', head: true }),
        supabase.from('ejercicios').select('*', { count: 'exact', head: true }),
      ])

      const totalClientes = clientes?.length ?? 0
      const clientesActivos = clientes?.filter(c => c.estado === true && (!c.fecha_vencimiento || c.fecha_vencimiento >= hoy)).length ?? 0
      const clientesVencidos = clientes?.filter(c => c.fecha_vencimiento && c.fecha_vencimiento < hoy).length ?? 0
      const totalEntrenadores = entrenadores?.length ?? 0

      setStats({ totalClientes, clientesActivos, clientesVencidos, totalEntrenadores, totalRutinas: totalRutinas ?? 0, totalEjercicios: totalEjercicios ?? 0 })
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
          <div className="stat-card-icon stat-card-icon-acento"><IconUsers /></div>
          <div className="stat-card-val">{loading ? '—' : stats.totalClientes}</div>
          <div className="stat-card-label">Total clientes</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-success"><IconCheck /></div>
          <div className="stat-card-val">{loading ? '—' : stats.clientesActivos}</div>
          <div className="stat-card-label">Clientes activos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-danger"><IconWarning /></div>
          <div className="stat-card-val">{loading ? '—' : stats.clientesVencidos}</div>
          <div className="stat-card-label">Membresías vencidas</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-neutral"><IconEntrenador /></div>
          <div className="stat-card-val">{loading ? '—' : stats.totalEntrenadores}</div>
          <div className="stat-card-label">Entrenadores</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-rutina"><IconRutina /></div>
          <div className="stat-card-val">{loading ? '—' : stats.totalRutinas}</div>
          <div className="stat-card-label">Rutinas</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon stat-card-icon-ejercicio"><IconEjercicio /></div>
          <div className="stat-card-val">{loading ? '—' : stats.totalEjercicios}</div>
          <div className="stat-card-label">Ejercicios</div>
        </div>
      </div>

      {/* Gráfico */}
      {!loading && stats.totalClientes > 0 && (
        <div className="dashboard-chart-card">
          <p className="dashboard-chart-titulo">Estado de membresías</p>
          <div className="dashboard-chart-inner">
            <DonutChart
              activos={stats.clientesActivos}
              vencidos={stats.clientesVencidos}
              total={stats.totalClientes}
            />
            <div className="dashboard-chart-leyenda">
              <div className="chart-leyenda-item">
                <span className="chart-leyenda-dot" style={{ background: '#22C55E' }}/>
                <span className="chart-leyenda-label">Activos</span>
                <span className="chart-leyenda-val">{stats.clientesActivos}</span>
              </div>
              <div className="chart-leyenda-item">
                <span className="chart-leyenda-dot" style={{ background: '#ef4444' }}/>
                <span className="chart-leyenda-label">Vencidos</span>
                <span className="chart-leyenda-val">{stats.clientesVencidos}</span>
              </div>
              {stats.totalClientes - stats.clientesActivos - stats.clientesVencidos > 0 && (
                <div className="chart-leyenda-item">
                  <span className="chart-leyenda-dot" style={{ background: 'var(--border-hover)' }}/>
                  <span className="chart-leyenda-label">Sin fecha</span>
                  <span className="chart-leyenda-val">{stats.totalClientes - stats.clientesActivos - stats.clientesVencidos}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
