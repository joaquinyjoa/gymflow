import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/AuthContext'
import { ROUTES } from '../../lib/constants'
import { SkeletonStats } from '../../components/Skeleton'

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function estaVencido(fecha) {
  if (!fecha) return false
  return fecha < new Date().toISOString().split('T')[0]
}

function proximoAVencer(fecha) {
  if (!fecha) return false
  const hoy = new Date()
  const venc = new Date(fecha)
  const diff = (venc - hoy) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 14
}

export default function DashboardEntrenador() {
  const [stats, setStats] = useState({ totalEjercicios: 0, totalRutinas: 0, totalClientes: 0 })
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const { perfil } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    try {
      const [
        { count: totalEjercicios },
        { count: totalRutinas },
        { data: asignaciones },
      ] = await Promise.all([
        supabase.from('ejercicios').select('*', { count: 'exact', head: true }),
        supabase.from('rutinas').select('*', { count: 'exact', head: true }),
        supabase.from('rutinas_clientes')
          .select('id, dia_semana, cliente_id, clientes(id, nombre, apellido, fecha_vencimiento, correo), rutinas(nombre)')
          .order('dia_semana', { ascending: true }),
      ])

      // Agrupar asignaciones por cliente
      const mapaClientes = {}
      for (const a of asignaciones ?? []) {
        const cid = a.cliente_id
        if (!mapaClientes[cid]) {
          mapaClientes[cid] = {
            ...a.clientes,
            asignaciones: [],
          }
        }
        mapaClientes[cid].asignaciones.push({ id: a.id, dia: a.dia_semana, rutina: a.rutinas?.nombre })
      }

      const lista = Object.values(mapaClientes)
      lista.sort((a, b) => `${a.apellido}${a.nombre}`.localeCompare(`${b.apellido}${b.nombre}`))

      setStats({ totalEjercicios: totalEjercicios ?? 0, totalRutinas: totalRutinas ?? 0, totalClientes: lista.length })
      setClientes(lista)
    } finally {
      setLoading(false)
    }
  }

  const clientesConAlerta = clientes.filter(c => estaVencido(c.fecha_vencimiento) || proximoAVencer(c.fecha_vencimiento))

  if (loading) return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <div className="skeleton" style={{ width: '180px', height: '24px', borderRadius: '6px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px' }} />
        </div>
      </div>
      <SkeletonStats count={3} />
    </>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Bienvenido, {perfil?.nombre}</h1>
          <p className="admin-page-subtitle">Panel del entrenador</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card clickable" onClick={() => navigate(ROUTES.ENTRENADOR_EJERCICIOS)}>
          <div className="stat-card-icon stat-card-icon-acento">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--acento-glow)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/>
              <path d="M3 9.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-5z"/>
              <path d="M17 9.5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-5z"/>
            </svg>
          </div>
          <div className="stat-card-val">{stats.totalEjercicios}</div>
          <div className="stat-card-label">Ejercicios</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate(ROUTES.ENTRENADOR_RUTINAS)}>
          <div className="stat-card-icon stat-card-icon-success">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          </div>
          <div className="stat-card-val">{stats.totalRutinas}</div>
          <div className="stat-card-label">Rutinas</div>
        </div>
        <div className="stat-card clickable" onClick={() => navigate(ROUTES.ENTRENADOR_CLIENTES)}>
          <div className="stat-card-icon stat-card-icon-neutral">
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-card-val">{stats.totalClientes}</div>
          <div className="stat-card-label">Clientes</div>
        </div>
      </div>

      {/* Alertas de vencimiento */}
      {clientesConAlerta.length > 0 && (
        <div className="ent-dash-alerta">
          <div className="ent-dash-alerta-titulo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {clientesConAlerta.length} cliente{clientesConAlerta.length !== 1 ? 's' : ''} con membresía próxima a vencer o vencida
          </div>
          {clientesConAlerta.map(c => (
            <div key={c.id} className="ent-dash-alerta-row">
              <span>{c.apellido}, {c.nombre}</span>
              <span className={estaVencido(c.fecha_vencimiento) ? 'fecha-vencida' : 'ent-dash-pronto'}>
                {estaVencido(c.fecha_vencimiento) ? 'Vencida' : 'Vence pronto'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Lista de clientes */}
      {!loading && clientes.length > 0 && (
        <div className="ent-dash-section">
          <p className="ent-dash-section-titulo">Mis clientes</p>
          <div className="ent-dash-clientes">
            {clientes.map(c => (
              <div key={c.id} className="ent-dash-cliente-row" onClick={() => navigate(ROUTES.ENTRENADOR_CLIENTES)}>
                <div className="ent-dash-cliente-info">
                  <div className="ent-dash-cliente-nombre">{c.apellido}, {c.nombre}</div>
                  <div className="ent-dash-cliente-dni">DNI {c.correo?.split('@')[0]}</div>
                </div>
                <div className="ent-dash-dias">
                  {c.asignaciones.map(a => (
                    <span key={a.id} className="ent-dash-dia-chip" title={a.rutina}>
                      {DIAS[a.dia]}
                    </span>
                  ))}
                  {c.asignaciones.length === 0 && (
                    <span className="ent-dash-sin-rutina">Sin rutinas</span>
                  )}
                </div>
                {estaVencido(c.fecha_vencimiento) && (
                  <span className="badge badge-danger" style={{ flexShrink: 0 }}>Vencido</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="admin-form-section" style={{ marginTop: '16px' }}>
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
