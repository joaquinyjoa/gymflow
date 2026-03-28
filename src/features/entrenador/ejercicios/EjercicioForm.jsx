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
  // Para manejar inputs de arrays (equipamiento y musculos secundarios)
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

  // Manejo del GIF — genera preview local antes de subir
  function handleGifChange(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validar formato
    const formatosPermitidos = ['image/gif', 'image/webp']
    if (!formatosPermitidos.includes(file.type)) {
        setError('Solo se permiten archivos GIF o WebP')
        return
    }

    // Validar tamaño máximo 2MB
    const maxSize = 2 * 1024 * 1024 // 2MB en bytes
    if (file.size > maxSize) {
        setError(`El archivo es demasiado grande. Máximo 2MB (el tuyo pesa ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        return
    }

    setGifFile(file)
    setGifPreview(URL.createObjectURL(file))
    setError('')
    }

  // Agregar ítem a un array (equipamiento o musculos secundarios)
  function agregarItem(campo, valor, setInput) {
    if (!valor.trim()) return
    setForm(prev => ({
      ...prev,
      [campo]: [...prev[campo], valor.trim()]
    }))
    setInput('')
  }

  // Eliminar ítem de un array
  function eliminarItem(campo, index) {
    setForm(prev => ({
      ...prev,
      [campo]: prev[campo].filter((_, i) => i !== index)
    }))
  }

  async function subirGif() {
    if (!gifFile) return null

    const extension = gifFile.name.split('.').pop()
    const nombreArchivo = `${Date.now()}_${form.nombre.replace(/\s+/g, '_')}.${extension}`
    const ruta = `ejercicios/${nombreArchivo}`

    const { error } = await supabase.storage
      .from('ejercicios')
      .upload(ruta, gifFile, { upsert: true })

    if (error) throw new Error(`Error subiendo GIF: ${error.message}`)

    const { data } = supabase.storage
      .from('ejercicios')
      .getPublicUrl(ruta)

    return data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

   // Nombre — solo letras
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (form.nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); return }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.nombre.trim())) { setError('El nombre solo puede contener letras'); return }

    // Músculo principal — ya es un select, no puede tener números

    
    // Músculo secundario — texto sin agregar
    if (musculoSecInput.trim()) { setError('Tenés un músculo secundario sin agregar. Presioná "Agregar" o borralo'); return }
    // Músculo secundario — que no tenga solo números
    if (form.musculos_secundarios.some(m => /^\d+$/.test(m))) { setError('Los músculos secundarios no pueden contener solo números'); return }
    if (form.musculos_secundarios.length === 0) { setError('Agregá al menos un músculo secundario. Si no hay escribí "Ninguno"'); return }

    // Equipamiento — texto sin agregar
    if (equipamientoInput.trim()) { setError('Tenés texto en equipamiento sin agregar. Presioná "Agregar" o borralo'); return }
    // Equipamiento — que no tenga solo números
    if (form.equipamiento.some(eq => /^\d+$/.test(eq))) { setError('El equipamiento no puede contener solo números'); return }
    if (form.equipamiento.length === 0) { setError('Agregá al menos un equipamiento. Si no usa equipamiento escribí "Ninguno"'); return }


    // GIF solo obligatorio al crear
    if (!esEdicion && !gifFile) { setError('El GIF demostrativo es obligatorio'); return }

    // Instrucciones — opcional, sin validación de caracteres
    if (form.instrucciones && form.instrucciones.trim().length < 10) {
    setError('Las instrucciones deben tener al menos 10 caracteres'); return
    }

    setLoading(true)
    try {
      // Subir GIF si hay uno nuevo
      let gifUrl = form.enlace_video
      if (gifFile) {
        gifUrl = await subirGif()
      }

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
        const { error } = await supabase
            .from('ejercicios')
            .update(datos)
            .eq('id', id)
        if (error) throw new Error(error.message)
        } else {
        const { error } = await supabase
            .from('ejercicios')
            .insert(datos)
        if (error) throw new Error(error.message)
        }

      navigate('/entrenador/ejercicios')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (cargandoDatos) return <p>Cargando...</p>

  return (
    <div>
      <h1>{esEdicion ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h1>

      <form onSubmit={handleSubmit}>

        {/* ── Información básica ── */}
        <h2>Información básica</h2>
        <div>
          <label>Nombre</label>
         <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') }))}
            placeholder="Ej: Press de banca"
            />
        </div>
        <div>
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Describí el ejercicio..."
          />
        </div>
        <div>
          <label>Categoría</label>
          <select name="categoria" value={form.categoria} onChange={handleChange}>
            <option value="fuerza">Fuerza</option>
            <option value="general">General</option>
            <option value="cardio">Cardio</option>
            <option value="movilidad">Movilidad</option>
          </select>
        </div>
        <div>
          <label>Músculo principal</label>
          <select name="musculo_principal" value={form.musculo_principal} onChange={handleChange}>
            <option value="">Seleccionar</option>
            {MUSCULOS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Dificultad</label>
          <select name="nivel_dificultad" value={form.nivel_dificultad} onChange={handleChange}>
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </div>

        {/* ── Músculos secundarios ── */}
        <div>
          <label>Músculos secundarios</label>
          <div>
            <input
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
              onClick={() => agregarItem('musculos_secundarios', musculoSecInput, setMusculoSecInput)}
            >
              Agregar
            </button>
          </div>
          <div>
            {form.musculos_secundarios.map((m, i) => (
              <span key={i}>
                {m}
                <button type="button" onClick={() => eliminarItem('musculos_secundarios', i)}>x</button>
              </span>
            ))}
          </div>
        </div>

        {/* ── Equipamiento ── */}
        <div>
          <label>Equipamiento</label>
          <div>
            <input
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
              onClick={() => agregarItem('equipamiento', equipamientoInput, setEquipamientoInput)}
            >
              Agregar
            </button>
          </div>
          <div>
            {form.equipamiento.map((eq, i) => (
              <span key={i}>
                {eq}
                <button type="button" onClick={() => eliminarItem('equipamiento', i)}>x</button>
              </span>
            ))}
          </div>
        </div>

        {/* ── Instrucciones y consejos ── */}
        <h2>Instrucciones</h2>
        <div>
          <label>Instrucciones</label>
          <textarea
            name="instrucciones"
            value={form.instrucciones}
            onChange={handleChange}
            placeholder="Paso a paso de cómo realizar el ejercicio..."
            rows={5}
          />
        </div>
        <div>
          <label>Consejos</label>
          <textarea
            name="consejos"
            value={form.consejos}
            onChange={handleChange}
            placeholder="Consejos para realizar el ejercicio correctamente..."
            rows={3}
          />
        </div>

        {/* ── GIF demostrativo ── */}
        <h2>GIF demostrativo</h2>
        <div>
          <input
            type="file"
            accept=".gif,.webp"
            onChange={handleGifChange}
            />
            <p style={{ fontSize: '12px', color: 'gray' }}>
            Formatos permitidos: GIF, WebP. Tamaño máximo: 2MB
            </p>
          {gifPreview && (
            <img
              src={gifPreview}
              alt="Preview"
              style={{ width: '200px', marginTop: '8px' }}
            />
          )}
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <button type="button" onClick={() => navigate('/entrenador/ejercicios')}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear ejercicio'}
          </button>
        </div>

      </form>
    </div>
  )
}