import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function EjercicioDetalleCliente() {
  const { state } = useLocation()
  const { ejercicioId } = useParams()
  const navigate = useNavigate()

  const [ejercicio, setEjercicio] = useState(state?.ejercicio ?? null)
  const [loading, setLoading] = useState(!state?.ejercicio)

  useEffect(() => {
    // Si no viene por state (acceso directo por URL), lo buscamos
    if (!state?.ejercicio) cargarEjercicio()
  }, [ejercicioId])

  async function cargarEjercicio() {
    setLoading(true)
    const { data } = await supabase
      .from('ejercicios')
      .select('*')
      .eq('id', ejercicioId)
      .single()
    setEjercicio(data)
    setLoading(false)
  }

  if (loading) return <p>Cargando ejercicio...</p>
  if (!ejercicio) return <p>Ejercicio no encontrado</p>

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)}>← Volver</button>

      <h1 style={{ marginTop: '12px' }}>{ejercicio.nombre}</h1>

      {/* GIF grande */}
      {ejercicio.enlace_video && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <img
            src={ejercicio.enlace_video}
            alt={ejercicio.nombre}
            style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }}
          />
        </div>
      )}

      {/* Info básica */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
        <span style={{ padding: '4px 10px', background: '#eee', borderRadius: '20px', fontSize: '13px' }}>
          {ejercicio.musculo_principal}
        </span>
        <span style={{ padding: '4px 10px', background: '#eee', borderRadius: '20px', fontSize: '13px' }}>
          {ejercicio.nivel_dificultad}
        </span>
        <span style={{ padding: '4px 10px', background: '#eee', borderRadius: '20px', fontSize: '13px' }}>
          {ejercicio.categoria}
        </span>
      </div>

      {/* Músculos secundarios */}
      {ejercicio.musculos_secundarios?.length > 0 && (
        <div style={{ margin: '12px 0' }}>
          <strong>Músculos secundarios:</strong>
          <p>{ejercicio.musculos_secundarios.join(', ')}</p>
        </div>
      )}

      {/* Equipamiento */}
      {ejercicio.equipamiento?.length > 0 && (
        <div style={{ margin: '12px 0' }}>
          <strong>Equipamiento:</strong>
          <p>{ejercicio.equipamiento.join(', ')}</p>
        </div>
      )}

      {/* Descripción */}
      {ejercicio.descripcion && (
        <div style={{ margin: '16px 0' }}>
          <h2>Descripción</h2>
          <p style={{ lineHeight: '1.6', color: '#444' }}>{ejercicio.descripcion}</p>
        </div>
      )}

      {/* Instrucciones */}
      {ejercicio.instrucciones && (
        <div style={{ margin: '16px 0' }}>
          <h2>Instrucciones</h2>
          <p style={{ lineHeight: '1.8', color: '#444', whiteSpace: 'pre-line' }}>
            {ejercicio.instrucciones}
          </p>
        </div>
      )}

      {/* Consejos */}
      {ejercicio.consejos && (
        <div style={{ margin: '16px 0', padding: '12px', background: '#fffbe6', borderRadius: '8px', borderLeft: '4px solid #f0c040' }}>
          <h2>💡 Consejos</h2>
          <p style={{ lineHeight: '1.6', color: '#444', whiteSpace: 'pre-line' }}>
            {ejercicio.consejos}
          </p>
        </div>
      )}

    </div>
  )
}