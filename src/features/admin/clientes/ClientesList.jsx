import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    setLoading(true)
    const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, apellido, correo, estado, fecha_vencimiento')
        .order('apellido', { ascending: true })

    if (error) setError(error.message)
    else setClientes(data)
    setLoading(false)
  }

  async function toggleEstado(cliente) {
    const { error } = await supabase
      .from('clientes')
      .update({ estado: !cliente.estado })
      .eq('id', cliente.id)

    if (error) {
      alert('Error al actualizar estado')
      return
    }

    // Actualiza solo ese cliente en el estado local sin recargar todo
    setClientes(prev =>
      prev.map(c => c.id === cliente.id ? { ...c, estado: !c.estado } : c)
    )
  }

  async function eliminarCliente(cliente) {
    const confirmar = window.confirm(`¿Eliminar a ${cliente.nombre} ${cliente.apellido}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    // Primero necesitamos el user_id del cliente
    const { data } = await supabase
      .from('clientes')
      .select('user_id')
      .eq('id', cliente.id)
      .single()

    if (!data?.user_id) { alert('Error al obtener datos del cliente'); return }

    const { data: result, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { user_id: data.user_id }
    })

    if (error || result?.error) {
      alert('Error al eliminar cliente')
      return
    }

    setClientes(prev => prev.filter(c => c.id !== cliente.id))
  }

  function estaVencido(fecha_vencimiento) {
    if (!fecha_vencimiento) return false
    return fecha_vencimiento < new Date().toISOString().split('T')[0]
  }

  if (loading) return <p>Cargando clientes...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <div>
        <h1>Clientes</h1>
        <p>Total: {clientes.length} clientes</p>
        <button onClick={() => navigate('/admin/clientes/nuevo')}>
          + Nuevo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <p>No hay clientes registrados</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Correo</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.id}>
                <td>{cliente.apellido}, {cliente.nombre}</td>
                <td>{cliente.correo?.split('@')[0]}</td>
                <td>{cliente.correo}</td>
                <td>
                  {cliente.fecha_vencimiento
                    ? cliente.fecha_vencimiento
                    : 'Sin vencimiento'}
                  {estaVencido(cliente.fecha_vencimiento) && ' ⚠️'}
                </td>
                <td>{cliente.estado ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}>
                    Editar
                  </button>
                  <button onClick={() => toggleEstado(cliente)}>
                    {cliente.estado ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => eliminarCliente(cliente)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}