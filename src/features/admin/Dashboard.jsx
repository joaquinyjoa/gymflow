import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function StatCard({ icon, valor, label, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon stat-card-icon-${color}`}>{icon}</div>
      <div className="stat-card-val">{valor}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

function DonutChart({ activos, vencidos, total }) {
  const r = 54, cx = 70, cy = 70
  const circ = 2 * Math.PI * r
  const pA = total > 0 ? activos / total : 0
  const pV = total > 0 ? vencidos / total : 0
  const pR = total > 0 ? Math.max(0, 1 - pA - pV) : 1
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="14"/>
      {total > 0 && <>
        {pA > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22C55E" strokeWidth="14"
          strokeDasharray={`${circ*pA} ${circ*(1-pA)}`} strokeDashoffset={0}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}/>}
        {pV > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth="14"
          strokeDasharray={`${circ*pV} ${circ*(1-pV)}`} strokeDashoffset={-(circ*pA)}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}/>}
        {pR > 0.01 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-hover)" strokeWidth="14"
          strokeDasharray={`${circ*pR} ${circ*(1-pR)}`} strokeDashoffset={-(circ*(pA+pV))}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}/>}
      </>}
      <text x={cx} y={cy-6} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">{total}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.5">CLIENTES</text>
    </svg>
  )
}

function IconUsers() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--acento-glow)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconCheck() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
function IconWarning() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
function IconClock() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconEntrenador() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function IconRutina() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarStats() }, [])

  async function cargarStats() {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const en7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      const en30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      const mesActual = hoy.slice(0, 7) // 'YYYY-MM'

      const [
        { data: clientes },
        { data: entrenadores },
        { count: totalRutinas },
        { data: renovaciones },
      ] = await Promise.all([
        supabase.from('clientes').select('id, estado, fecha_vencimiento'),
        supabase.from('entrenadores').select('id'),
        supabase.from('rutinas').select('*', { count: 'exact', head: true }),
        supabase.from('renovaciones').select('metodo_pago, fecha_renovacion'),
      ])

      const total = clientes?.length ?? 0
      const activos = clientes?.filter(c => c.estado && c.fecha_vencimiento >= hoy).length ?? 0
      const vencidos = clientes?.filter(c => c.fecha_vencimiento && c.fecha_vencimiento < hoy).length ?? 0
      const porVencer7 = clientes?.filter(c => c.estado && c.fecha_vencimiento >= hoy && c.fecha_vencimiento <= en7).length ?? 0
      const porVencer30 = clientes?.filter(c => c.estado && c.fecha_vencimiento > en7 && c.fecha_vencimiento <= en30).length ?? 0

      const renovEfectivo = renovaciones?.filter(r => r.metodo_pago === 'efectivo').length ?? 0
      const renovTransferencia = renovaciones?.filter(r => r.metodo_pago === 'transferencia').length ?? 0
      const renovEsteMes = renovaciones?.filter(r => r.fecha_renovacion?.startsWith(mesActual)).length ?? 0

      setStats({
        total, activos, vencidos, porVencer7, porVencer30,
        totalEntrenadores: entrenadores?.length ?? 0,
        totalRutinas: totalRutinas ?? 0,
        renovEfectivo, renovTransferencia, renovEsteMes,
        totalRenovaciones: renovaciones?.length ?? 0,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const s = stats
  const val = (v) => loading ? '—' : v

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Panel de control</h1>
          <p className="admin-page-subtitle">Vista general del gimnasio</p>
        </div>
      </div>

      {/* ── Membresías ── */}
      <p className="dashboard-seccion-titulo">Membresías</p>
      <div className="dashboard-stats">
        <StatCard icon={<IconUsers />}    valor={val(s?.total)}       label="Total clientes"      color="acento" />
        <StatCard icon={<IconCheck />}    valor={val(s?.activos)}     label="Activos"             color="success" />
        <StatCard icon={<IconWarning />}  valor={val(s?.vencidos)}    label="Vencidos"            color="danger" />
        <StatCard icon={<IconClock />}    valor={val(s?.porVencer7)}  label="Vencen esta semana"  color="warning" />
        <StatCard icon={<IconClock />}    valor={val(s?.porVencer30)} label="Vencen este mes"     color="warning" />
        <StatCard icon={<IconEntrenador />} valor={val(s?.totalEntrenadores)} label="Entrenadores" color="neutral" />
        <StatCard icon={<IconRutina />}   valor={val(s?.totalRutinas)} label="Rutinas"            color="rutina" />
      </div>

      {/* ── Gráfico donut ── */}
      {!loading && s?.total > 0 && (
        <div className="dashboard-chart-card">
          <p className="dashboard-chart-titulo">Estado de membresías</p>
          <div className="dashboard-chart-inner">
            <DonutChart activos={s.activos} vencidos={s.vencidos} total={s.total} />
            <div className="dashboard-chart-leyenda">
              <div className="chart-leyenda-item">
                <span className="chart-leyenda-dot" style={{ background: '#22C55E' }}/>
                <span className="chart-leyenda-label">Activos</span>
                <span className="chart-leyenda-val">{s.activos}</span>
              </div>
              <div className="chart-leyenda-item">
                <span className="chart-leyenda-dot" style={{ background: '#ef4444' }}/>
                <span className="chart-leyenda-label">Vencidos</span>
                <span className="chart-leyenda-val">{s.vencidos}</span>
              </div>
              {s.total - s.activos - s.vencidos > 0 && (
                <div className="chart-leyenda-item">
                  <span className="chart-leyenda-dot" style={{ background: 'var(--border-hover)' }}/>
                  <span className="chart-leyenda-label">Sin fecha</span>
                  <span className="chart-leyenda-val">{s.total - s.activos - s.vencidos}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Pagos ── */}
      {!loading && s?.totalRenovaciones > 0 && (
        <div className="dashboard-chart-card">
          <p className="dashboard-chart-titulo">Métodos de pago</p>
          <div className="dashboard-pagos-grid">
            <div className="dashboard-pago-stat">
              <span className="dashboard-pago-emoji">💵</span>
              <span className="dashboard-pago-val">{s.renovEfectivo}</span>
              <span className="dashboard-pago-label">Efectivo</span>
            </div>
            <div className="dashboard-pago-stat">
              <span className="dashboard-pago-emoji">📲</span>
              <span className="dashboard-pago-val">{s.renovTransferencia}</span>
              <span className="dashboard-pago-label">Transferencia</span>
            </div>
            <div className="dashboard-pago-stat">
              <span className="dashboard-pago-emoji">📅</span>
              <span className="dashboard-pago-val">{s.renovEsteMes}</span>
              <span className="dashboard-pago-label">Este mes</span>
            </div>
            <div className="dashboard-pago-stat">
              <span className="dashboard-pago-emoji">🔁</span>
              <span className="dashboard-pago-val">{s.totalRenovaciones}</span>
              <span className="dashboard-pago-label">Total renovaciones</span>
            </div>
          </div>

          {/* Barra efectivo vs transferencia */}
          {s.totalRenovaciones > 0 && (
            <div className="dashboard-pago-barra-wrap">
              <div className="dashboard-pago-barra">
                <div
                  className="dashboard-pago-barra-efectivo"
                  style={{ width: `${(s.renovEfectivo / s.totalRenovaciones) * 100}%` }}
                />
              </div>
              <div className="dashboard-pago-barra-labels">
                <span style={{ color: '#22C55E' }}>Efectivo {Math.round((s.renovEfectivo / s.totalRenovaciones) * 100)}%</span>
                <span style={{ color: '#60a5fa' }}>Transferencia {Math.round((s.renovTransferencia / s.totalRenovaciones) * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
