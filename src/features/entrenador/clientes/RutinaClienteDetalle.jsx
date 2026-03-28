import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'

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
    const ejerciciosCombinados = ejerciciosBase
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

    setEjercicios(ejerciciosCombinados)
  }

  async function cargarEjerciciosDisponibles() {
    const { data } = await supabase
      .from('ejercicios')
      .select('id, nombre, musculo_principal')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    setEjerciciosDisponibles(data ?? [])
  }

  // Filtro del buscador de ejercicios
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
      // El ejercicio que se va a usar (puede ser distinto al base si hay override)
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
        // ejercicio_id es el ejercicio BASE de la plantilla (la clave del override)
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

  async function eliminarOverride(ejercicio) {
    if (!ejercicio.override?.id) return
    const confirmar = window.confirm('¿Restaurar el ejercicio original de la plantilla?')
    if (!confirmar) return

    const { error } = await supabase
      .from('rutinas_clientes_ejercicios')
      .delete()
      .eq('id', ejercicio.override.id)

    if (error) { alert('Error al restaurar'); return }

    setExito('Ejercicio restaurado al original')
    cargarRutina()
  }

  if (loading) return <p>Cargando...</p>
  if (!rutina) return <p>No se encontró la rutina</p>

  return (
    <div>
      <button onClick={() => navigate('/entrenador/clientes')}>← Volver</button>

      {/* Selector de días */}
        {todasLasAsignaciones.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', margin: '12px 0', flexWrap: 'wrap' }}>
            {todasLasAsignaciones.map(a => (
            <button
                key={a.id}
                onClick={() => navigate(`/entrenador/clientes/${clienteId}/rutina/${a.id}`)}
                style={{
                padding: '8px 12px',
                background: String(a.id) === String(rutinaClienteId) ? '#333' : '#eee',
                color: String(a.id) === String(rutinaClienteId) ? 'white' : 'black',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                }}
            >
                {DIAS.find(d => d.value === a.dia_semana)?.label} — {a.rutinas?.nombre}
            </button>
            ))}
        </div>
        )}

      <h1>Rutina de {rutina.clientes?.apellido}, {rutina.clientes?.nombre}</h1>
      <h2>{rutina.rutinas?.nombre}</h2>
      <p>Día: {DIAS.find(d => d.value === rutina.dia_semana)?.label}</p>
      <p>Dificultad: {rutina.rutinas?.nivel_dificultad}</p>

      {exito && <p style={{ color: 'green' }}>{exito}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Ejercicios ({ejercicios.length})</h2>

      {ejercicios.map((ej, index) => {
        const editando = ejercicioEditando?.ejercicioBaseId === ej.ejercicio_id

        return (
          <div
            key={ej.id}
            style={{
              border: ej.tieneOverride ? '2px solid orange' : '1px solid #ccc',
              margin: '8px 0',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong>{index + 1}. {ej.ejercicioFinal?.nombre}</strong>
                {ej.tieneOverride && (
                  <span style={{ color: 'orange', marginLeft: '8px' }}>⚡ Modificado para este cliente</span>
                )}
                <p>{ej.ejercicioFinal?.musculo_principal}</p>
                <p>
                  {ej.override?.series ?? ej.series} series ×{' '}
                  {ej.override?.repeticiones ?? ej.repeticiones} —{' '}
                  Descanso: {ej.override?.descanso_segundos ?? ej.descanso_segundos}s —{' '}
                  Intensidad: {ej.override?.porcentaje_fuerza ?? ej.porcentaje_fuerza}%
                </p>
                {(ej.override?.notas || ej.notas) && (
                  <p>Nota: {ej.override?.notas || ej.notas}</p>
                )}
                {ej.ejercicioFinal?.enlace_video && (
                  <img
                    src={ej.ejercicioFinal.enlace_video}
                    alt={ej.ejercicioFinal.nombre}
                    style={{ width: '100px', marginTop: '8px' }}
                  />
                )}
              </div>

              <div>
                <button onClick={() => editando ? cancelarEdicion() : iniciarEdicion(ej)}>
                  {editando ? 'Cancelar' : 'Modificar'}
                </button>
                {ej.tieneOverride && (
                  <button onClick={() => eliminarOverride(ej)}>
                    Restaurar original
                  </button>
                )}
              </div>
            </div>

            {/* Panel de edición */}
            {editando && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#f9f9f9' }}>
                <h3>Modificar solo para este cliente</h3>

                {/* Buscador de ejercicio con dropdown */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <label>Ejercicio</label>
                  <input
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
                    <div style={{
                      position: 'absolute',
                      background: 'white',
                      border: '1px solid #ccc',
                      width: '100%',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10
                    }}>
                      {ejerciciosFiltrados.length === 0 ? (
                        <div style={{ padding: '8px' }}>No se encontraron ejercicios</div>
                      ) : (
                        ejerciciosFiltrados.map(e => (
                          <div
                            key={e.id}
                            onMouseDown={() => seleccionarEjercicioOverride(e)}
                            style={{ padding: '8px', cursor: 'pointer' }}
                          >
                            {e.nombre} — {e.musculo_principal}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {ejercicioEditando.ejercicioNombre && (
                  <p style={{ color: 'green' }}>✓ Ejercicio seleccionado: {ejercicioEditando.ejercicioNombre}</p>
                )}

                <div>
                  <label>Series</label>
                  <input
                    type="number"
                    value={ejercicioEditando.series}
                    onChange={e => setEjercicioEditando(prev => ({ ...prev, series: e.target.value }))}
                    min={1} max={20}
                  />
                </div>

                <div>
                  <label>Repeticiones</label>
                  <input
                    type="text"
                    value={ejercicioEditando.repeticiones}
                    onChange={e => setEjercicioEditando(prev => ({ ...prev, repeticiones: e.target.value }))}
                    placeholder="Ej: 10-12 o Al fallo"
                  />
                </div>

                <div>
                  <label>Descanso (segundos)</label>
                  <input
                    type="number"
                    value={ejercicioEditando.descanso_segundos}
                    onChange={e => setEjercicioEditando(prev => ({ ...prev, descanso_segundos: e.target.value }))}
                    min={0} max={600}
                  />
                </div>

                <div>
                  <label>Intensidad (%)</label>
                  <input
                    type="number"
                    value={ejercicioEditando.porcentaje_fuerza}
                    onChange={e => setEjercicioEditando(prev => ({ ...prev, porcentaje_fuerza: e.target.value }))}
                    min={1} max={100}
                  />
                </div>

                <div>
                  <label>Notas</label>
                  <input
                    type="text"
                    value={ejercicioEditando.notas}
                    onChange={e => setEjercicioEditando(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Instrucciones especiales para este cliente"
                  />
                </div>

                <button onClick={guardarOverride}>Guardar cambios</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}