import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../store/AuthContext'

export default function EjerciciosList() {
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { perfil } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarEjercicios()
  }, [perfil])

  async function cargarEjercicios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ejercicios')
      .select('id, nombre, musculo_principal, nivel_dificultad, activo, categoria')
      .eq('created_by', perfil.id)
      .order('nombre', { ascending: true })

    if (error) setError(error.message)
    else setEjercicios(data)
    setLoading(false)
  }

  async function toggleActivo(ejercicio) {
    const { error } = await supabase
      .from('ejercicios')
      .update({ activo: !ejercicio.activo })
      .eq('id', ejercicio.id)

    if (error) {
      alert('Error al actualizar ejercicio')
      return
    }

    setEjercicios(prev =>
      prev.map(e => e.id === ejercicio.id ? { ...e, activo: !e.activo } : e)
    )
  }

  async function eliminarEjercicio(ejercicio) {
    const confirmar = window.confirm(`¿Eliminar "${ejercicio.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const { error } = await supabase
      .from('ejercicios')
      .delete()
      .eq('id', ejercicio.id)

    if (error) alert('Error al eliminar ejercicio')
    else setEjercicios(prev => prev.filter(e => e.id !== ejercicio.id))
  }

  if (loading) return <p>Cargando ejercicios...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <div>
        <h1>Ejercicios</h1>
        <p>Total: {ejercicios.length} ejercicios</p>
        <button onClick={() => navigate('/entrenador/ejercicios/nuevo')}>
          + Nuevo ejercicio
        </button>
      </div>

      {ejercicios.length === 0 ? (
        <p>No hay ejercicios creados todavía</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Músculo</th>
              <th>Categoría</th>
              <th>Dificultad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ejercicios.map(ejercicio => (
              <tr key={ejercicio.id}>
                <td>{ejercicio.nombre}</td>
                <td>{ejercicio.musculo_principal}</td>
                <td>{ejercicio.categoria}</td>
                <td>{ejercicio.nivel_dificultad}</td>
                <td>{ejercicio.activo ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button onClick={() => navigate(`/entrenador/ejercicios/${ejercicio.id}/editar`)}>
                    Editar
                  </button>
                  <button onClick={() => toggleActivo(ejercicio)}>
                    {ejercicio.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => eliminarEjercicio(ejercicio)}>
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