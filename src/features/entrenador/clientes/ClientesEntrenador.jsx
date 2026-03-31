import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import ConfirmModal from '../../../components/ConfirmModal'

const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

function IconChevron({ abajo }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: abajo ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

export default function ClientesEntrenador() {
  const [clientes, setClientes] = useState([])
  const [clienteExpandido, setClienteExpandido] = useState(null)
  const [rutinasCliente, setRutinasCliente] = useState({})
  const [busquedaDni, setBusquedaDni] = useState('')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [busquedaApellido, setBusquedaApellido] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargarClientes() }, [])

  async function cargarClientes() {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, correo, estado, fecha_vencimiento')
      .order('apellido', { ascending: true })
    setClientes(data ?? [])
    setLoading(false)
  }

  async function toggleCliente(clienteId) {
    if (clienteExpandido === clienteId) {
      setClienteExpandido(null)
      return
    }

    setClienteExpandido(clienteId)

    if (rutinasCliente[clienteId]) return

    const { data } = await supabase
      .from('rutinas_clientes')
      .select('id, dia_semana, rutinas(id, nombre, nivel_dificultad)')
      .eq('cliente_id', clienteId)
      .order('dia_semana', { ascending: true })

    setRutinasCliente(prev => ({ ...prev, [clienteId]: data ?? [] }))
  }

  async function eliminarAsignacion() {
    setEliminando(true)
    const { clienteId, asignacionId } = confirmItem

    const { error } = await supabase
      .from('rutinas_clientes')
      .delete()
      .eq('id', asignacionId)

    if (!error) {
      setRutinasCliente(prev => ({
        ...prev,
        [clienteId]: prev[clienteId].filter(r => r.id !== asignacionId)
      }))
    }

    setEliminando(false)
    setConfirmItem(null)
  }

  function estaVencido(fecha) {
    if (!fecha) return false
    return fecha < new Date().toISOString().split('T')[0]
  }

  const clientesFiltrados = clientes.filter(c => {
    const dni = c.correo?.split('@')[0] ?? ''
    return (
      dni.includes(busquedaDni) &&
      c.nombre.toLowerCase().includes(busquedaNombre.toLowerCase()) &&
      c.apellido.toLowerCase().includes(busquedaApellido.toLowerCase())
    )
  })

  function diasOcupados(clienteId) {
    return (rutinasCliente[clienteId] ?? []).map(r => r.dia_semana)
  }

  function diasLibres(clienteId) {
    const ocupados = diasOcupados(clienteId)
    return DIAS.filter(d => !ocupados.includes(d.value))
  }

  if (loading) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando clientes...</p>
    </div>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Clientes</h1>
          <p className="admin-page-subtitle">{clientes.length} registrados</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="admin-form-grid" style={{ marginBottom: '16px' }}>
        <div className="input-group">
          <label className="input-label">DNI</label>
          <input
            className="input"
            type="text"
            value={busquedaDni}
            onChange={e => setBusquedaDni(e.target.value.replace(/\D/g, ''))}
            placeholder="Buscar por DNI..."
            autoComplete="off"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Nombre</label>
          <input
            className="input"
            type="text"
            value={busquedaNombre}
            onChange={e => setBusquedaNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
            placeholder="Buscar por nombre..."
            autoComplete="off"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Apellido</label>
          <input
            className="input"
            type="text"
            value={busquedaApellido}
            onChange={e => setBusquedaApellido(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
            placeholder="Buscar por apellido..."
            autoComplete="off"
          />
        </div>
      </div>

      {clientesFiltrados.length === 0 ? (
        <div className="admin-empty">
          <h3>Sin resultados</h3>
          <p>No se encontraron clientes con esos filtros.</p>
        </div>
      ) : (
        <div className="ent-clientes-lista">
          {clientesFiltrados.map(cliente => {
            const expandido = clienteExpandido === cliente.id
            const vencido = estaVencido(cliente.fecha_vencimiento)
            const rutinas = rutinasCliente[cliente.id] ?? []
            const libres = diasLibres(cliente.id)

            return (
              <div key={cliente.id} className={`ent-cliente-card${expandido ? ' expandido' : ''}`}>

                {/* Cabecera */}
                <div className="ent-cliente-header" onClick={() => toggleCliente(cliente.id)}>
                  <div>
                    <div className="ent-cliente-nombre">
                      {cliente.apellido}, {cliente.nombre}
                    </div>
                    <div className="ent-cliente-dni">DNI {cliente.correo?.split('@')[0]}</div>
                    <div className="ent-cliente-badges">
                      {!cliente.estado && (
                        <span className="badge badge-neutral">Inactivo</span>
                      )}
                      {vencido && (
                        <span className="badge badge-danger">Vencido</span>
                      )}
                      {expandido && rutinas.length > 0 && (
                        <span className="badge badge-acento">{rutinas.length} rutina{rutinas.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <IconChevron abajo={expandido} />
                </div>

                {/* Panel expandido */}
                {expandido && (
                  <div className="ent-cliente-body">

                    {rutinas.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '13px' }}>No tiene rutinas asignadas todavía.</p>
                    ) : (
                      <>
                        <div className="ent-cliente-section-title">Rutinas asignadas</div>
                        {rutinas.map(r => (
                          <div key={r.id} className="ent-rutina-row">
                            <div className="ent-rutina-row-dia">
                              {DIAS.find(d => d.value === r.dia_semana)?.label}
                            </div>
                            <div className="ent-rutina-row-info">
                              <div className="ent-rutina-row-nombre">{r.rutinas?.nombre}</div>
                              {r.rutinas?.nivel_dificultad && (
                                <span className="badge badge-acento" style={{ marginTop: '3px', display: 'inline-block' }}>
                                  {r.rutinas.nivel_dificultad}
                                </span>
                              )}
                            </div>
                            <div className="ent-rutina-row-acciones">
                              <button
                                className="btn btn-secondary"
                                onClick={() => navigate(`/entrenador/clientes/${cliente.id}/rutina/${r.id}`)}
                              >
                                Ver
                              </button>
                              <button
                                className="btn btn-ghost"
                                onClick={() => setConfirmItem({ clienteId: cliente.id, asignacionId: r.id, nombre: r.rutinas?.nombre, dia: DIAS.find(d => d.value === r.dia_semana)?.label })}
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {libres.length > 0 && (
                      <>
                        <div className="ent-cliente-section-title">
                          {rutinas.length === 7 ? null : 'Días sin rutina'}
                        </div>
                        <div className="ent-dias-libres">
                          {libres.map(d => (
                            <div key={d.value} className="ent-dia-libre">
                              <span className="ent-dia-libre-label">{d.label}</span>
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: '12px', padding: '4px 8px' }}
                                onClick={() => navigate(`/entrenador/rutinas?asignar=${cliente.id}&dia=${d.value}`)}
                              >
                                + Asignar
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {rutinas.length === 7 && (
                      <p className="msg-exito" style={{ marginTop: '8px' }}>
                        Tiene rutinas los 7 días de la semana
                      </p>
                    )}

                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmItem)}
        titulo="¿Quitar rutina?"
        desc={confirmItem ? `Se quitará "${confirmItem.nombre}" del ${confirmItem.dia}. Esta acción no se puede deshacer.` : ''}
        onConfirm={eliminarAsignacion}
        onCancel={() => setConfirmItem(null)}
        loading={eliminando}
      />
    </>
  )
}
