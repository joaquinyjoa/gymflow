import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function ClientesEntrenador() {
  const [clientes, setClientes] = useState([])
  const [clienteExpandido, setClienteExpandido] = useState(null)
  const [rutinasCliente, setRutinasCliente] = useState({})
  const [busquedaDni, setBusquedaDni] = useState('')
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [busquedaApellido, setBusquedaApellido] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    cargarClientes()
  }, [])

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

  async function eliminarAsignacion(clienteId, asignacionId) {
    const confirmar = window.confirm('¿Eliminar esta rutina del cliente?')
    if (!confirmar) return

    const { error } = await supabase
      .from('rutinas_clientes')
      .delete()
      .eq('id', asignacionId)

    if (error) { alert('Error al eliminar'); return }

    setRutinasCliente(prev => ({
      ...prev,
      [clienteId]: prev[clienteId].filter(r => r.id !== asignacionId)
    }))
  }

  function estaVencido(fecha) {
    if (!fecha) return false
    return fecha < new Date().toISOString().split('T')[0]
  }

  // Filtra en tiempo real por DNI, nombre y apellido de forma independiente
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

  if (loading) return <p>Cargando clientes...</p>

  return (
    <div>
      <h1>Clientes</h1>
      <p>Total: {clientes.length} clientes</p>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label>DNI</label>
          <input
            type="text"
            value={busquedaDni}
            onChange={e => setBusquedaDni(e.target.value.replace(/\D/g, ''))}
            placeholder="Buscar por DNI..."
            autoComplete="off"
          />
        </div>
        <div>
          <label>Nombre</label>
          <input
            type="text"
            value={busquedaNombre}
            onChange={e => setBusquedaNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
            placeholder="Buscar por nombre..."
            autoComplete="off"
          />
        </div>
        <div>
          <label>Apellido</label>
          <input
            type="text"
            value={busquedaApellido}
            onChange={e => setBusquedaApellido(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
            placeholder="Buscar por apellido..."
            autoComplete="off"
          />
        </div>
      </div>

      {clientesFiltrados.length === 0 ? (
        <p>No se encontraron clientes</p>
      ) : (
        <div>
          {clientesFiltrados.map(cliente => {
            const expandido = clienteExpandido === cliente.id
            const vencido = estaVencido(cliente.fecha_vencimiento)
            const rutinas = rutinasCliente[cliente.id] ?? []
            const libres = diasLibres(cliente.id)

            return (
              <div key={cliente.id} style={{ border: '1px solid #ccc', margin: '8px 0', padding: '12px' }}>

                {/* Cabecera del cliente */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{cliente.apellido}, {cliente.nombre}</strong>
                    <span> — DNI: {cliente.correo?.split('@')[0]}</span>
                    {!cliente.estado && <span style={{ color: 'red' }}> — Inactivo</span>}
                    {vencido && <span style={{ color: 'orange' }}> — Vencido</span>}
                  </div>
                  <button onClick={() => toggleCliente(cliente.id)}>
                    {expandido ? '▲ Cerrar' : '▼ Ver rutinas'}
                  </button>
                </div>

                {/* Panel expandido */}
                {expandido && (
                  <div style={{ marginTop: '12px' }}>

                    {/* Días con rutina */}
                    <h3>Rutinas asignadas</h3>
                    {rutinas.length === 0 ? (
                      <p>No tiene rutinas asignadas todavía</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Día</th>
                            <th>Rutina</th>
                            <th>Dificultad</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rutinas.map(r => (
                            <tr key={r.id}>
                              <td>{DIAS.find(d => d.value === r.dia_semana)?.label}</td>
                              <td>{r.rutinas?.nombre}</td>
                              <td>{r.rutinas?.nivel_dificultad}</td>
                              <td>
                                <button onClick={() => navigate(`/entrenador/clientes/${cliente.id}/rutina/${r.id}`)}>
                                  Ver / modificar
                                </button>
                                <button onClick={() => eliminarAsignacion(cliente.id, r.id)}>
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Días libres */}
                    {libres.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <h3>Días sin rutina</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {libres.map(d => (
                            <div key={d.value} style={{ padding: '8px', border: '1px dashed #ccc' }}>
                              <span>{d.label}</span>
                              <button
                                onClick={() => navigate(`/entrenador/rutinas?asignar=${cliente.id}&dia=${d.value}`)}
                                style={{ marginLeft: '8px' }}
                              >
                                + Asignar rutina
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rutinas.length === 7 && (
                      <p style={{ color: 'green' }}>✓ Tiene rutinas los 7 días de la semana</p>
                    )}

                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}