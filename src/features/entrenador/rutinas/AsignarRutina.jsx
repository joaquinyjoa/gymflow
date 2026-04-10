import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import ConfirmModal from '../../../components/ConfirmModal'
import { useToast } from '../../../components/Toast'

const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

export default function AsignarRutina() {
  const [rutina, setRutina] = useState(null)
  const [clientes, setClientes] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [clientesSeleccionados, setClientesSeleccionados] = useState([])
  const [diaSemana, setDiaSemana] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [busquedaAsignacion, setBusquedaAsignacion] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { cargarDatos() }, [id])

  async function cargarDatos() {
    setCargando(true)
    await Promise.all([cargarRutina(), cargarClientes(), cargarAsignaciones()])
    setCargando(false)
  }

  async function cargarRutina() {
    const { data } = await supabase
      .from('rutinas')
      .select('id, nombre, descripcion, nivel_dificultad')
      .eq('id', id)
      .single()
    setRutina(data)
  }

  async function cargarClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, correo')
      .order('apellido', { ascending: true })
    setClientes(data ?? [])
  }

  async function cargarAsignaciones() {
    const { data } = await supabase
      .from('rutinas_clientes')
      .select('id, dia_semana, cliente_id, clientes(nombre, apellido, correo)')
      .eq('rutina_id', id)
      .order('dia_semana', { ascending: true })
    setAsignaciones(data ?? [])
  }

  const clientesFiltrados = clientes.filter(c => {
    const dni = c.correo?.split('@')[0] ?? ''
    const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase()
    const apellidoNombre = `${c.apellido} ${c.nombre}`.toLowerCase()
    const busqueda = busquedaCliente.toLowerCase()
    return (
      nombreCompleto.includes(busqueda) ||
      apellidoNombre.includes(busqueda) ||
      dni.includes(busqueda)
    )
  })

  const asignacionesFiltradas = asignaciones.filter(a => {
    const dni = a.clientes?.correo?.split('@')[0] ?? ''
    const nombre = `${a.clientes?.nombre} ${a.clientes?.apellido}`.toLowerCase()
    const busqueda = busquedaAsignacion.toLowerCase()
    return nombre.includes(busqueda) || dni.includes(busqueda)
  })

  function agregarClienteALista(cliente) {
    if (!diaSemana) { setError('Seleccioná un día primero'); return }
    setError('')

    const yaEnLista = clientesSeleccionados.some(
      cs => cs.cliente.id === cliente.id && cs.dia === Number(diaSemana)
    )
    if (yaEnLista) { setError('Este cliente ya está en la lista para ese día'); return }

    const yaAsignado = asignaciones.some(
      a => a.cliente_id === cliente.id && a.dia_semana === Number(diaSemana)
    )
    if (yaAsignado) {
      setError(`${cliente.apellido}, ${cliente.nombre} ya tiene esta rutina el ${DIAS.find(d => d.value === Number(diaSemana))?.label}`)
      return
    }

    setLoading(true)
    supabase
      .from('rutinas_clientes')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('dia_semana', diaSemana)
      .then(({ data, error }) => {
        setLoading(false)
        if (error) { setError('Error al verificar disponibilidad'); return }
        if (data && data.length > 0) {
          setError(`${cliente.apellido}, ${cliente.nombre} ya tiene una rutina el ${DIAS.find(d => d.value === Number(diaSemana))?.label}`)
          return
        }
        setClientesSeleccionados(prev => [...prev, { cliente, dia: Number(diaSemana) }])
        setBusquedaCliente('')
        setMostrarDropdown(false)
      })
      .catch(() => {
        setLoading(false)
        setError('Error de conexión al verificar disponibilidad')
      })
  }

  function quitarClienteDeLista(index) {
    setClientesSeleccionados(prev => prev.filter((_, i) => i !== index))
  }

  async function handleAsignar(e) {
    e.preventDefault()
    setError('')
    setExito('')

    if (clientesSeleccionados.length === 0) { setError('Agregá al menos un cliente para asignar'); return }

    setLoading(true)
    try {
      const inserts = clientesSeleccionados.map(cs => ({
        rutina_id: Number(id),
        cliente_id: cs.cliente.id,
        dia_semana: cs.dia,
      }))

      const { error } = await supabase.from('rutinas_clientes').insert(inserts)
      if (error) throw new Error(error.message)

      toast(`Rutina asignada a ${clientesSeleccionados.length} cliente${clientesSeleccionados.length > 1 ? 's' : ''}`)
      setClientesSeleccionados([])
      setDiaSemana('')
      cargarAsignaciones()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function eliminarAsignacion() {
    setEliminando(true)
    const { error } = await supabase
      .from('rutinas_clientes')
      .delete()
      .eq('id', confirmItem.id)

    if (!error) {
      setAsignaciones(prev => prev.filter(a => a.id !== confirmItem.id))
      toast('Asignación eliminada')
    }
    setEliminando(false)
    setConfirmItem(null)
  }

  if (cargando) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando datos...</p>
    </div>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <button className="btn-back" onClick={() => navigate('/entrenador/rutinas')}>
            ← Volver
          </button>
          <h1 className="admin-page-title">Asignar rutina</h1>
        </div>
      </div>

      {/* Info de la rutina */}
      {rutina && (
        <div className="ent-rutina-info-card">
          <div className="ent-rutina-info-nombre">{rutina.nombre}</div>
          {rutina.descripcion && (
            <div className="ent-rutina-info-desc">{rutina.descripcion}</div>
          )}
          <span className="badge badge-acento">{rutina.nivel_dificultad}</span>
        </div>
      )}

      {/* Formulario de nueva asignación */}
      <div className="admin-form-section">
        <p className="admin-form-section-title">Nueva asignación</p>

        <form onSubmit={handleAsignar}>
          <div className="admin-form-grid" style={{ marginTop: '12px' }}>
            <div className="input-group">
              <label className="input-label">Día de la semana</label>
              <select
                className="input"
                value={diaSemana}
                onChange={e => { setDiaSemana(e.target.value); setError('') }}
              >
                <option value="">Seleccionar día</option>
                {DIAS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group ent-search-wrap">
              <label className="input-label">Buscar cliente</label>
              <input
                className="input"
                type="text"
                value={busquedaCliente}
                onChange={e => { setBusquedaCliente(e.target.value); setMostrarDropdown(true) }}
                onFocus={() => setMostrarDropdown(true)}
                onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                placeholder="Nombre, apellido o DNI..."
                autoComplete="off"
              />
              {mostrarDropdown && busquedaCliente && (
                <div className="ent-dropdown">
                  {clientesFiltrados.length === 0 ? (
                    <div className="ent-dropdown-empty">No se encontraron clientes</div>
                  ) : (
                    clientesFiltrados.map(c => (
                      <div
                        key={c.id}
                        className="ent-dropdown-item"
                        onMouseDown={() => agregarClienteALista(c)}
                      >
                        {c.apellido}, {c.nombre} — DNI: {c.correo?.split('@')[0]}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Clientes pendientes de asignar */}
          {clientesSeleccionados.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <p className="admin-form-section-title" style={{ marginBottom: '8px' }}>
                A asignar ({clientesSeleccionados.length})
              </p>
              <div className="ent-pendientes-lista">
                {clientesSeleccionados.map((cs, index) => (
                  <div key={index} className="ent-pendiente-item">
                    <span>
                      {cs.cliente.apellido}, {cs.cliente.nombre} — {DIAS.find(d => d.value === cs.dia)?.label}
                    </span>
                    <button
                      type="button"
                      className="btn btn-icon btn-icon-sm btn-icon-danger"
                      onClick={() => quitarClienteDeLista(index)}
                      title="Quitar"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="msg-error mb-16" style={{ marginTop: '12px' }}>{error}</div>}

          <div style={{ marginTop: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || clientesSeleccionados.length === 0}
            >
              {loading ? 'Asignando...' : `Asignar a ${clientesSeleccionados.length} cliente${clientesSeleccionados.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>

      {/* Asignaciones actuales */}
      <div className="admin-form-section">
        <p className="admin-form-section-title">
          Asignaciones actuales ({asignaciones.length})
        </p>

        {asignaciones.length > 0 && (
          <div className="input-group" style={{ marginTop: '10px', marginBottom: '12px' }}>
            <input
              className="input"
              type="text"
              value={busquedaAsignacion}
              onChange={e => setBusquedaAsignacion(e.target.value)}
              placeholder="Filtrar por nombre o DNI..."
              autoComplete="off"
            />
          </div>
        )}

        {asignacionesFiltradas.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '13px' }}>
            {asignaciones.length === 0
              ? 'Esta rutina no está asignada a ningún cliente todavía.'
              : 'No se encontraron resultados.'}
          </p>
        ) : (
          <div className="admin-table-card">
            <table className="ent-asignaciones-tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>DNI</th>
                  <th>Día</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {asignacionesFiltradas.map(a => (
                  <tr key={a.id}>
                    <td>{a.clientes?.apellido}, {a.clientes?.nombre}</td>
                    <td style={{ fontFamily: 'monospace' }}>{a.clientes?.correo?.split('@')[0]}</td>
                    <td>{DIAS.find(d => d.value === a.dia_semana)?.label}</td>
                    <td>
                      <button
                        className="btn btn-icon btn-icon-sm btn-icon-danger"
                        onClick={() => setConfirmItem(a)}
                        title="Eliminar asignación"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirmItem)}
        titulo="¿Eliminar asignación?"
        desc={confirmItem ? `Se quitará la rutina del ${DIAS.find(d => d.value === confirmItem.dia_semana)?.label} a ${confirmItem.clientes?.apellido}, ${confirmItem.clientes?.nombre}.` : ''}
        onConfirm={eliminarAsignacion}
        onCancel={() => setConfirmItem(null)}
        loading={eliminando}
      />
    </>
  )
}
