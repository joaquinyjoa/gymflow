import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import ConfirmModal from '../../../components/ConfirmModal'

const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

export default function RutinaClienteDetalle() {
  const [rutina, setRutina] = useState(null)
  const [ejercicios, setEjercicios] = useState([])
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([])
  const [todasLasAsignaciones, setTodasLasAsignaciones] = useState([])
  const [ejercicioEditando, setEjercicioEditando] = useState(null)
  const [busquedaEjercicio, setBusquedaEjercicio] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [confirmRestore, setConfirmRestore] = useState(null)
  const [restaurando, setRestaurando] = useState(false)

  const { clienteId, rutinaClienteId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    cargarDatos()
  }, [rutinaClienteId])

  async function cargarTodasLasAsignaciones() {
    const { data } = await supabase
      .from('rutinas_clientes')
      .select('id, dia_semana, rutinas(nombre)')
      .eq('cliente_id', clienteId)
      .order('dia_semana', { ascending: true })
    setTodasLasAsignaciones(data ?? [])
  }

  async function cargarDatos() {
    setLoading(true)
    await Promise.all([cargarRutina(), cargarEjerciciosDisponibles(), cargarTodasLasAsignaciones()])
    setLoading(false)
  }

  async function cargarRutina() {
    const { data: asignacion } = await supabase
      .from('rutinas_clientes')
      .select(`
        id,
        dia_semana,
        cliente_id,
        clientes(nombre, apellido),
        rutinas(
          id,
          nombre,
          descripcion,
          nivel_dificultad,
          rutinas_ejercicios(
            id,
            orden,
            series,
            repeticiones,
            descanso_segundos,
            porcentaje_fuerza,
            notas,
            ejercicio_id,
            ejercicio_alternativo_id,
            ejercicios!rutinas_ejercicios_ejercicio_id_fkey(id, nombre, musculo_principal, enlace_video)
          )
        )
      `)
      .eq('id', rutinaClienteId)
      .single()

    if (!asignacion) return
    setRutina(asignacion)

    const { data: overrides } = await supabase
      .from('rutinas_clientes_ejercicios')
      .select(`
        id,
        ejercicio_id,
        orden,
        series,
        repeticiones,
        descanso_segundos,
        porcentaje_fuerza,
        notas,
        ejercicios!rutinas_clientes_ejercicios_ejercicio_id_fkey(id, nombre, musculo_principal, enlace_video)
      `)
      .eq('rutina_cliente_id', rutinaClienteId)

    const ejerciciosBase = asignacion.rutinas?.rutinas_ejercicios ?? []
    const combinados = ejerciciosBase
      .sort((a, b) => a.orden - b.orden)
      .map(ej => {
        const override = overrides?.find(o => o.ejercicio_id === ej.ejercicio_id)
        return {
          ...ej,
          override: override ?? null,
          ejercicioFinal: override ? override.ejercicios : ej.ejercicios,
          tieneOverride: Boolean(override),
        }
      })

    setEjercicios(combinados)
  }

  async function cargarEjerciciosDisponibles() {
    const { data } = await supabase
      .from('ejercicios')
      .select('id, nombre, musculo_principal')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    setEjerciciosDisponibles(data ?? [])
  }

  const ejerciciosFiltrados = ejerciciosDisponibles.filter(e => {
    const busqueda = busquedaEjercicio.toLowerCase()
    return (
      e.nombre.toLowerCase().includes(busqueda) ||
      e.musculo_principal?.toLowerCase().includes(busqueda)
    )
  })

  function iniciarEdicion(ejercicio) {
    setBusquedaEjercicio(ejercicio.ejercicioFinal?.nombre ?? '')
    setEjercicioEditando({
      ejercicioBaseId: ejercicio.ejercicio_id,
      ejercicio_id: ejercicio.override?.ejercicio_id ?? ejercicio.ejercicio_id,
      ejercicioNombre: ejercicio.ejercicioFinal?.nombre ?? '',
      series: ejercicio.override?.series ?? ejercicio.series,
      repeticiones: ejercicio.override?.repeticiones ?? ejercicio.repeticiones,
      descanso_segundos: ejercicio.override?.descanso_segundos ?? ejercicio.descanso_segundos,
      porcentaje_fuerza: ejercicio.override?.porcentaje_fuerza ?? ejercicio.porcentaje_fuerza,
      notas: ejercicio.override?.notas ?? ejercicio.notas ?? '',
      overrideId: ejercicio.override?.id ?? null,
    })
    setError('')
    setExito('')
    setMostrarDropdown(false)
  }

  function seleccionarEjercicioOverride(ejercicio) {
    setEjercicioEditando(prev => ({
      ...prev,
      ejercicio_id: ejercicio.id,
      ejercicioNombre: ejercicio.nombre,
    }))
    setBusquedaEjercicio(ejercicio.nombre)
    setMostrarDropdown(false)
  }

  function cancelarEdicion() {
    setEjercicioEditando(null)
    setBusquedaEjercicio('')
    setError('')
  }

  async function guardarOverride() {
    if (!ejercicioEditando.ejercicio_id) { setError('Seleccioná un ejercicio'); return }
    if (!ejercicioEditando.series || ejercicioEditando.series < 1) { setError('Las series son obligatorias'); return }
    if (!ejercicioEditando.repeticiones?.trim()) { setError('Las repeticiones son obligatorias'); return }

    try {
      const datos = {
        rutina_cliente_id: Number(rutinaClienteId),
        ejercicio_id: Number(ejercicioEditando.ejercicioBaseId),
        series: Number(ejercicioEditando.series),
        repeticiones: String(ejercicioEditando.repeticiones),
        descanso_segundos: Number(ejercicioEditando.descanso_segundos),
        porcentaje_fuerza: Number(ejercicioEditando.porcentaje_fuerza),
        notas: ejercicioEditando.notas ?? '',
      }

      if (ejercicioEditando.overrideId) {
        const { error } = await supabase
          .from('rutinas_clientes_ejercicios')
          .update(datos)
          .eq('id', ejercicioEditando.overrideId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('rutinas_clientes_ejercicios')
          .insert(datos)
        if (error) throw new Error(error.message)
      }

      setExito('Ejercicio modificado correctamente para este cliente')
      setEjercicioEditando(null)
      setBusquedaEjercicio('')
      cargarRutina()
    } catch (err) {
      setError(err.message)
    }
  }

  async function eliminarOverride() {
    setRestaurando(true)
    const { error } = await supabase
      .from('rutinas_clientes_ejercicios')
      .delete()
      .eq('id', confirmRestore.overrideId)

    if (!error) {
      setExito('Ejercicio restaurado al original')
      cargarRutina()
    }

    setRestaurando(false)
    setConfirmRestore(null)
  }

  if (loading) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando rutina...</p>
    </div>
  )

  if (!rutina) return (
    <div className="admin-empty">
      <h3>Rutina no encontrada</h3>
      <button className="btn btn-secondary" onClick={() => navigate('/entrenador/clientes')}>
        Volver a clientes
      </button>
    </div>
  )

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <button className="btn-back" onClick={() => navigate('/entrenador/clientes')}>
            ← Volver
          </button>
          <h1 className="admin-page-title">
            {rutina.clientes?.apellido}, {rutina.clientes?.nombre}
          </h1>
          <p className="admin-page-subtitle">
            {rutina.rutinas?.nombre} · {DIAS.find(d => d.value === rutina.dia_semana)?.label}
          </p>
        </div>
      </div>

      {/* Selector de días */}
      {todasLasAsignaciones.length > 1 && (
        <div className="ent-dia-tabs">
          {todasLasAsignaciones.map(a => (
            <button
              key={a.id}
              className={`ent-dia-tab${String(a.id) === String(rutinaClienteId) ? ' activo' : ''}`}
              onClick={() => navigate(`/entrenador/clientes/${clienteId}/rutina/${a.id}`)}
            >
              {DIAS.find(d => d.value === a.dia_semana)?.label} — {a.rutinas?.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Badges de info */}
      <div className="detalle-badges" style={{ marginBottom: '20px' }}>
        {rutina.rutinas?.nivel_dificultad && (
          <span className="badge badge-acento">{rutina.rutinas.nivel_dificultad}</span>
        )}
        <span className="badge badge-neutral">{ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''}</span>
      </div>

      {exito && <div className="msg-exito mb-16">{exito}</div>}
      {error && <div className="msg-error mb-16">{error}</div>}

      {/* Lista de ejercicios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ejercicios.map((ej, index) => {
          const editando = ejercicioEditando?.ejercicioBaseId === ej.ejercicio_id

          return (
            <div
              key={ej.id}
              className={`ent-ej-override-card${ej.tieneOverride ? ' modificado' : ''}`}
            >
              <div className="ent-ej-override-top">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ent-ej-override-nombre">
                    {index + 1}. {ej.ejercicioFinal?.nombre}
                  </div>
                  {ej.tieneOverride && (
                    <span className="badge badge-acento" style={{ marginBottom: '6px', display: 'inline-block' }}>
                      Modificado para este cliente
                    </span>
                  )}
                  <div className="ent-ej-override-musculo">{ej.ejercicioFinal?.musculo_principal}</div>
                  <div className="ent-ej-override-meta">
                    {ej.override?.series ?? ej.series} series ×{' '}
                    {ej.override?.repeticiones ?? ej.repeticiones} ·{' '}
                    Descanso: {ej.override?.descanso_segundos ?? ej.descanso_segundos}s ·{' '}
                    Intensidad: {ej.override?.porcentaje_fuerza ?? ej.porcentaje_fuerza}%
                  </div>
                  {(ej.override?.notas || ej.notas) && (
                    <div className="ent-ej-override-nota">
                      Nota: {ej.override?.notas || ej.notas}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0 }}>
                  {ej.ejercicioFinal?.enlace_video && (
                    <img
                      src={ej.ejercicioFinal.enlace_video}
                      alt={ej.ejercicioFinal.nombre}
                      className="ent-ej-override-gif"
                    />
                  )}
                  <div className="ent-ej-override-acciones">
                    <button
                      className="btn btn-secondary"
                      onClick={() => editando ? cancelarEdicion() : iniciarEdicion(ej)}
                    >
                      {editando ? 'Cancelar' : 'Modificar'}
                    </button>
                    {ej.tieneOverride && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => setConfirmRestore({ overrideId: ej.override.id, nombre: ej.ejercicios?.nombre })}
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel de edición */}
              {editando && (
                <div className="ent-override-panel">
                  <div className="ent-override-panel-title">Modificar solo para este cliente</div>

                  {/* Buscador de ejercicio */}
                  <div className="input-group ent-search-wrap" style={{ marginBottom: '12px' }}>
                    <label className="input-label">Ejercicio</label>
                    <input
                      className="input"
                      type="text"
                      value={busquedaEjercicio}
                      onChange={e => {
                        setBusquedaEjercicio(e.target.value)
                        setMostrarDropdown(true)
                        setEjercicioEditando(prev => ({ ...prev, ejercicio_id: '' }))
                      }}
                      onFocus={() => setMostrarDropdown(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                      placeholder="Buscá por nombre o músculo..."
                      autoComplete="off"
                    />
                    {mostrarDropdown && busquedaEjercicio && (
                      <div className="ent-dropdown">
                        {ejerciciosFiltrados.length === 0 ? (
                          <div className="ent-dropdown-empty">No se encontraron ejercicios</div>
                        ) : (
                          ejerciciosFiltrados.map(e => (
                            <div
                              key={e.id}
                              className="ent-dropdown-item"
                              onMouseDown={() => seleccionarEjercicioOverride(e)}
                            >
                              {e.nombre} — {e.musculo_principal}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {ejercicioEditando.ejercicioNombre && (
                    <div className="ent-ejercicio-seleccionado">
                      Seleccionado: {ejercicioEditando.ejercicioNombre}
                    </div>
                  )}

                  <div className="ent-override-grid">
                    <div className="input-group">
                      <label className="input-label">Series</label>
                      <input
                        className="input"
                        type="number"
                        value={ejercicioEditando.series}
                        onChange={e => setEjercicioEditando(prev => ({ ...prev, series: e.target.value }))}
                        min={1} max={20}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Repeticiones</label>
                      <input
                        className="input"
                        type="text"
                        value={ejercicioEditando.repeticiones}
                        onChange={e => setEjercicioEditando(prev => ({ ...prev, repeticiones: e.target.value }))}
                        placeholder="Ej: 10-12 o Al fallo"
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Descanso (seg)</label>
                      <input
                        className="input"
                        type="number"
                        value={ejercicioEditando.descanso_segundos}
                        onChange={e => setEjercicioEditando(prev => ({ ...prev, descanso_segundos: e.target.value }))}
                        min={0} max={600}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Intensidad (%)</label>
                      <input
                        className="input"
                        type="number"
                        value={ejercicioEditando.porcentaje_fuerza}
                        onChange={e => setEjercicioEditando(prev => ({ ...prev, porcentaje_fuerza: e.target.value }))}
                        min={1} max={100}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label className="input-label">Notas</label>
                    <input
                      className="input"
                      type="text"
                      value={ejercicioEditando.notas}
                      onChange={e => setEjercicioEditando(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Instrucciones especiales para este cliente"
                    />
                  </div>

                  <button className="btn btn-primary" onClick={guardarOverride}>
                    Guardar cambios
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmModal
        open={Boolean(confirmRestore)}
        titulo="¿Restaurar ejercicio original?"
        desc={confirmRestore ? `Se restaurará el ejercicio original de la plantilla para "${confirmRestore.nombre}". Los cambios de este cliente se perderán.` : ''}
        onConfirm={eliminarOverride}
        onCancel={() => setConfirmRestore(null)}
        loading={restaurando}
      />
    </>
  )
}
