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
      .select('id, nombre, musculo_principal, nivel_dificultad, activo, categoria, enlace_video')
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

    if (error) { alert('Error al actualizar ejercicio'); return }

    setEjercicios(prev =>
      prev.map(e => e.id === ejercicio.id ? { ...e, activo: !e.activo } : e)
    )
  }

  async function eliminarEjercicio(ejercicio) {
    const confirmar = window.confirm(`¿Eliminar "${ejercicio.nombre}"? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    // Extraer el path del GIF desde la URL pública
    // La URL es algo como: https://xxx.supabase.co/storage/v1/object/public/ejercicios/ejercicios/nombre.gif
    if (ejercicio.enlace_video) {
      const path = ejercicio.enlace_video.split('/storage/v1/object/public/ejercicios/')[1]
      if (path) {
        await supabase.storage
          .from('ejercicios')
          .remove([path])
      }
    }

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
        <div>
          {ejercicios.map(ejercicio => (
            <div key={ejercicio.id}>
              {/* GIF */}
              {ejercicio.enlace_video ? (
                <img
                  src={ejercicio.enlace_video}
                  alt={ejercicio.nombre}
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '120px', height: '120px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p>Sin GIF</p>
                </div>
              )}

              {/* Info */}
              <div>
                <h3>{ejercicio.nombre}</h3>
                <p>{ejercicio.musculo_principal} — {ejercicio.categoria}</p>
                <p>{ejercicio.nivel_dificultad}</p>
                <p>{ejercicio.activo ? 'Activo' : 'Inactivo'}</p>
              </div>

              {/* Acciones */}
              <div>
                <button onClick={() => navigate(`/entrenador/ejercicios/${ejercicio.id}`)}>
                  Ver más
                </button>
                <button onClick={() => navigate(`/entrenador/ejercicios/${ejercicio.id}/editar`)}>
                  Editar
                </button>
                <button onClick={() => toggleActivo(ejercicio)}>
                  {ejercicio.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => eliminarEjercicio(ejercicio)}>
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