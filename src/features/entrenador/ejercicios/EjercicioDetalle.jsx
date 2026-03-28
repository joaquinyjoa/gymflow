import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

export default function EjercicioDetalle() {
  const [ejercicio, setEjercicio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    cargarEjercicio()
  }, [id])

  async function cargarEjercicio() {
    const { data, error } = await supabase
      .from('ejercicios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) setError('Error al cargar ejercicio')
    else setEjercicio(data)
    setLoading(false)
  }

  if (loading) return <p>Cargando...</p>
  if (error) return <p>{error}</p>
  if (!ejercicio) return <p>Ejercicio no encontrado</p>

  return (
    <div>
      <button onClick={() => navigate('/entrenador/ejercicios')}>
        ← Volver
      </button>

      <h1>{ejercicio.nombre}</h1>

      {/* GIF */}
      {ejercicio.enlace_video && (
        <img
          src={ejercicio.enlace_video}
          alt={ejercicio.nombre}
          style={{ width: '250px' }}
        />
      )}

      {/* Info básica */}
      <div>
        <p><strong>Categoría:</strong> {ejercicio.categoria}</p>
        <p><strong>Músculo principal:</strong> {ejercicio.musculo_principal}</p>
        <p><strong>Músculos secundarios:</strong> {ejercicio.musculos_secundarios?.join(', ') || 'Ninguno'}</p>
        <p><strong>Dificultad:</strong> {ejercicio.nivel_dificultad}</p>
        <p><strong>Equipamiento:</strong> {ejercicio.equipamiento?.join(', ') || 'Ninguno'}</p>
        <p><strong>Estado:</strong> {ejercicio.activo ? 'Activo' : 'Inactivo'}</p>
      </div>

      {/* Descripción */}
      {ejercicio.descripcion && (
        <div>
          <h2>Descripción</h2>
          <p>{ejercicio.descripcion}</p>
        </div>
      )}

      {/* Instrucciones */}
      {ejercicio.instrucciones && (
        <div>
          <h2>Instrucciones</h2>
          <p>{ejercicio.instrucciones}</p>
        </div>
      )}

      {/* Consejos */}
      {ejercicio.consejos && (
        <div>
          <h2>Consejos</h2>
          <p>{ejercicio.consejos}</p>
        </div>
      )}

      <div>
        <button onClick={() => navigate(`/entrenador/ejercicios/${id}/editar`)}>
          Editar ejercicio
        </button>
      </div>
    </div>
  )
}