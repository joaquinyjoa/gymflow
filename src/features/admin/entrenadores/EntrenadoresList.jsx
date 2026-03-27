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
    const { data, error } = await supabase
      .from('entrenadores')
      .select('id, nombre, apellido, correo, user_id')
      .order('apellido', { ascending: true })

    if (error) setError(error.message)
    else setEntrenadores(data)
    setLoading(false)
  }

  async function toggleEstado(entrenador) {
    const { data: userData } = await supabase
      .from('users')
      .select('activo')
      .eq('id', entrenador.user_id)
      .single()

    const { error } = await supabase
      .from('users')
      .update({ activo: !userData.activo })
      .eq('id', entrenador.user_id)

    if (error) {
      alert('Error al actualizar estado')
      return
    }

    setEntrenadores(prev =>
      prev.map(e => e.id === entrenador.id ? { ...e, activo: !e.activo } : e)
    )
  }

  async function eliminarEntrenador(entrenador) {
    const confirmar = window.confirm(`¿Eliminar a ${entrenador.nombre} ${entrenador.apellido}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const { error } = await supabase
      .from('entrenadores')
      .delete()
      .eq('id', entrenador.id)

    if (error) alert('Error al eliminar entrenador')
    else setEntrenadores(prev => prev.filter(e => e.id !== entrenador.id))
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
              <th>DNI</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entrenadores.map(entrenador => (
              <tr key={entrenador.id}>
                <td>{entrenador.apellido}, {entrenador.nombre}</td>
                <td>{entrenador.correo?.split('@')[0]}</td>
                <td>{entrenador.correo}</td>
                <td>
                  <button onClick={() => navigate(`/admin/entrenadores/${entrenador.id}/editar`)}>
                    Editar
                  </button>
                  <button onClick={() => toggleEstado(entrenador)}>
                    Activar/Desactivar
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