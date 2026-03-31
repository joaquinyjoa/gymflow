import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../store/AuthContext'

const estadoInicial = {
  nombre: '',
  descripcion: '',
  objetivo: '',
  nivel_dificultad: 'intermedio',
}

const ejercicioVacio = {
  ejercicio_id: '',
  ejercicio_alternativo_id: '',
  series: '',
  repeticiones: '',
  descanso_segundos: 60,
  porcentaje_fuerza: 100,
  notas: '',
}

export default function RutinaForm() {
  const [form, setForm] = useState(estadoInicial)
  const [ejerciciosRutina, setEjerciciosRutina] = useState([])
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([])
  const [nuevoEjercicio, setNuevoEjercicio] = useState(ejercicioVacio)
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { id } = useParams()
  const { perfil } = useAuth()
  const esEdicion = Boolean(id)

  useEffect(() => {
    cargarEjerciciosDisponibles()
    if (esEdicion) cargarRutina()
  }, [id])

  async function cargarEjerciciosDisponibles() {
    const { data } = await supabase
      .from('ejercicios')
      .select('id, nombre, musculo_principal')
      .eq('created_by', perfil.id)
      .eq('activo', true)
      .order('nombre', { ascending: true })
    setEjerciciosDisponibles(data ?? [])
  }

  async function cargarRutina() {
    setCargandoDatos(true)
    const { data, error } = await supabase
      .from('rutinas')
      .select(`*, rutinas_ejercicios(id, ejercicio_id, ejercicio_alternativo_id, orden, series, repeticiones, descanso_segundos, porcentaje_fuerza, notas)`)
      .eq('id', id)
      .single()

    if (error) {
      setError('Error al cargar rutina')
    } else {
      setForm({
        nombre: data.nombre ?? '',
        descripcion: data.descripcion ?? '',
        objetivo: data.objetivo ?? '',
        nivel_dificultad: data.nivel_dificultad ?? 'intermedio',
      })
      const ordenados = (data.rutinas_ejercicios ?? []).sort((a, b) => a.orden - b.orden)
      setEjerciciosRutina(ordenados)
    }
    setCargandoDatos(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleNuevoEjercicioChange(e) {
    const { name, value } = e.target
    setNuevoEjercicio(prev => ({ ...prev, [name]: value }))
  }

  function seleccionarEjercicio(index) {
    if (ejercicioSeleccionado === index) {
      setEjercicioSeleccionado(null)
      setNuevoEjercicio(ejercicioVacio)
      return
    }
    const ej = ejerciciosRutina[index]
    setEjercicioSeleccionado(index)
    setNuevoEjercicio({
      ejercicio_id: String(ej.ejercicio_id),
      ejercicio_alternativo_id: ej.ejercicio_alternativo_id ? String(ej.ejercicio_alternativo_id) : '',
      series: String(ej.series),
      repeticiones: String(ej.repeticiones),
      descanso_segundos: ej.descanso_segundos,
      porcentaje_fuerza: ej.porcentaje_fuerza,
      notas: ej.notas ?? '',
    })
  }

  function guardarEdicionEjercicio() {
    if (!nuevoEjercicio.ejercicio_id) { setError('Seleccioná un ejercicio'); return }
    if (!nuevoEjercicio.series || nuevoEjercicio.series < 1) { setError('Las series son obligatorias'); return }
    if (!nuevoEjercicio.repeticiones.trim()) { setError('Las repeticiones son obligatorias'); return }

    setEjerciciosRutina(prev => prev.map((ej, i) => {
      if (i !== ejercicioSeleccionado) return ej
      return {
        ...ej,
        ejercicio_id: Number(nuevoEjercicio.ejercicio_id),
        ejercicio_alternativo_id: nuevoEjercicio.ejercicio_alternativo_id ? Number(nuevoEjercicio.ejercicio_alternativo_id) : null,
        series: nuevoEjercicio.series,
        repeticiones: nuevoEjercicio.repeticiones,
        descanso_segundos: nuevoEjercicio.descanso_segundos,
        porcentaje_fuerza: nuevoEjercicio.porcentaje_fuerza,
        notas: nuevoEjercicio.notas,
        _nombre: ejerciciosDisponibles.find(e => e.id === Number(nuevoEjercicio.ejercicio_id))?.nombre,
        _nombreAlternativo: nuevoEjercicio.ejercicio_alternativo_id
          ? ejerciciosDisponibles.find(e => e.id === Number(nuevoEjercicio.ejercicio_alternativo_id))?.nombre
          : null,
      }
    }))

    setEjercicioSeleccionado(null)
    setNuevoEjercicio(ejercicioVacio)
    setError('')
  }

  function agregarEjercicio() {
    if (!nuevoEjercicio.ejercicio_id) { setError('Seleccioná un ejercicio'); return }
    if (!nuevoEjercicio.series || nuevoEjercicio.series < 1) { setError('Las series son obligatorias'); return }
    if (!nuevoEjercicio.repeticiones.trim()) { setError('Las repeticiones son obligatorias'); return }

    const yaExiste = ejerciciosRutina.some((e, i) => e.ejercicio_id === Number(nuevoEjercicio.ejercicio_id) && i !== ejercicioSeleccionado)
    if (yaExiste) { setError('Este ejercicio ya está en la rutina'); return }

    setEjerciciosRutina(prev => [
      ...prev,
      {
        ...nuevoEjercicio,
        ejercicio_id: Number(nuevoEjercicio.ejercicio_id),
        ejercicio_alternativo_id: nuevoEjercicio.ejercicio_alternativo_id ? Number(nuevoEjercicio.ejercicio_alternativo_id) : null,
        orden: prev.length + 1,
        _nombre: ejerciciosDisponibles.find(e => e.id === Number(nuevoEjercicio.ejercicio_id))?.nombre,
        _nombreAlternativo: nuevoEjercicio.ejercicio_alternativo_id
          ? ejerciciosDisponibles.find(e => e.id === Number(nuevoEjercicio.ejercicio_alternativo_id))?.nombre
          : null,
      }
    ])

    setNuevoEjercicio(ejercicioVacio)
    setError('')
  }

  function eliminarEjercicioDeRutina(index) {
    if (ejercicioSeleccionado === index) {
      setEjercicioSeleccionado(null)
      setNuevoEjercicio(ejercicioVacio)
    }
    setEjerciciosRutina(prev => prev.filter((_, i) => i !== index))
  }

  function moverEjercicio(index, direccion) {
    const nuevoIndex = index + direccion
    if (nuevoIndex < 0 || nuevoIndex >= ejerciciosRutina.length) return

    setEjerciciosRutina(prev => {
      const copia = [...prev]
      const temp = copia[index]
      copia[index] = copia[nuevoIndex]
      copia[nuevoIndex] = temp
      return copia
    })

    if (ejercicioSeleccionado === index) setEjercicioSeleccionado(nuevoIndex)
    else if (ejercicioSeleccionado === nuevoIndex) setEjercicioSeleccionado(index)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (form.nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); return }
    if (!form.objetivo.trim()) { setError('El objetivo es obligatorio'); return }
    if (ejerciciosRutina.length === 0) { setError('Agregá al menos un ejercicio a la rutina'); return }

    setLoading(true)
    try {
      let rutinaId = id

      if (esEdicion) {
        const { error } = await supabase.from('rutinas').update({ ...form }).eq('id', id)
        if (error) throw new Error(error.message)
        await supabase.from('rutinas_ejercicios').delete().eq('rutina_id', id)
      } else {
        const { data, error } = await supabase
          .from('rutinas')
          .insert({ ...form, created_by: perfil.id })
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        rutinaId = data.id
      }

      const ejerciciosParaInsertar = ejerciciosRutina.map((ej, index) => ({
        rutina_id: rutinaId,
        ejercicio_id: ej.ejercicio_id,
        ejercicio_alternativo_id: ej.ejercicio_alternativo_id ?? null,
        orden: index + 1,
        series: Number(ej.series),
        repeticiones: String(ej.repeticiones),
        descanso_segundos: Number(ej.descanso_segundos),
        porcentaje_fuerza: Number(ej.porcentaje_fuerza),
        notas: ej.notas ?? '',
      }))

      const { error: ejError } = await supabase.from('rutinas_ejercicios').insert(ejerciciosParaInsertar)
      if (ejError) throw new Error(ejError.message)

      navigate('/entrenador/rutinas')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (cargandoDatos) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando datos de la rutina...</p>
    </div>
  )

  return (
    <div className="admin-form-page">

      <div className="admin-form-header">
        <button className="btn-back" onClick={() => navigate('/entrenador/rutinas')}>
          ← Volver
        </button>
        <h1 className="admin-page-title">{esEdicion ? 'Editar rutina' : 'Nueva rutina'}</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Datos de la rutina ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Datos de la rutina</p>
          <div className="admin-form-grid">
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input
                className="input"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Empuje tren superior"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Dificultad</label>
              <select className="input" name="nivel_dificultad" value={form.nivel_dificultad} onChange={handleChange}>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          </div>
          <div className="input-group" style={{ marginTop: '12px' }}>
            <label className="input-label">Objetivo</label>
            <textarea
              className="input"
              name="objetivo"
              value={form.objetivo}
              onChange={handleChange}
              placeholder="Ej: Hipertrofia y fuerza del tren superior"
              rows={2}
            />
          </div>
          <div className="input-group" style={{ marginTop: '12px' }}>
            <label className="input-label">Descripción (opcional)</label>
            <textarea
              className="input"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describí la rutina..."
              rows={2}
            />
          </div>
        </div>

        {/* ── Panel agregar / editar ejercicio ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Ejercicios de la rutina</p>

          <div className="ent-ejercicio-panel">
            <div className="ent-ejercicio-panel-title">
              {ejercicioSeleccionado !== null
                ? `Editando ejercicio #${ejercicioSeleccionado + 1}`
                : 'Agregar ejercicio'}
            </div>

            <div className="admin-form-grid">
              <div className="input-group">
                <label className="input-label">Ejercicio</label>
                <select className="input" name="ejercicio_id" value={nuevoEjercicio.ejercicio_id} onChange={handleNuevoEjercicioChange}>
                  <option value="">Seleccionar ejercicio</option>
                  {ejerciciosDisponibles.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} — {e.musculo_principal}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Alternativo (opcional)</label>
                <select className="input" name="ejercicio_alternativo_id" value={nuevoEjercicio.ejercicio_alternativo_id} onChange={handleNuevoEjercicioChange}>
                  <option value="">Sin alternativo</option>
                  {ejerciciosDisponibles
                    .filter(e => e.id !== Number(nuevoEjercicio.ejercicio_id))
                    .map(e => (
                      <option key={e.id} value={e.id}>{e.nombre} — {e.musculo_principal}</option>
                    ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Series</label>
                <input
                  className="input"
                  type="number"
                  name="series"
                  value={nuevoEjercicio.series}
                  onChange={handleNuevoEjercicioChange}
                  min={1} max={20}
                  placeholder="Ej: 3"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Repeticiones</label>
                <input
                  className="input"
                  type="text"
                  name="repeticiones"
                  value={nuevoEjercicio.repeticiones}
                  onChange={handleNuevoEjercicioChange}
                  placeholder="Ej: 10-12 o Al fallo"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Descanso (seg)</label>
                <input
                  className="input"
                  type="number"
                  name="descanso_segundos"
                  value={nuevoEjercicio.descanso_segundos}
                  onChange={handleNuevoEjercicioChange}
                  min={0} max={600}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Intensidad (%)</label>
                <input
                  className="input"
                  type="number"
                  name="porcentaje_fuerza"
                  value={nuevoEjercicio.porcentaje_fuerza}
                  onChange={handleNuevoEjercicioChange}
                  min={1} max={100}
                />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '12px' }}>
              <label className="input-label">Notas (opcional)</label>
              <input
                className="input"
                type="text"
                name="notas"
                value={nuevoEjercicio.notas}
                onChange={handleNuevoEjercicioChange}
                placeholder="Ej: Controlar la bajada"
              />
            </div>

            <div className="ent-panel-actions">
              {ejercicioSeleccionado !== null ? (
                <>
                  <button type="button" className="btn btn-primary" onClick={guardarEdicionEjercicio}>
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setEjercicioSeleccionado(null); setNuevoEjercicio(ejercicioVacio) }}
                  >
                    Cancelar edición
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={agregarEjercicio}>
                  + Agregar a la rutina
                </button>
              )}
            </div>
          </div>

          {/* Lista de ejercicios */}
          {ejerciciosRutina.length > 0 && (
            <>
              <p className="admin-form-section-title" style={{ marginTop: '16px' }}>
                Ejercicios agregados ({ejerciciosRutina.length})
              </p>
              <div className="ent-ejercicios-lista">
                {ejerciciosRutina.map((ej, index) => {
                  const nombreEj = ej._nombre ?? ejerciciosDisponibles.find(e => e.id === ej.ejercicio_id)?.nombre ?? `Ejercicio ${ej.ejercicio_id}`
                  const nombreAlt = ej._nombreAlternativo ?? (ej.ejercicio_alternativo_id ? ejerciciosDisponibles.find(e => e.id === ej.ejercicio_alternativo_id)?.nombre : null)
                  const estaSeleccionado = ejercicioSeleccionado === index

                  return (
                    <div key={index} className={`ent-ej-item${estaSeleccionado ? ' seleccionado' : ''}`}>
                      <div className="ent-ej-item-info">
                        <div className="ent-ej-item-nombre">
                          {index + 1}. {nombreEj}
                        </div>
                        <div className="ent-ej-item-meta">
                          {ej.series} series × {ej.repeticiones} · Descanso: {ej.descanso_segundos}s · Intensidad: {ej.porcentaje_fuerza}%
                        </div>
                        {nombreAlt && (
                          <div className="ent-ej-item-alt">Alt: {nombreAlt}</div>
                        )}
                        {ej.notas && (
                          <div className="ent-ej-item-nota">Nota: {ej.notas}</div>
                        )}
                      </div>
                      <div className="ent-ej-item-acciones">
                        <button
                          type="button"
                          className="btn btn-icon btn-icon-sm"
                          onClick={() => moverEjercicio(index, -1)}
                          disabled={index === 0}
                          title="Subir"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-icon-sm"
                          onClick={() => moverEjercicio(index, 1)}
                          disabled={index === ejerciciosRutina.length - 1}
                          title="Bajar"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => seleccionarEjercicio(index)}
                        >
                          {estaSeleccionado ? 'Cancelar' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => eliminarEjercicioDeRutina(index)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {error && <div className="msg-error mb-16">{error}</div>}

        <div className="admin-form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/entrenador/rutinas')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear rutina'}
          </button>
        </div>

      </form>
    </div>
  )
}
