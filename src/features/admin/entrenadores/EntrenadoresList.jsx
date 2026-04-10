import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import ConfirmModal from '../../../components/ConfirmModal'
import EmptyState from '../../../components/EmptyState'
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

export default function EntrenadoresList() {
  const [entrenadores, setEntrenadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { cargarEntrenadores() }, [])

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


  async function eliminarEntrenador() {
    setEliminando(true)
    const { data: result, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { user_id: confirmItem.user_id }
    })

    if (error || result?.error) setError('Error al eliminar entrenador')
    else {
      setEntrenadores(prev => prev.filter(e => e.id !== confirmItem.id))
      toast('Entrenador eliminado')
    }
    setEliminando(false)
    setConfirmItem(null)
  }

  if (loading) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando entrenadores...</p>
    </div>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Entrenadores</h1>
          <p className="admin-page-subtitle">{entrenadores.length} registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/entrenadores/nuevo')}>
          + Nuevo entrenador
        </button>
      </div>

      {error && <div className="msg-error mb-16">{error}</div>}

      {entrenadores.length === 0 ? (
        <EmptyState
          tipo="clientes"
          titulo="Sin entrenadores registrados"
          descripcion="Creá el primer entrenador con el botón de arriba."
        />
      ) : (
        <div className="admin-cards-list">
          {entrenadores.map(entrenador => (
            <div key={entrenador.id} className="admin-card">

              {/* Header: nombre + delete */}
              <div className="admin-card-top">
                <div>
                  <div className="admin-card-nombre">{entrenador.apellido}, {entrenador.nombre}</div>
                  <div className="admin-card-dni">DNI {entrenador.correo?.split('@')[0]}</div>
                </div>
                <button
                  className="btn btn-icon btn-icon-sm btn-icon-danger"
                  onClick={() => setConfirmItem(entrenador)}
                  title="Eliminar"
                >
                  <IconTrash />
                </button>
              </div>

              {/* Meta */}
              <div className="admin-card-meta">
                <div className="admin-card-meta-row">
                  <span className="admin-card-meta-label">Rol</span>
                  <span className="badge badge-acento">Entrenador</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="admin-card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/admin/entrenadores/${entrenador.id}/editar`)}
                >
                  Editar
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmItem)}
        titulo="¿Eliminar entrenador?"
        desc={confirmItem ? `${confirmItem.nombre} ${confirmItem.apellido} será eliminado permanentemente. Esta acción no se puede deshacer.` : ''}
        onConfirm={eliminarEntrenador}
        onCancel={() => setConfirmItem(null)}
        loading={eliminando}
      />
    </>
  )
}
