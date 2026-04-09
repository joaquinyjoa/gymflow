import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../store/AuthContext'
import ConfirmModal from '../../../components/ConfirmModal'
import EmptyState from '../../../components/EmptyState'
import { SkeletonList } from '../../../components/Skeleton'
import { useToast } from '../../../components/Toast'

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

export default function RutinasList() {
  const [rutinas, setRutinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

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

    if (error) { setError('Error al actualizar rutina'); return }
    setRutinas(prev => prev.map(r => r.id === rutina.id ? { ...r, activo: !r.activo } : r))
    toast(rutina.activo ? 'Rutina desactivada' : 'Rutina activada')
  }

  async function eliminarRutina() {
    setEliminando(true)
    const { error } = await supabase
      .from('rutinas')
      .delete()
      .eq('id', confirmItem.id)

    if (error) setError('Error al eliminar rutina')
    else {
      setRutinas(prev => prev.filter(r => r.id !== confirmItem.id))
      toast('Rutina eliminada')
    }
    setEliminando(false)
    setConfirmItem(null)
  }

  if (loading) return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '6px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '6px' }} />
        </div>
        <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
      </div>
      <SkeletonList count={3} />
    </>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Rutinas</h1>
          <p className="admin-page-subtitle">{rutinas.length} creadas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/entrenador/rutinas/nuevo')}>
          + Nueva rutina
        </button>
      </div>

      {error && <div className="msg-error mb-16">{error}</div>}

      {rutinas.length === 0 ? (
        <EmptyState
          tipo="rutinas"
          titulo="Sin rutinas creadas"
          descripcion="Creá tu primera rutina con el botón de arriba."
        />
      ) : (
        <div className="admin-cards-list">
          {rutinas.map(rutina => {
            const cantEjercicios = rutina.rutinas_ejercicios?.[0]?.count ?? 0
            return (
              <div key={rutina.id} className="admin-card">

                <div className="admin-card-top">
                  <div>
                    <div className="admin-card-nombre">{rutina.nombre}</div>
                    <div className="admin-card-dni">{cantEjercicios} ejercicio{cantEjercicios !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    className="btn btn-icon btn-icon-sm btn-icon-danger"
                    onClick={() => setConfirmItem(rutina)}
                    title="Eliminar"
                  >
                    <IconTrash />
                  </button>
                </div>

                <div className="admin-card-meta">
                  <div className="admin-card-meta-row">
                    <span className="admin-card-meta-label">Dificultad</span>
                    <span className="badge badge-acento">{rutina.nivel_dificultad}</span>
                  </div>
                  <div className="admin-card-meta-row">
                    <span className="admin-card-meta-label">Estado</span>
                    <span className={`badge ${rutina.activo ? 'badge-success' : 'badge-neutral'}`}>
                      {rutina.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {rutina.objetivo && (
                    <p className="admin-card-objetivo">{rutina.objetivo}</p>
                  )}
                </div>

                <div className="admin-card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/entrenador/rutinas/${rutina.id}/editar`)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => navigate(`/entrenador/rutinas/${rutina.id}/asignar`)}
                  >
                    Asignar
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => toggleActivo(rutina)}
                  >
                    {rutina.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmItem)}
        titulo="¿Eliminar rutina?"
        desc={confirmItem ? `"${confirmItem.nombre}" será eliminada permanentemente. Esta acción no se puede deshacer.` : ''}
        onConfirm={eliminarRutina}
        onCancel={() => setConfirmItem(null)}
        loading={eliminando}
      />
    </>
  )
}
