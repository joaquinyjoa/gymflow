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

  if (loading) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando ejercicio...</p>
    </div>
  )

  if (error || !ejercicio) return (
    <div className="admin-empty">
      <h3>Ejercicio no encontrado</h3>
      <button className="btn btn-secondary" onClick={() => navigate('/entrenador/ejercicios')}>
        Volver a ejercicios
      </button>
    </div>
  )

  return (
    <div className="ent-detalle-page">

      <div className="ent-detalle-header">
        <button className="btn-back" onClick={() => navigate('/entrenador/ejercicios')}>
          ← Volver
        </button>
        <h1 className="admin-page-title">{ejercicio.nombre}</h1>
      </div>

      {ejercicio.enlace_video && (
        <img
          src={ejercicio.enlace_video}
          alt={ejercicio.nombre}
          className="ent-detalle-gif"
        />
      )}

      {/* Badges */}
      <div className="detalle-badges">
        {ejercicio.categoria && (
          <span className="badge badge-neutral">{ejercicio.categoria}</span>
        )}
        {ejercicio.nivel_dificultad && (
          <span className="badge badge-acento">{ejercicio.nivel_dificultad}</span>
        )}
        <span className={`badge ${ejercicio.activo ? 'badge-success' : 'badge-neutral'}`}>
          {ejercicio.activo ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Info básica */}
      <div className="admin-form-section" style={{ marginTop: '20px' }}>
        <p className="admin-form-section-title">Músculos</p>
        <div className="admin-card-meta" style={{ paddingTop: '12px' }}>
          <div className="admin-card-meta-row">
            <span className="admin-card-meta-label">Principal</span>
            <span>{ejercicio.musculo_principal || '—'}</span>
          </div>
          <div className="admin-card-meta-row">
            <span className="admin-card-meta-label">Secundarios</span>
            <span>{ejercicio.musculos_secundarios?.join(', ') || 'Ninguno'}</span>
          </div>
          <div className="admin-card-meta-row">
            <span className="admin-card-meta-label">Equipamiento</span>
            <span>{ejercicio.equipamiento?.join(', ') || 'Ninguno'}</span>
          </div>
        </div>
      </div>

      {ejercicio.descripcion && (
        <div className="admin-form-section">
          <p className="admin-form-section-title">Descripción</p>
          <p className="detalle-texto" style={{ paddingTop: '8px' }}>{ejercicio.descripcion}</p>
        </div>
      )}

      {ejercicio.instrucciones && (
        <div className="admin-form-section">
          <p className="admin-form-section-title">Instrucciones</p>
          <p className="detalle-texto" style={{ paddingTop: '8px' }}>{ejercicio.instrucciones}</p>
        </div>
      )}

      {ejercicio.consejos && (
        <div className="admin-form-section">
          <p className="admin-form-section-title">Consejos</p>
          <p className="detalle-texto" style={{ paddingTop: '8px' }}>{ejercicio.consejos}</p>
        </div>
      )}

      <div className="ent-detalle-acciones">
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/entrenador/ejercicios/${id}/editar`)}
        >
          Editar ejercicio
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/entrenador/ejercicios')}
        >
          Volver
        </button>
      </div>

    </div>
  )
}
