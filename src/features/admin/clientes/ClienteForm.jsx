import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { invocarFuncion } from '../../../lib/api'


function getFechaProximoMes() {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() + 1)
  return fecha.toISOString().split('T')[0]
}

// Estado inicial del formulario — todos los campos vacíos o false
const estadoInicial = {
  nombre: '',
  apellido: '',
  edad: '',
  genero: '',
  peso: '',
  altura: '',
  nivel_actividad: 'Medio',
  fecha_vencimiento: getFechaProximoMes(), // predeterminada al mes siguiente
  objetivo: '',
  horas_sueno: '',
  enfermedad_cronica: false,
  descripcion_enfermedad: '',
  diabetes: false,
  hipotension: false,
  hipotiroidismo: false,
  asma: false,
  medicacion_regular: false,
  descripcion_medicacion: '',
  cirugias: false,
  descripcion_cirugias: '',
  lesiones: false,
  descripcion_lesiones: '',
  fuma: false,
  alcohol: false,
}

export default function ClienteForm() {
  const [form, setForm] = useState(estadoInicial)
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { id } = useParams()

  // Si hay un id en la URL, estamos editando. Si no, estamos creando.
  const esEdicion = Boolean(id)

  // Al montar el componente, si es edición cargamos los datos del cliente
  useEffect(() => {
    if (esEdicion) cargarCliente()
  }, [id])

  

  // Carga los datos del cliente desde Supabase y los pone en el estado
  async function cargarCliente() {
    setCargandoDatos(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setError('Error al cargar cliente')
    } else {
      setForm({
        nombre: data.nombre ?? '',
        apellido: data.apellido ?? '',
        edad: data.edad ?? '',
        genero: data.genero ?? '',
        peso: data.peso ?? '',
        altura: data.altura ?? '',
        nivel_actividad: data.nivel_actividad ?? 'Medio',
        fecha_vencimiento: data.fecha_vencimiento ?? '',
        objetivo: data.objetivo ?? '',
        horas_sueno: data.horas_sueno ?? '',
        enfermedad_cronica: data.enfermedad_cronica ?? false,
        descripcion_enfermedad: data.descripcion_enfermedad ?? '',
        diabetes: data.diabetes ?? false,
        hipotension: data.hipotension ?? false,
        hipotiroidismo: data.hipotiroidismo ?? false,
        asma: data.asma ?? false,
        medicacion_regular: data.medicacion_regular ?? false,
        descripcion_medicacion: data.descripcion_medicacion ?? '',
        cirugias: data.cirugias ?? false,
        descripcion_cirugias: data.descripcion_cirugias ?? '',
        lesiones: data.lesiones ?? false,
        descripcion_lesiones: data.descripcion_lesiones ?? '',
        fuma: data.fuma ?? false,
        alcohol: data.alcohol ?? false,
      })
      // El DNI lo sacamos del correo (ej: "12345678@retofitness.com" → "12345678")
      setDni(data.correo?.split('@')[0] ?? '')
    }
    setCargandoDatos(false)
  }

  // Handler genérico para inputs y checkboxes
  // Detecta si es checkbox por el type y usa checked o value según corresponda
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Validaciones y submit del formulario
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // ── Acceso ──────────────────────────────────────────────
    if (!dni) { setError('El DNI es obligatorio'); return }
    if (!/^\d+$/.test(dni)) { setError('El DNI solo puede contener números'); return }
    if (dni.length < 6 || dni.length > 11) { setError('El DNI debe tener entre 6 y 11 dígitos'); return }
    if (!esEdicion && !pin) { setError('El PIN es obligatorio'); return }
    if (pin && !/^\d+$/.test(pin)) { setError('El PIN solo puede contener números'); return }
    if (pin && pin.length !== 4) { setError('El PIN debe tener exactamente 4 dígitos'); return }

    // ── Datos personales ─────────────────────────────────────
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.nombre)) { setError('El nombre solo puede contener letras'); return }
    if (!form.apellido.trim()) { setError('El apellido es obligatorio'); return }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.apellido)) { setError('El apellido solo puede contener letras'); return }
    if (!form.genero) { setError('El género es obligatorio'); return }

    // Edad: entero entre 12 y 100
    if (!form.edad) { setError('La edad es obligatoria'); return }
    if (!/^\d+$/.test(String(form.edad))) { setError('La edad debe ser un número entero'); return }
    if (Number(form.edad) < 12 || Number(form.edad) > 100) { setError('La edad debe estar entre 12 y 100 años'); return }

    // Peso: número con hasta 2 decimales, entre 20 y 300 kg
    if (!form.peso) { setError('El peso es obligatorio'); return }
    if (!/^\d+(\.\d{1,2})?$/.test(String(form.peso))) { setError('El peso debe ser un número válido (ej: 70 o 70.5)'); return }
    if (Number(form.peso) < 20 || Number(form.peso) > 300) { setError('El peso debe estar entre 20 y 300 kg'); return }

    // Altura: entero en cm entre 50 y 250
    if (!form.altura) { setError('La altura es obligatoria'); return }
    if (!/^\d+$/.test(String(form.altura))) { setError('La altura debe ser un número entero en cm (ej: 170)'); return }
    if (Number(form.altura) < 50 || Number(form.altura) > 250) { setError('La altura debe estar entre 50 y 250 cm'); return }

    if (!form.fecha_vencimiento) { setError('La fecha de vencimiento es obligatoria'); return }

    // Horas de sueño: entero entre 1 y 24 (opcional)
    if (form.horas_sueno) {
      if (!/^\d+$/.test(String(form.horas_sueno))) { setError('Las horas de sueño deben ser un número entero'); return }
      if (Number(form.horas_sueno) < 1 || Number(form.horas_sueno) > 24) { setError('Las horas de sueño deben estar entre 1 y 24'); return }
    }

    // ── Salud: descripción obligatoria si la condición está marcada ──
    if (form.enfermedad_cronica && !form.descripcion_enfermedad.trim()) { setError('Describí la enfermedad crónica'); return }
    if (form.medicacion_regular && !form.descripcion_medicacion.trim()) { setError('Describí la medicación regular'); return }
    if (form.cirugias && !form.descripcion_cirugias.trim()) { setError('Describí las cirugías'); return }
    if (form.lesiones && !form.descripcion_lesiones.trim()) { setError('Describí las lesiones'); return }

    // ── Submit ───────────────────────────────────────────────
    setLoading(true)
    try {
      if (esEdicion) {
        await editarCliente()
      } else {
        await crearCliente()
      }
      navigate('/admin/clientes')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Llama a la Edge Function que crea el usuario en Auth + inserta en users + clientes
  async function crearCliente() {
    await invocarFuncion('crear-usuario', {
      dni,
      pin,
      rol: 'cliente',
      perfil: {
        ...form,
        edad: Number(form.edad),
        peso: Number(form.peso),
        altura: Number(form.altura),
        horas_sueno: form.horas_sueno ? Number(form.horas_sueno) : null,
        terminos_aceptados: true,
        fecha_aceptacion_terminos: new Date().toISOString(),
      }
    })
  }

  // Actualiza los datos del cliente en la tabla clientes
  // Si hay un PIN nuevo (4 dígitos), también lo actualiza en Auth via Edge Function
  async function editarCliente() {
    const { error: clienteError } = await supabase
      .from('clientes')
      .update({
        ...form,
        edad: Number(form.edad),
        peso: Number(form.peso),
        altura: Number(form.altura),
        horas_sueno: form.horas_sueno ? Number(form.horas_sueno) : null,
      })
      .eq('id', id)

    if (clienteError) throw new Error(`Error actualizando cliente: ${clienteError.message}`)

    // Si el admin ingresó un PIN nuevo, actualizarlo en Auth
    if (pin.length === 4) {
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('user_id')
        .eq('id', id)
        .single()

      const { data, error: pinError } = await supabase.functions.invoke('actualizar-pin', {
        body: { user_id: clienteData.user_id, pin }
      })

      if (pinError || data?.error) throw new Error('Error actualizando PIN')
    }
  }

  if (cargandoDatos) return <p>Cargando...</p>

  return (
    <div>
      <h1>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h1>

      <form onSubmit={handleSubmit}>

        {/* ── Acceso ── */}
        <h2>Acceso</h2>
        <div>
          <label>DNI</label>
          <input
            type="text"
            value={dni}
            // Filtra cualquier carácter que no sea número mientras escribe
            onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
            disabled={esEdicion}
            placeholder="12345678"
            minLength={6}
            maxLength={11}
            autoComplete="off"
          />
        </div>
        <div>
          <label>{esEdicion ? 'Nuevo PIN (dejá vacío para no cambiar)' : 'PIN'}</label>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 dígitos"
            maxLength={4}
            autoComplete="off"
          />
        </div>

        {/* ── Datos personales ── */}
        <h2>Datos personales</h2>
        <div>
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            // Solo permite letras y espacios (incluye acentos y ñ)
            onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') }))}
            placeholder="Ej: Juan"
          />
        </div>
        <div>
          <label>Apellido</label>
          <input
            type="text"
            name="apellido"
            value={form.apellido}
            onChange={e => setForm(prev => ({ ...prev, apellido: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') }))}
            placeholder="Ej: González"
          />
        </div>
        <div>
          <label>Edad</label>
          <input
            type="number"
            name="edad"
            value={form.edad}
            onChange={e => setForm(prev => ({ ...prev, edad: e.target.value.replace(/\D/g, '') }))}
            min={12}
            max={100}
            placeholder="Ej: 25"
          />
        </div>
        <div>
          <label>Género</label>
          <select name="genero" value={form.genero} onChange={handleChange}>
            <option value="">Seleccionar</option>
            <option value="Hombre">Hombre</option>
            <option value="Mujer">Mujer</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label>Peso (kg)</label>
          <input
            type="number"
            name="peso"
            value={form.peso}
            onChange={e => setForm(prev => ({ ...prev, peso: e.target.value.replace(/[^0-9.]/g, '') }))}
            min={20}
            max={300}
            step="0.1"
            placeholder="Ej: 70.5"
          />
        </div>
        <div>
          <label>Altura (cm)</label>
          <input
            type="number"
            name="altura"
            value={form.altura}
            onChange={e => setForm(prev => ({ ...prev, altura: e.target.value.replace(/\D/g, '') }))}
            min={50}
            max={250}
            placeholder="Ej: 170"
          />
        </div>
        <div>
          <label>Nivel de actividad</label>
          <select name="nivel_actividad" value={form.nivel_actividad} onChange={handleChange}>
            <option value="Bajo">Bajo</option>
            <option value="Medio">Medio</option>
            <option value="Alto">Alto</option>
          </select>
        </div>
        <div>
          <label>Fecha de vencimiento</label>
          <input
            type="date"
            name="fecha_vencimiento"
            value={form.fecha_vencimiento}
            onChange={handleChange}
          />
        </div>

        {/* ── Objetivo ── */}
        <h2>Objetivo</h2>
        <div>
          <label>Objetivo</label>
          <textarea
            name="objetivo"
            value={form.objetivo}
            onChange={handleChange}
            placeholder="Ej: Bajar de peso, ganar masa muscular..."
          />
        </div>
        <div>
          <label>Horas de sueño</label>
          <input
            type="number"
            name="horas_sueno"
            value={form.horas_sueno}
            onChange={e => setForm(prev => ({ ...prev, horas_sueno: e.target.value.replace(/\D/g, '') }))}
            min={1}
            max={24}
            placeholder="Ej: 8"
          />
        </div>

        {/* ── Salud ── */}
        <h2>Salud</h2>

        <div>
          <label>
            <input type="checkbox" name="enfermedad_cronica" checked={form.enfermedad_cronica} onChange={handleChange} />
            Enfermedad crónica
          </label>
          {/* Solo muestra el campo de descripción si el checkbox está marcado */}
          {form.enfermedad_cronica && (
            <input type="text" name="descripcion_enfermedad" value={form.descripcion_enfermedad} onChange={handleChange} placeholder="Describí la enfermedad" />
          )}
        </div>

        <div>
          <label>
            <input type="checkbox" name="diabetes" checked={form.diabetes} onChange={handleChange} />
            Diabetes
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" name="hipotension" checked={form.hipotension} onChange={handleChange} />
            Hipotensión
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" name="hipotiroidismo" checked={form.hipotiroidismo} onChange={handleChange} />
            Hipotiroidismo
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" name="asma" checked={form.asma} onChange={handleChange} />
            Asma
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" name="medicacion_regular" checked={form.medicacion_regular} onChange={handleChange} />
            Medicación regular
          </label>
          {form.medicacion_regular && (
            <input type="text" name="descripcion_medicacion" value={form.descripcion_medicacion} onChange={handleChange} placeholder="Describí la medicación" />
          )}
        </div>

        <div>
          <label>
            <input type="checkbox" name="cirugias" checked={form.cirugias} onChange={handleChange} />
            Cirugías
          </label>
          {form.cirugias && (
            <input type="text" name="descripcion_cirugias" value={form.descripcion_cirugias} onChange={handleChange} placeholder="Describí las cirugías" />
          )}
        </div>

        <div>
          <label>
            <input type="checkbox" name="lesiones" checked={form.lesiones} onChange={handleChange} />
            Lesiones
          </label>
          {form.lesiones && (
            <input type="text" name="descripcion_lesiones" value={form.descripcion_lesiones} onChange={handleChange} placeholder="Describí las lesiones" />
          )}
        </div>

        <div>
          <label>
            <input type="checkbox" name="fuma" checked={form.fuma} onChange={handleChange} />
            Fuma
          </label>
        </div>

        <div>
          <label>
            <input type="checkbox" name="alcohol" checked={form.alcohol} onChange={handleChange} />
            Consume alcohol
          </label>
        </div>

        {/* Mensaje de error visible debajo del formulario */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <button type="button" onClick={() => navigate('/admin/clientes')}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>

      </form>
    </div>
  )
}