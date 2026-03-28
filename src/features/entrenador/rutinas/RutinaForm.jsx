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
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null) // índice del ejercicio seleccionado para editar
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
      // Ordenar por orden
      const ejerciciosOrdenados = (data.rutinas_ejercicios ?? []).sort((a, b) => a.orden - b.orden)
      setEjerciciosRutina(ejerciciosOrdenados)
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

  // Seleccionar un ejercicio de la lista para editarlo
  function seleccionarEjercicio(index) {
    if (ejercicioSeleccionado === index) {
      // Si ya está seleccionado, deseleccionar
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

  // Guardar cambios del ejercicio seleccionado
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

  // Mover ejercicio hacia arriba o abajo
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

    // Si hay uno seleccionado, actualizar su índice
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

  if (cargandoDatos) return <p>Cargando...</p>

  return (
    <div>
      <h1>{esEdicion ? 'Editar rutina' : 'Nueva rutina'}</h1>

      <form onSubmit={handleSubmit}>

        {/* ── Datos de la rutina ── */}
        <h2>Datos de la rutina</h2>
        <div>
          <label>Nombre</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Empuje tren superior" />
        </div>
        <div>
          <label>Descripción (opcional)</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describí la rutina..." />
        </div>
        <div>
          <label>Objetivo</label>
          <textarea name="objetivo" value={form.objetivo} onChange={handleChange} placeholder="Ej: Hipertrofia y fuerza del tren superior" />
        </div>
        <div>
          <label>Dificultad</label>
          <select name="nivel_dificultad" value={form.nivel_dificultad} onChange={handleChange}>
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </div>

        {/* ── Panel de ejercicio (agregar o editar) ── */}
        <h2>Ejercicios de la rutina</h2>

        <div>
          <h3>{ejercicioSeleccionado !== null ? `Editando ejercicio #${ejercicioSeleccionado + 1}` : 'Agregar ejercicio'}</h3>

          <div>
            <label>Ejercicio</label>
            <select name="ejercicio_id" value={nuevoEjercicio.ejercicio_id} onChange={handleNuevoEjercicioChange}>
              <option value="">Seleccionar ejercicio</option>
              {ejerciciosDisponibles.map(e => (
                <option key={e.id} value={e.id}>{e.nombre} — {e.musculo_principal}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Ejercicio alternativo (opcional)</label>
            <select name="ejercicio_alternativo_id" value={nuevoEjercicio.ejercicio_alternativo_id} onChange={handleNuevoEjercicioChange}>
              <option value="">Sin alternativo</option>
              {ejerciciosDisponibles
                .filter(e => e.id !== Number(nuevoEjercicio.ejercicio_id))
                .map(e => (
                  <option key={e.id} value={e.id}>{e.nombre} — {e.musculo_principal}</option>
                ))}
            </select>
          </div>

          <div>
            <label>Series</label>
            <input type="number" name="series" value={nuevoEjercicio.series} onChange={handleNuevoEjercicioChange} min={1} max={20} placeholder="Ej: 3" />
          </div>

          <div>
            <label>Repeticiones</label>
            <input type="text" name="repeticiones" value={nuevoEjercicio.repeticiones} onChange={handleNuevoEjercicioChange} placeholder="Ej: 10-12 o Al fallo" />
          </div>

          <div>
            <label>Descanso (segundos)</label>
            <input type="number" name="descanso_segundos" value={nuevoEjercicio.descanso_segundos} onChange={handleNuevoEjercicioChange} min={0} max={600} />
          </div>

          <div>
            <label>Intensidad (%)</label>
            <input type="number" name="porcentaje_fuerza" value={nuevoEjercicio.porcentaje_fuerza} onChange={handleNuevoEjercicioChange} min={1} max={100} />
          </div>

          <div>
            <label>Notas (opcional)</label>
            <input type="text" name="notas" value={nuevoEjercicio.notas} onChange={handleNuevoEjercicioChange} placeholder="Ej: Controlar la bajada" />
          </div>

          <div>
            {ejercicioSeleccionado !== null ? (
              <>
                <button type="button" onClick={guardarEdicionEjercicio}>Guardar cambios</button>
                <button type="button" onClick={() => { setEjercicioSeleccionado(null); setNuevoEjercicio(ejercicioVacio) }}>Cancelar edición</button>
              </>
            ) : (
              <button type="button" onClick={agregarEjercicio}>+ Agregar a la rutina</button>
            )}
          </div>
        </div>

        {/* ── Lista de ejercicios agregados ── */}
        {ejerciciosRutina.length > 0 && (
          <div>
            <h3>Ejercicios agregados ({ejerciciosRutina.length})</h3>
            {ejerciciosRutina.map((ej, index) => {
              const nombreEj = ej._nombre ?? ejerciciosDisponibles.find(e => e.id === ej.ejercicio_id)?.nombre ?? `Ejercicio ${ej.ejercicio_id}`
              const nombreAlt = ej._nombreAlternativo ?? (ej.ejercicio_alternativo_id ? ejerciciosDisponibles.find(e => e.id === ej.ejercicio_alternativo_id)?.nombre : null)
              const estaSeleccionado = ejercicioSeleccionado === index

              return (
                <div key={index} style={{ border: estaSeleccionado ? '2px solid blue' : '1px solid #ccc', padding: '8px', margin: '4px 0' }}>
                  <div>
                    <strong>{index + 1}. {nombreEj}</strong>
                    {nombreAlt && <span> (Alt: {nombreAlt})</span>}
                    <p>{ej.series} series × {ej.repeticiones} — Descanso: {ej.descanso_segundos}s — Intensidad: {ej.porcentaje_fuerza}%</p>
                    {ej.notas && <p>Nota: {ej.notas}</p>}
                  </div>
                  <div>
                    {/* Mover arriba/abajo */}
                    <button type="button" onClick={() => moverEjercicio(index, -1)} disabled={index === 0}>↑</button>
                    <button type="button" onClick={() => moverEjercicio(index, 1)} disabled={index === ejerciciosRutina.length - 1}>↓</button>
                    {/* Seleccionar para editar */}
                    <button type="button" onClick={() => seleccionarEjercicio(index)}>
                      {estaSeleccionado ? 'Cancelar' : 'Editar'}
                    </button>
                    {/* Eliminar */}
                    <button type="button" onClick={() => eliminarEjercicioDeRutina(index)}>Quitar</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <button type="button" onClick={() => navigate('/entrenador/rutinas')}>Cancelar</button>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear rutina'}
          </button>
        </div>

      </form>
    </div>
  )
}