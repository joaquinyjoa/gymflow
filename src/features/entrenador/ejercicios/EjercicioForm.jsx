import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../store/AuthContext'

const MUSCULOS = [
  'Pecho', 'Espalda', 'Hombros', 'Biceps', 'Triceps', 'Piernas', 'Glúteos', 'Core', 'Full Body'
]

const estadoInicial = {
  nombre: '',
  descripcion: '',
  categoria: 'fuerza',
  musculo_principal: '',
  musculos_secundarios: [],
  nivel_dificultad: 'principiante',
  equipamiento: [],
  instrucciones: '',
  consejos: '',
  enlace_video: '',
}

export default function EjercicioForm() {
  const [form, setForm] = useState(estadoInicial)
  const [gifFile, setGifFile] = useState(null)
  const [gifPreview, setGifPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [error, setError] = useState('')
  const [equipamientoInput, setEquipamientoInput] = useState('')
  const [musculoSecInput, setMusculoSecInput] = useState('')

  const navigate = useNavigate()
  const { id } = useParams()
  const { perfil } = useAuth()
  const esEdicion = Boolean(id)

  useEffect(() => {
    if (esEdicion) cargarEjercicio()
  }, [id])

  async function cargarEjercicio() {
    setCargandoDatos(true)
    const { data, error } = await supabase
      .from('ejercicios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setError('Error al cargar ejercicio')
    } else {
      setForm({
        nombre: data.nombre ?? '',
        descripcion: data.descripcion ?? '',
        categoria: data.categoria ?? 'fuerza',
        musculo_principal: data.musculo_principal ?? '',
        musculos_secundarios: data.musculos_secundarios ?? [],
        nivel_dificultad: data.nivel_dificultad ?? 'principiante',
        equipamiento: data.equipamiento ?? [],
        instrucciones: data.instrucciones ?? '',
        consejos: data.consejos ?? '',
        enlace_video: data.enlace_video ?? '',
      })
      if (data.enlace_video) setGifPreview(data.enlace_video)
    }
    setCargandoDatos(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleGifChange(e) {
    const file = e.target.files[0]
    if (!file) return

    const formatosPermitidos = ['image/gif', 'image/webp']
    if (!formatosPermitidos.includes(file.type)) {
      setError('Solo se permiten archivos GIF o WebP')
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo 2MB (el tuyo pesa ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      return
    }

    setGifFile(file)
    setGifPreview(URL.createObjectURL(file))
    setError('')
  }

  function agregarItem(campo, valor, setInput) {
    if (!valor.trim()) return
    setForm(prev => ({ ...prev, [campo]: [...prev[campo], valor.trim()] }))
    setInput('')
  }

  function eliminarItem(campo, index) {
    setForm(prev => ({ ...prev, [campo]: prev[campo].filter((_, i) => i !== index) }))
  }

  async function subirGif() {
    if (!gifFile) return null

    // Borrar GIF anterior del storage si existe
    if (form.enlace_video) {
      const path = form.enlace_video.split('/storage/v1/object/public/ejercicios/')[1]
      if (path) await supabase.storage.from('ejercicios').remove([path])
    }

    const extension = gifFile.name.split('.').pop().toLowerCase()
    const nombreArchivo = `${Date.now()}.${extension}`
    const ruta = `ejercicios/${nombreArchivo}`

    const { error } = await supabase.storage
      .from('ejercicios')
      .upload(ruta, gifFile, { upsert: true })

    if (error) throw new Error(`Error subiendo GIF: ${error.message}`)

    const { data } = supabase.storage.from('ejercicios').getPublicUrl(ruta)
    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (form.nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); return }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-()\°\.\/]+$/.test(form.nombre.trim())) { setError('El nombre contiene caracteres no permitidos'); return }
    if (musculoSecInput.trim()) { setError('Tenés un músculo secundario sin agregar. Presioná "Agregar" o borralo'); return }
    if (form.musculos_secundarios.some(m => /^\d+$/.test(m))) { setError('Los músculos secundarios no pueden contener solo números'); return }
    if (form.musculos_secundarios.length === 0) { setError('Agregá al menos un músculo secundario. Si no hay escribí "Ninguno"'); return }
    if (equipamientoInput.trim()) { setError('Tenés texto en equipamiento sin agregar. Presioná "Agregar" o borralo'); return }
    if (form.equipamiento.some(eq => /^\d+$/.test(eq))) { setError('El equipamiento no puede contener solo números'); return }
    if (form.equipamiento.length === 0) { setError('Agregá al menos un equipamiento. Si no usa equipamiento escribí "Ninguno"'); return }
    if (!esEdicion && !gifFile) { setError('El GIF demostrativo es obligatorio'); return }
    if (form.instrucciones && form.instrucciones.trim().length < 10) { setError('Las instrucciones deben tener al menos 10 caracteres'); return }

    setLoading(true)
    try {
      let gifUrl = form.enlace_video
      if (gifFile) gifUrl = await subirGif()

      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        categoria: form.categoria,
        musculo_principal: form.musculo_principal,
        musculos_secundarios: form.musculos_secundarios,
        nivel_dificultad: form.nivel_dificultad,
        equipamiento: form.equipamiento,
        instrucciones: form.instrucciones.trim() || null,
        consejos: form.consejos.trim() || null,
        enlace_video: gifUrl,
        created_by: perfil.id,
      }

      if (esEdicion) {
        const { error } = await supabase.from('ejercicios').update(datos).eq('id', id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('ejercicios').insert(datos)
        if (error) throw new Error(error.message)
      }

      navigate('/entrenador/ejercicios')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (cargandoDatos) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando datos del ejercicio...</p>
    </div>
  )

  return (
    <div className="admin-form-page">

      <div className="admin-form-header">
        <button className="btn-back" onClick={() => navigate('/entrenador/ejercicios')}>
          ← Volver
        </button>
        <h1 className="admin-page-title">{esEdicion ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Información básica ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Información básica</p>
          <div className="admin-form-grid">
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input
                className="input"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Press de banca"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Categoría</label>
              <select className="input" name="categoria" value={form.categoria} onChange={handleChange}>
                <option value="fuerza">Fuerza</option>
                <option value="general">General</option>
                <option value="cardio">Cardio</option>
                <option value="movilidad">Movilidad</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Músculo principal</label>
              <select className="input" name="musculo_principal" value={form.musculo_principal} onChange={handleChange}>
                <option value="">Seleccionar</option>
                {MUSCULOS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
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
            <label className="input-label">Descripción (opcional)</label>
            <textarea
              className="input"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describí el ejercicio..."
              rows={3}
            />
          </div>
        </div>

        {/* ── Músculos secundarios ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Músculos secundarios</p>
          <div className="ent-tag-row" style={{ marginTop: '8px' }}>
            <input
              className="input"
              type="text"
              value={musculoSecInput}
              onChange={e => setMusculoSecInput(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
              placeholder="Ej: Tríceps"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarItem('musculos_secundarios', musculoSecInput, setMusculoSecInput)
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => agregarItem('musculos_secundarios', musculoSecInput, setMusculoSecInput)}
            >
              Agregar
            </button>
          </div>
          <div className="ent-tag-list">
            {form.musculos_secundarios.map((m, i) => (
              <span key={i} className="ent-tag">
                {m}
                <button type="button" className="ent-tag-remove" onClick={() => eliminarItem('musculos_secundarios', i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ── Equipamiento ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Equipamiento</p>
          <div className="ent-tag-row" style={{ marginTop: '8px' }}>
            <input
              className="input"
              type="text"
              value={equipamientoInput}
              onChange={e => setEquipamientoInput(e.target.value)}
              placeholder="Ej: Mancuernas"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  agregarItem('equipamiento', equipamientoInput, setEquipamientoInput)
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => agregarItem('equipamiento', equipamientoInput, setEquipamientoInput)}
            >
              Agregar
            </button>
          </div>
          <div className="ent-tag-list">
            {form.equipamiento.map((eq, i) => (
              <span key={i} className="ent-tag">
                {eq}
                <button type="button" className="ent-tag-remove" onClick={() => eliminarItem('equipamiento', i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* ── Instrucciones ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Instrucciones y consejos</p>
          <div className="input-group" style={{ marginTop: '8px' }}>
            <label className="input-label">Instrucciones (opcional)</label>
            <textarea
              className="input"
              name="instrucciones"
              value={form.instrucciones}
              onChange={handleChange}
              placeholder="Paso a paso de cómo realizar el ejercicio..."
              rows={5}
            />
          </div>
          <div className="input-group" style={{ marginTop: '12px' }}>
            <label className="input-label">Consejos (opcional)</label>
            <textarea
              className="input"
              name="consejos"
              value={form.consejos}
              onChange={handleChange}
              placeholder="Consejos para realizar el ejercicio correctamente..."
              rows={3}
            />
          </div>
        </div>

        {/* ── GIF ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">GIF demostrativo{!esEdicion && ' *'}</p>
          <div className="ent-gif-section">
            {gifPreview ? (
              <>
                <div className="ent-gif-preview-wrap">
                  <img src={gifPreview} alt="Preview" className="ent-gif-preview" />
                </div>
                <label className="ent-gif-cambiar-btn">
                  <input type="file" accept=".gif,.webp" onChange={handleGifChange} style={{ display: 'none' }} />
                  Cambiar GIF
                </label>
              </>
            ) : (
              <div className="ent-gif-upload">
                <input type="file" accept=".gif,.webp" onChange={handleGifChange} />
                <div className="ent-gif-upload-label">＋ Seleccionar GIF o WebP</div>
                <div className="ent-gif-hint">Formatos: GIF, WebP · Máximo 2MB</div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="msg-error mb-16">{error}</div>}

        <div className="admin-form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/entrenador/ejercicios')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear ejercicio'}
          </button>
        </div>

      </form>
    </div>
  )
}
