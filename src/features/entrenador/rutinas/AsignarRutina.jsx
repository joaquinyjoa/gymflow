import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

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
  const [exito, setExito] = useState('')

  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
  }, [id])

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
      .eq('estado', true)
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

    // Verificar que no esté ya en la lista pendiente con ese día
    const yaEnLista = clientesSeleccionados.some(
      cs => cs.cliente.id === cliente.id && cs.dia === Number(diaSemana)
    )
    if (yaEnLista) { setError('Este cliente ya está en la lista para ese día'); return }

    // Verificar que no tenga ya esta rutina ese día en la base de datos
    const yaAsignado = asignaciones.some(
      a => a.cliente_id === cliente.id && a.dia_semana === Number(diaSemana)
    )
    if (yaAsignado) { setError(`${cliente.apellido}, ${cliente.nombre} ya tiene esta rutina el ${DIAS.find(d => d.value === Number(diaSemana))?.label}`); return }

    // Verificar que ese cliente no tenga OTRA rutina ese día
    setLoading(true)
    supabase
      .from('rutinas_clientes')
      .select('id')
      .eq('cliente_id', cliente.id)
      .eq('dia_semana', diaSemana)
      .then(({ data }) => {
        setLoading(false)
        if (data && data.length > 0) {
          setError(`${cliente.apellido}, ${cliente.nombre} ya tiene una rutina asignada el ${DIAS.find(d => d.value === Number(diaSemana))?.label}`)
          return
        }
        setClientesSeleccionados(prev => [...prev, { cliente, dia: Number(diaSemana) }])
        setBusquedaCliente('')
        setMostrarDropdown(false)
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

      const { error } = await supabase
        .from('rutinas_clientes')
        .insert(inserts)

      if (error) throw new Error(error.message)

      setExito(`Rutina asignada correctamente a ${clientesSeleccionados.length} cliente${clientesSeleccionados.length > 1 ? 's' : ''}`)
      setClientesSeleccionados([])
      setDiaSemana('')
      cargarAsignaciones()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function eliminarAsignacion(asignacionId) {
    const confirmar = window.confirm('¿Eliminar esta asignación?')
    if (!confirmar) return

    const { error } = await supabase
      .from('rutinas_clientes')
      .delete()
      .eq('id', asignacionId)

    if (error) alert('Error al eliminar asignación')
    else setAsignaciones(prev => prev.filter(a => a.id !== asignacionId))
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <div>
      <button onClick={() => navigate('/entrenador/rutinas')}>← Volver</button>

      <h1>Asignar rutina</h1>

      {rutina && (
        <div>
          <h2>{rutina.nombre}</h2>
          {rutina.descripcion && <p>{rutina.descripcion}</p>}
          <p>Dificultad: {rutina.nivel_dificultad}</p>
        </div>
      )}

      <form onSubmit={handleAsignar}>
        <h2>Nueva asignación</h2>

        {/* Día de la semana */}
        <div>
          <label>Día de la semana</label>
          <select value={diaSemana} onChange={e => { setDiaSemana(e.target.value); setError('') }}>
            <option value="">Seleccionar día</option>
            {DIAS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Buscador de cliente */}
        <div style={{ position: 'relative' }}>
          <label>Buscar cliente</label>
          <input
            type="text"
            value={busquedaCliente}
            onChange={e => {
              setBusquedaCliente(e.target.value)
              setMostrarDropdown(true)
            }}
            onFocus={() => setMostrarDropdown(true)}
            onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
            placeholder="Buscá por nombre, apellido o DNI..."
            autoComplete="off"
          />
          {mostrarDropdown && busquedaCliente && (
            <div style={{ position: 'absolute', background: 'white', border: '1px solid #ccc', width: '100%', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
              {clientesFiltrados.length === 0 ? (
                <div style={{ padding: '8px' }}>No se encontraron clientes</div>
              ) : (
                clientesFiltrados.map(c => (
                  <div
                    key={c.id}
                    onMouseDown={() => agregarClienteALista(c)}
                    style={{ padding: '8px', cursor: 'pointer' }}
                  >
                    {c.apellido}, {c.nombre} — DNI: {c.correo?.split('@')[0]}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Lista de clientes seleccionados para asignar */}
        {clientesSeleccionados.length > 0 && (
          <div>
            <h3>Clientes a asignar ({clientesSeleccionados.length})</h3>
            {clientesSeleccionados.map((cs, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span>{cs.cliente.apellido}, {cs.cliente.nombre} — {DIAS.find(d => d.value === cs.dia)?.label}</span>
                <button type="button" onClick={() => quitarClienteDeLista(index)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {exito && <p style={{ color: 'green' }}>{exito}</p>}

        <button type="submit" disabled={loading || clientesSeleccionados.length === 0}>
          {loading ? 'Asignando...' : `Asignar a ${clientesSeleccionados.length} cliente${clientesSeleccionados.length !== 1 ? 's' : ''}`}
        </button>
      </form>

      {/* Asignaciones actuales */}
      <div>
        <h2>Asignaciones actuales ({asignaciones.length})</h2>

        {asignaciones.length > 0 && (
          <input
            type="text"
            value={busquedaAsignacion}
            onChange={e => setBusquedaAsignacion(e.target.value)}
            placeholder="Filtrar por nombre o DNI..."
            autoComplete="off"
          />
        )}

        {asignacionesFiltradas.length === 0 ? (
          <p>{asignaciones.length === 0 ? 'Esta rutina no está asignada a ningún cliente todavía' : 'No se encontraron resultados'}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>DNI</th>
                <th>Día</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignacionesFiltradas.map(a => (
                <tr key={a.id}>
                  <td>{a.clientes?.apellido}, {a.clientes?.nombre}</td>
                  <td>{a.clientes?.correo?.split('@')[0]}</td>
                  <td>{DIAS.find(d => d.value === a.dia_semana)?.label}</td>
                  <td>
                    <button onClick={() => eliminarAsignacion(a.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}