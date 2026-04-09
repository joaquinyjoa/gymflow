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

const CATEGORIAS = ['Todos', 'fuerza', 'cardio', 'general', 'stretching']

export default function EjerciciosList() {
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

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
    toast(ejercicio.activo ? 'Ejercicio desactivado' : 'Ejercicio activado')
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
    else {
      setEjercicios(prev => prev.filter(e => e.id !== confirmItem.id))
      toast('Ejercicio eliminado')
    }
    setEliminando(false)
    setConfirmItem(null)
  }

  const ejerciciosFiltrados = ejercicios.filter(e => {
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q || e.nombre.toLowerCase().includes(q) || e.musculo_principal?.toLowerCase().includes(q)
    const matchCategoria = categoriaFiltro === 'Todos' || e.categoria === categoriaFiltro
    return matchBusqueda && matchCategoria
  })

  if (loading) return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '6px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '6px' }} />
        </div>
        <div className="skeleton" style={{ width: '130px', height: '36px', borderRadius: '8px' }} />
      </div>
      <SkeletonList count={4} />
    </>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Ejercicios</h1>
          <p className="admin-page-subtitle">{ejerciciosFiltrados.length} de {ejercicios.length}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/entrenador/ejercicios/nuevo')}>
          + Nuevo ejercicio
        </button>
      </div>

      {error && <div className="msg-error mb-16">{error}</div>}

      {/* Filtros */}
      <div className="ent-filtros">
        <input
          className="input ent-filtro-busqueda"
          type="text"
          placeholder="Buscar por nombre o músculo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoComplete="off"
        />
        <div className="ent-filtro-cats">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              className={`ent-filtro-cat${categoriaFiltro === cat ? ' activo' : ''}`}
              onClick={() => setCategoriaFiltro(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {ejerciciosFiltrados.length === 0 ? (
        <EmptyState
          tipo={ejercicios.length === 0 ? 'ejercicios' : 'busqueda'}
          titulo={ejercicios.length === 0 ? 'Sin ejercicios creados' : 'Sin resultados'}
          descripcion={ejercicios.length === 0 ? 'Creá tu primer ejercicio con el botón de arriba.' : 'Probá con otro término de búsqueda.'}
        />
      ) : (
        <div className="ent-ejercicios-grid">
          {ejerciciosFiltrados.map(ejercicio => (
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
