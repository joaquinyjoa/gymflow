import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../store/AuthContext'
import ConfirmModal from '../../../components/ConfirmModal'

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

export default function EjerciciosList() {
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)
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

    if (error) { setError('Error al actualizar ejercicio'); return }

    setEjercicios(prev =>
      prev.map(e => e.id === ejercicio.id ? { ...e, activo: !e.activo } : e)
    )
  }

  async function eliminarEjercicio() {
    setEliminando(true)
    if (confirmItem.enlace_video) {
      const path = confirmItem.enlace_video.split('/storage/v1/object/public/ejercicios/')[1]
      if (path) {
        await supabase.storage.from('ejercicios').remove([path])
      }
    }

    const { error } = await supabase
      .from('ejercicios')
      .delete()
      .eq('id', confirmItem.id)

    if (error) setError('Error al eliminar ejercicio')
    else setEjercicios(prev => prev.filter(e => e.id !== confirmItem.id))

    setEliminando(false)
    setConfirmItem(null)
  }

  if (loading) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando ejercicios...</p>
    </div>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Ejercicios</h1>
          <p className="admin-page-subtitle">{ejercicios.length} creados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/entrenador/ejercicios/nuevo')}>
          + Nuevo ejercicio
        </button>
      </div>

      {error && <div className="msg-error mb-16">{error}</div>}

      {ejercicios.length === 0 ? (
        <div className="admin-empty">
          <h3>Sin ejercicios creados</h3>
          <p>Creá tu primer ejercicio con el botón de arriba.</p>
        </div>
      ) : (
        <div className="ent-ejercicios-grid">
          {ejercicios.map(ejercicio => (
            <div key={ejercicio.id} className="ent-ejercicio-card">

              <div className="ent-ejercicio-card-body">
                {ejercicio.enlace_video ? (
                  <img
                    src={ejercicio.enlace_video}
                    alt={ejercicio.nombre}
                    className="ent-ejercicio-thumb"
                  />
                ) : (
                  <div className="ent-ejercicio-thumb-placeholder">Sin GIF</div>
                )}

                <div className="ent-ejercicio-info">
                  <div className="ent-ejercicio-nombre">{ejercicio.nombre}</div>
                  <div className="ent-ejercicio-sub">{ejercicio.categoria}</div>
                  <div className="ent-ejercicio-badges">
                    {ejercicio.musculo_principal && (
                      <span className="badge badge-neutral">{ejercicio.musculo_principal}</span>
                    )}
                    {ejercicio.nivel_dificultad && (
                      <span className="badge badge-acento">{ejercicio.nivel_dificultad}</span>
                    )}
                    <span className={`badge ${ejercicio.activo ? 'badge-success' : 'badge-neutral'}`}>
                      {ejercicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ent-ejercicio-card-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/entrenador/ejercicios/${ejercicio.id}`)}
                >
                  Ver
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/entrenador/ejercicios/${ejercicio.id}/editar`)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => toggleActivo(ejercicio)}
                >
                  {ejercicio.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  className="btn btn-icon btn-icon-sm btn-icon-danger"
                  onClick={() => setConfirmItem(ejercicio)}
                  title="Eliminar"
                >
                  <IconTrash />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmItem)}
        titulo="¿Eliminar ejercicio?"
        desc={confirmItem ? `"${confirmItem.nombre}" será eliminado permanentemente, incluyendo su GIF. Esta acción no se puede deshacer.` : ''}
        onConfirm={eliminarEjercicio}
        onCancel={() => setConfirmItem(null)}
        loading={eliminando}
      />
    </>
  )
}
