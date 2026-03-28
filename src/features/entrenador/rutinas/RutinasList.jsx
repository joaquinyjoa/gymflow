import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../store/AuthContext'

export default function RutinasList() {
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { perfil } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarRutinas()
  }, [perfil])

  async function cargarRutinas() {
    setLoading(true)
    const { data, error } = await supabase
      .from('rutinas')
      .select(`
        id,
        nombre,
        descripcion,
        objetivo,
        nivel_dificultad,
        activo,
        rutinas_ejercicios(count)
      `)
      .eq('created_by', perfil.id)
      .order('nombre', { ascending: true })

    if (error) setError(error.message)
    else setRutinas(data)
    setLoading(false)
  }

  async function toggleActivo(rutina) {
    const { error } = await supabase
      .from('rutinas')
      .update({ activo: !rutina.activo })
      .eq('id', rutina.id)

    if (error) { alert('Error al actualizar rutina'); return }

    setRutinas(prev =>
      prev.map(r => r.id === rutina.id ? { ...r, activo: !r.activo } : r)
    )
  }

  async function eliminarRutina(rutina) {
    const confirmar = window.confirm(`¿Eliminar "${rutina.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const { error } = await supabase
      .from('rutinas')
      .delete()
      .eq('id', rutina.id)

    if (error) alert('Error al eliminar rutina')
    else setRutinas(prev => prev.filter(r => r.id !== rutina.id))
  }

  if (loading) return <p>Cargando rutinas...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <div>
        <h1>Rutinas</h1>
        <p>Total: {rutinas.length} rutinas</p>
        <button onClick={() => navigate('/entrenador/rutinas/nuevo')}>
          + Nueva rutina
        </button>
      </div>

      {rutinas.length === 0 ? (
        <p>No hay rutinas creadas todavía</p>
      ) : (
        <div>
          {rutinas.map(rutina => (
            <div key={rutina.id}>
              <div>
                <h3>{rutina.nombre}</h3>
                <p>{rutina.objetivo}</p>
                <p>{rutina.nivel_dificultad}</p>
                <p>{rutina.rutinas_ejercicios?.[0]?.count ?? 0} ejercicios</p>
                <p>{rutina.activo ? 'Activa' : 'Inactiva'}</p>
              </div>
              <div>
                <button onClick={() => navigate(`/entrenador/rutinas/${rutina.id}/editar`)}>
                  Editar
                </button>
                <button onClick={() => navigate(`/entrenador/rutinas/${rutina.id}/asignar`)}>
                  Asignar a cliente
                </button>
                <button onClick={() => toggleActivo(rutina)}>
                  {rutina.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminarRutina(rutina)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}