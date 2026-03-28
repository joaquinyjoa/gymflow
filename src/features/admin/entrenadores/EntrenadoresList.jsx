import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function EntrenadoresList() {
  const [entrenadores, setEntrenadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    cargarEntrenadores()
  }, [])

  async function cargarEntrenadores() {
    setLoading(true)
    // Traemos activo desde users para mostrarlo en la tabla
    const { data, error } = await supabase
      .from('entrenadores')
      .select('id, nombre, apellido, correo, user_id, users(activo)')
      .order('apellido', { ascending: true })

    if (error) setError(error.message)
    else setEntrenadores(data.map(e => ({ ...e, activo: e.users?.activo ?? true })))
    setLoading(false)
  }

  async function toggleEstado(entrenador) {
    const { error } = await supabase
      .from('users')
      .update({ activo: !entrenador.activo })
      .eq('id', entrenador.user_id)

    if (error) {
      alert('Error al actualizar estado')
      return
    }

    // Actualiza solo ese entrenador en el estado local sin recargar
    setEntrenadores(prev =>
      prev.map(e => e.id === entrenador.id ? { ...e, activo: !e.activo } : e)
    )
  }

  async function eliminarEntrenador(entrenador) {
    const confirmar = window.confirm(`¿Eliminar a ${entrenador.nombre} ${entrenador.apellido}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const { data: result, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { user_id: entrenador.user_id }
    })

    if (error || result?.error) {
      alert('Error al eliminar entrenador')
      return
    }

    setEntrenadores(prev => prev.filter(e => e.id !== entrenador.id))
  }

  if (loading) return <p>Cargando entrenadores...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <div>
        <h1>Entrenadores</h1>
        <p>Total: {entrenadores.length} entrenadores</p>
        <button onClick={() => navigate('/admin/entrenadores/nuevo')}>
          + Nuevo entrenador
        </button>
      </div>

      {entrenadores.length === 0 ? (
        <p>No hay entrenadores registrados</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entrenadores.map(entrenador => (
              <tr key={entrenador.id}>
                <td>{entrenador.apellido}, {entrenador.nombre}</td>
                <td>{entrenador.correo?.split('@')[0]}</td>
                <td>{entrenador.activo ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button onClick={() => navigate(`/admin/entrenadores/${entrenador.id}/editar`)}>
                    Editar
                  </button>
                  <button onClick={() => toggleEstado(entrenador)}>
                    {entrenador.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => eliminarEntrenador(entrenador)}>
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