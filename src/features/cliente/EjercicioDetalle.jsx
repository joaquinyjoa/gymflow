import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import '../../styles/features/cliente.css'

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

  if (loading) return (
    <div className="page">
      <div className="container">
        <div className="estado-center">
          <p className="text-muted">Cargando ejercicio...</p>
        </div>
      </div>
    </div>
  )

  if (!ejercicio) return (
    <div className="page">
      <div className="container">
        <div className="estado-center">
          <p className="text-muted">Ejercicio no encontrado</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="container">
        <div className="detalle-page">

          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <h1>{ejercicio.nombre}</h1>

          {/* GIF grande */}
          {ejercicio.enlace_video && (
            <div className="detalle-gif">
              <img src={ejercicio.enlace_video} alt={ejercicio.nombre} />
            </div>
          )}

          {/* Info básica */}
          <div className="detalle-badges">
            {ejercicio.musculo_principal && (
              <span className="badge badge-acento">{ejercicio.musculo_principal}</span>
            )}
            {ejercicio.nivel_dificultad && (
              <span className="badge badge-neutral">{ejercicio.nivel_dificultad}</span>
            )}
            {ejercicio.categoria && (
              <span className="badge badge-neutral">{ejercicio.categoria}</span>
            )}
          </div>

          {/* Músculos secundarios */}
          {ejercicio.musculos_secundarios?.length > 0 && (
            <div className="detalle-seccion">
              <p className="detalle-seccion-titulo">Músculos secundarios</p>
              <p>{ejercicio.musculos_secundarios.join(', ')}</p>
            </div>
          )}

          {/* Equipamiento */}
          {ejercicio.equipamiento?.length > 0 && (
            <div className="detalle-seccion">
              <p className="detalle-seccion-titulo">Equipamiento</p>
              <p>{ejercicio.equipamiento.join(', ')}</p>
            </div>
          )}

          {/* Descripción */}
          {ejercicio.descripcion && (
            <div className="detalle-seccion">
              <p className="detalle-seccion-titulo">Descripción</p>
              <p className="detalle-texto">{ejercicio.descripcion}</p>
            </div>
          )}

          {/* Instrucciones */}
          {ejercicio.instrucciones && (
            <div className="detalle-seccion">
              <p className="detalle-seccion-titulo">Instrucciones</p>
              <p className="detalle-texto">{ejercicio.instrucciones}</p>
            </div>
          )}

          {/* Consejos */}
          {ejercicio.consejos && (
            <div className="detalle-consejos">
              <p className="detalle-consejos-titulo">Consejos</p>
              <p className="detalle-texto">{ejercicio.consejos}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
