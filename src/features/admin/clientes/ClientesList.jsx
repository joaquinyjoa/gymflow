import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import ConfirmModal from '../../../components/ConfirmModal'

function formatFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function estaVencido(fecha) {
  if (!fecha) return false
  return fecha < new Date().toISOString().split('T')[0]
}

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

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmItem, setConfirmItem] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargarClientes() }, [])

  async function cargarClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, correo, estado, fecha_vencimiento, edad, peso, altura, nivel_actividad, objetivo, genero')
      .order('apellido', { ascending: true })

    if (error) setError(error.message)
    else setClientes(data)
    setLoading(false)
  }

  async function toggleEstado(cliente) {
    const { error } = await supabase
      .from('clientes')
      .update({ estado: !cliente.estado })
      .eq('id', cliente.id)

    if (error) { setError('Error al actualizar estado'); return }
    setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, estado: !c.estado } : c))
  }

  async function eliminarCliente() {
    setEliminando(true)
    const { data } = await supabase
      .from('clientes').select('user_id').eq('id', confirmItem.id).single()

    if (!data?.user_id) {
      setError('Error al obtener datos del cliente')
      setEliminando(false)
      setConfirmItem(null)
      return
    }

    const { data: result, error } = await supabase.functions.invoke('eliminar-usuario', {
      body: { user_id: data.user_id }
    })

    if (error || result?.error) setError('Error al eliminar cliente')
    else setClientes(prev => prev.filter(c => c.id !== confirmItem.id))

    setEliminando(false)
    setConfirmItem(null)
  }

  if (loading) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando clientes...</p>
    </div>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <h1 className="admin-page-title">Clientes</h1>
          <p className="admin-page-subtitle">{clientes.length} registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/clientes/nuevo')}>
          + Nuevo cliente
        </button>
      </div>

      {error && <div className="msg-error mb-16">{error}</div>}

      {clientes.length === 0 ? (
        <div className="admin-empty">
          <h3>Sin clientes registrados</h3>
          <p>Creá el primer cliente con el botón de arriba.</p>
        </div>
      ) : (
        <div className="admin-cards-list">
          {clientes.map(cliente => {
            const vencido = estaVencido(cliente.fecha_vencimiento)
            return (
              <div key={cliente.id} className="admin-card">

                {/* Header: nombre + delete */}
                <div className="admin-card-top">
                  <div>
                    <div className="admin-card-nombre">{cliente.apellido}, {cliente.nombre}</div>
                    <div className="admin-card-dni">DNI {cliente.correo?.split('@')[0]}</div>
                  </div>
                  <button
                    className="btn btn-icon btn-icon-sm btn-icon-danger"
                    onClick={() => setConfirmItem(cliente)}
                    title="Eliminar"
                  >
                    <IconTrash />
                  </button>
                </div>

                {/* Stats compactas */}
                {(cliente.edad || cliente.peso || cliente.altura) && (
                  <div className="admin-card-stats">
                    {cliente.edad && (
                      <div className="admin-card-stat">
                        <span className="admin-card-stat-val">{cliente.edad}</span>
                        <span className="admin-card-stat-label">años</span>
                      </div>
                    )}
                    {cliente.peso && (
                      <div className="admin-card-stat">
                        <span className="admin-card-stat-val">{cliente.peso}</span>
                        <span className="admin-card-stat-label">kg</span>
                      </div>
                    )}
                    {cliente.altura && (
                      <div className="admin-card-stat">
                        <span className="admin-card-stat-val">{cliente.altura}</span>
                        <span className="admin-card-stat-label">cm</span>
                      </div>
                    )}
                    {cliente.nivel_actividad && (
                      <div className="admin-card-stat">
                        <span className="admin-card-stat-val">{cliente.nivel_actividad}</span>
                        <span className="admin-card-stat-label">actividad</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Meta: vencimiento, estado, objetivo */}
                <div className="admin-card-meta">
                  <div className="admin-card-meta-row">
                    <span className="admin-card-meta-label">Vencimiento</span>
                    <span className={vencido ? 'fecha-vencida' : 'fecha-vigente'}>
                      {formatFecha(cliente.fecha_vencimiento)}
                      {vencido && <span className="badge badge-danger" style={{ marginLeft: '8px' }}>Vencido</span>}
                    </span>
                  </div>
                  <div className="admin-card-meta-row">
                    <span className="admin-card-meta-label">Estado</span>
                    <span className={`badge ${cliente.estado && !vencido ? 'badge-success' : 'badge-neutral'}`}>
                      {cliente.estado && !vencido ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {cliente.genero && (
                    <div className="admin-card-meta-row">
                      <span className="admin-card-meta-label">Género</span>
                      <span className="fecha-vigente">{cliente.genero}</span>
                    </div>
                  )}
                  {cliente.objetivo && (
                    <p className="admin-card-objetivo">{cliente.objetivo}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="admin-card-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/admin/clientes/${cliente.id}/editar`)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => toggleEstado(cliente)}
                  >
                    {cliente.estado ? 'Desactivar' : 'Activar'}
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmItem)}
        titulo="¿Eliminar cliente?"
        desc={confirmItem ? `${confirmItem.nombre} ${confirmItem.apellido} será eliminado permanentemente. Esta acción no se puede deshacer.` : ''}
        onConfirm={eliminarCliente}
        onCancel={() => setConfirmItem(null)}
        loading={eliminando}
      />
    </>
  )
}
