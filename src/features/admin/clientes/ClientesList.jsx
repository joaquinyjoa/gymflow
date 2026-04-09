import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import ConfirmModal from '../../../components/ConfirmModal'
import EmptyState from '../../../components/EmptyState'
import { useToast } from '../../../components/Toast'
import { SkeletonList } from '../../../components/Skeleton'

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
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos') // todos | activos | vencidos
  const [renovandoId, setRenovandoId] = useState(null)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [metodoPagoRenovar, setMetodoPagoRenovar] = useState('efectivo')
  const [guardandoFecha, setGuardandoFecha] = useState(false)
  const [resetPinId, setResetPinId] = useState(null)
  const [nuevoPin, setNuevoPin] = useState('')
  const [guardandoPin, setGuardandoPin] = useState(false)
  const [pinMsg, setPinMsg] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [historialId, setHistorialId] = useState(null)
  const [historialData, setHistorialData] = useState({}) // { [clienteId]: [] }
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => { cargarClientes() }, [])

  async function cargarClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre, apellido, correo, estado, fecha_vencimiento, edad, peso, altura, nivel_actividad, objetivo, genero, metodo_pago')
      .order('apellido', { ascending: true })

    if (error) setError(error.message)
    else setClientes(data)
    setLoading(false)
  }

  const hoy = new Date().toISOString().split('T')[0]

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    const dni = c.correo?.split('@')[0] ?? ''
    const matchBusqueda = !q || dni.includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q)
    const vencido = estaVencido(c.fecha_vencimiento)
    const matchEstado =
      filtroEstado === 'todos' ? true :
      filtroEstado === 'activos' ? (c.estado && !vencido) :
      filtroEstado === 'vencidos' ? vencido : true
    return matchBusqueda && matchEstado
  })

  async function renovarMembresia() {
    if (!nuevaFecha || !renovandoId) return
    setGuardandoFecha(true)

    const [{ error }, { error: errorRenovacion }] = await Promise.all([
      supabase.from('clientes')
        .update({ fecha_vencimiento: nuevaFecha, estado: true, metodo_pago: metodoPagoRenovar })
        .eq('id', renovandoId),
      supabase.from('renovaciones').insert({
        cliente_id: renovandoId,
        fecha_vencimiento: nuevaFecha,
        metodo_pago: metodoPagoRenovar,
        fecha_renovacion: new Date().toISOString().split('T')[0],
      }),
    ])

    if (!error && !errorRenovacion) {
      setClientes(prev => prev.map(c =>
        c.id === renovandoId ? { ...c, fecha_vencimiento: nuevaFecha, estado: true, metodo_pago: metodoPagoRenovar } : c
      ))
      // Invalida el caché del historial para que recargue la próxima vez
      setHistorialData(prev => { const next = { ...prev }; delete next[renovandoId]; return next })
      setRenovandoId(null)
      setNuevaFecha('')
      setMetodoPagoRenovar('efectivo')
      toast('Membresía renovada')
    } else {
      setError('Error al renovar membresía')
    }
    setGuardandoFecha(false)
  }

  async function resetearPin() {
    if (!nuevoPin || nuevoPin.length < 4) { setPinMsg('El PIN debe tener al menos 4 caracteres'); return }
    setGuardandoPin(true)
    setPinMsg('')
    const cliente = clientes.find(c => c.id === resetPinId)
    if (!cliente) { setGuardandoPin(false); return }

    const { data: clienteData } = await supabase
      .from('clientes').select('user_id').eq('id', resetPinId).single()

    if (!clienteData?.user_id) {
      setPinMsg('Error: cliente sin usuario asociado')
      setGuardandoPin(false)
      return
    }

    const { data, error } = await supabase.functions.invoke('actualizar-pin', {
      body: { user_id: clienteData.user_id, pin: nuevoPin }
    })

    if (error || data?.error) {
      setPinMsg('Error al resetear PIN')
    } else {
      toast('PIN reseteado correctamente')
      setResetPinId(null)
      setNuevoPin('')
      setPinMsg('')
    }
    setGuardandoPin(false)
  }

  async function toggleEstado(cliente) {
    setTogglingId(cliente.id)
    const { error } = await supabase
      .from('clientes')
      .update({ estado: !cliente.estado })
      .eq('id', cliente.id)

    if (error) { setError('Error al actualizar estado') }
    else {
      setClientes(prev => prev.map(c => c.id === cliente.id ? { ...c, estado: !c.estado } : c))
      toast(cliente.estado ? 'Cliente desactivado' : 'Cliente activado')
    }
    setTogglingId(null)
  }

  async function toggleHistorial(clienteId) {
    if (historialId === clienteId) { setHistorialId(null); return }
    setHistorialId(clienteId)
    if (historialData[clienteId]) return
    setCargandoHistorial(true)
    const { data } = await supabase
      .from('renovaciones')
      .select('id, fecha_renovacion, fecha_vencimiento, metodo_pago')
      .eq('cliente_id', clienteId)
      .order('fecha_renovacion', { ascending: false })
    setHistorialData(prev => ({ ...prev, [clienteId]: data ?? [] }))
    setCargandoHistorial(false)
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
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <div className="skeleton" style={{ width: '100px', height: '24px', borderRadius: '6px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '6px' }} />
        </div>
      </div>
      <SkeletonList count={4} />
    </>
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

      {/* Búsqueda y filtros */}
      <div className="admin-filtros">
        <input
          className="input"
          type="text"
          placeholder="Buscar por nombre, apellido o DNI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoComplete="off"
        />
        <div className="admin-filtro-tabs">
          {[['todos','Todos'],['activos','Activos'],['vencidos','Vencidos']].map(([val, label]) => (
            <button
              key={val}
              className={`admin-filtro-tab${filtroEstado === val ? ' activo' : ''}`}
              onClick={() => setFiltroEstado(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {clientesFiltrados.length === 0 ? (
        <EmptyState
          tipo={clientes.length === 0 ? 'clientes' : 'busqueda'}
          titulo={clientes.length === 0 ? 'Sin clientes registrados' : 'Sin resultados'}
          descripcion={clientes.length === 0 ? 'Creá el primer cliente con el botón de arriba.' : 'Probá con otro término o filtro.'}
        />
      ) : (
        <div className="admin-cards-list">
          {clientesFiltrados.map(cliente => {
            const vencido = estaVencido(cliente.fecha_vencimiento)
            const renovando = renovandoId === cliente.id
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
                  {cliente.metodo_pago && (
                    <div className="admin-card-meta-row">
                      <span className="admin-card-meta-label">Último pago</span>
                      <span className="fecha-vigente" style={{ textTransform: 'capitalize' }}>{cliente.metodo_pago}</span>
                    </div>
                  )}
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

                {/* Panel reset PIN */}
                {resetPinId === cliente.id && (
                  <div className="admin-renovar-panel">
                    <p className="admin-renovar-label">Nuevo PIN para {cliente.nombre}</p>
                    {pinMsg && (
                      <div className="msg-error" style={{ marginBottom: '8px' }}>{pinMsg}</div>
                    )}
                    <div className="admin-renovar-row">
                      <input
                        className="input"
                        type="password"
                        inputMode="numeric"
                        placeholder="Nuevo PIN (mín. 4 caracteres)"
                        value={nuevoPin}
                        onChange={e => setNuevoPin(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={resetearPin}
                        disabled={guardandoPin}
                      >
                        {guardandoPin ? '...' : 'Guardar'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setResetPinId(null); setNuevoPin(''); setPinMsg('') }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Panel historial renovaciones */}
                {historialId === cliente.id && (
                  <div className="admin-renovar-panel">
                    <p className="admin-renovar-label">Historial de pagos — {cliente.nombre}</p>
                    {cargandoHistorial ? (
                      <p className="text-muted" style={{ fontSize: '13px' }}>Cargando...</p>
                    ) : (historialData[cliente.id] ?? []).length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '13px' }}>Sin renovaciones registradas.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {(historialData[cliente.id] ?? []).map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                            <span className="text-muted">{formatFecha(r.fecha_renovacion)}</span>
                            <span>Vence: <strong>{formatFecha(r.fecha_vencimiento)}</strong></span>
                            <span className={`badge ${r.metodo_pago === 'efectivo' ? 'badge-neutral' : 'badge-acento'}`} style={{ textTransform: 'capitalize' }}>{r.metodo_pago}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="btn btn-ghost" style={{ marginTop: '10px' }} onClick={() => setHistorialId(null)}>Cerrar</button>
                  </div>
                )}

                {/* Panel renovar membresía */}
                {renovando && (
                  <div className="admin-renovar-panel">
                    <p className="admin-renovar-label">Renovar membresía — {cliente.nombre}</p>
                    <div className="admin-renovar-row">
                      <input
                        className="input"
                        type="date"
                        value={nuevaFecha}
                        min={hoy}
                        onChange={e => setNuevaFecha(e.target.value)}
                      />
                      <select
                        className="input"
                        value={metodoPagoRenovar}
                        onChange={e => setMetodoPagoRenovar(e.target.value)}
                        style={{ minWidth: 0 }}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                    <div className="admin-renovar-row" style={{ marginTop: '8px' }}>
                      <button
                        className="btn btn-primary"
                        onClick={renovarMembresia}
                        disabled={!nuevaFecha || guardandoFecha}
                      >
                        {guardandoFecha ? '...' : 'Guardar'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setRenovandoId(null); setNuevaFecha(''); setMetodoPagoRenovar('efectivo') }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

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
                    onClick={() => { setRenovandoId(cliente.id); setNuevaFecha('') }}
                  >
                    Renovar
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => toggleEstado(cliente)}
                    disabled={togglingId === cliente.id}
                  >
                    {togglingId === cliente.id ? '...' : (cliente.estado ? 'Desactivar' : 'Activar')}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setResetPinId(cliente.id); setNuevoPin(''); setPinMsg('') }}
                  >
                    Reset PIN
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => toggleHistorial(cliente.id)}
                  >
                    Historial
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
