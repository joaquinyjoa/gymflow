import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { EMAIL_DOMAIN } from '../../../lib/constants'

const estadoInicial = {
  nombre: '',
  apellido: '',
  edad: '',
  genero: '',
  peso: '',
  altura: '',
  nivel_actividad: 'Medio',
  fecha_vencimiento: '',
  objetivo: '',
  horas_sueno: '',
  // Salud
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
  const esEdicion = Boolean(id)

  useEffect(() => {
    if (esEdicion) cargarCliente()
  }, [id])

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
      // Sacar DNI del correo
      setDni(data.correo?.split('@')[0] ?? '')
    }
    setCargandoDatos(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!dni) { setError('El DNI es obligatorio'); return }
    if (!esEdicion && pin.length !== 4) { setError('El PIN debe tener 4 dígitos'); return }
    if (!form.nombre || !form.apellido) { setError('Nombre y apellido son obligatorios'); return }

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

  async function crearCliente() {
    const email = `${dni}${EMAIL_DOMAIN}`

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
    })
    if (authError) throw new Error(`Error creando usuario: ${authError.message}`)

    const uid = authData.user.id

    // 2. Insertar en tabla users
    const { error: userError } = await supabase
      .from('users')
      .insert({ id: uid, rol: 'cliente', activo: true })
    if (userError) throw new Error(`Error creando perfil: ${userError.message}`)

    // 3. Insertar en tabla clientes
    const { error: clienteError } = await supabase
      .from('clientes')
      .insert({
        user_id: uid,
        correo: email,
        ...form,
        terminos_aceptados: true,
        fecha_aceptacion_terminos: new Date().toISOString(),
      })
    if (clienteError) throw new Error(`Error guardando cliente: ${clienteError.message}`)
  }

  async function editarCliente() {
    // Actualizar datos del cliente
    const { error: clienteError } = await supabase
      .from('clientes')
      .update({ ...form })
      .eq('id', id)
    if (clienteError) throw new Error(`Error actualizando cliente: ${clienteError.message}`)

    // Si cambió el PIN, actualizarlo en Auth
    if (pin.length === 4) {
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('user_id')
        .eq('id', id)
        .single()

      const { error: pinError } = await supabase.auth.admin.updateUserById(
        clienteData.user_id,
        { password: pin }
      )
      if (pinError) throw new Error(`Error actualizando PIN: ${pinError.message}`)
    }
  }

  if (cargandoDatos) return <p>Cargando...</p>

  return (
    <div>
      <h1>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h1>

      <form onSubmit={handleSubmit}>

        <h2>Acceso</h2>
        <div>
          <label>DNI</label>
          <input
            type="text"
            value={dni}
            onChange={e => setDni(e.target.value)}
            disabled={esEdicion}
            placeholder="12345678"
          />
        </div>
        <div>
          <label>{esEdicion ? 'Nuevo PIN (dejá vacío para no cambiar)' : 'PIN'}</label>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="4 dígitos"
            maxLength={4}
            autoComplete="new-password"
          />
        </div>

        <h2>Datos personales</h2>
        <div>
          <label>Nombre</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} />
        </div>
        <div>
          <label>Apellido</label>
          <input type="text" name="apellido" value={form.apellido} onChange={handleChange} />
        </div>
        <div>
          <label>Edad</label>
          <input type="number" name="edad" value={form.edad} onChange={handleChange} />
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
          <input type="number" name="peso" value={form.peso} onChange={handleChange} />
        </div>
        <div>
          <label>Altura (cm)</label>
          <input type="number" name="altura" value={form.altura} onChange={handleChange} />
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
          <input type="date" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={handleChange} />
        </div>

        <h2>Objetivo</h2>
        <div>
          <label>Objetivo</label>
          <textarea name="objetivo" value={form.objetivo} onChange={handleChange} />
        </div>
        <div>
          <label>Horas de sueño</label>
          <input type="number" name="horas_sueno" value={form.horas_sueno} onChange={handleChange} min={1} max={24} />
        </div>

        <h2>Salud</h2>

        <div>
          <label>
            <input type="checkbox" name="enfermedad_cronica" checked={form.enfermedad_cronica} onChange={handleChange} />
            Enfermedad crónica
          </label>
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

        {error && <p>{error}</p>}

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