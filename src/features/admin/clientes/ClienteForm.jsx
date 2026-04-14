import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { invocarFuncion } from '../../../lib/api'
import { SkeletonList } from '../../../components/Skeleton'
import { useToast } from '../../../components/Toast'

function getFechaProximoMes() {
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() + 1)
  return fecha.toISOString().split('T')[0]
}

const estadoInicial = {
  nombre: '',
  apellido: '',
  edad: '',
  genero: '',
  peso: '',
  altura: '',
  nivel_actividad: 'Medio',
  fecha_vencimiento: getFechaProximoMes(),
  objetivo: '',
  metodo_pago: 'efectivo',
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
  const toast = useToast()

  const navigate = useNavigate()
  const { id } = useParams()
  const esEdicion = Boolean(id)

  useEffect(() => {
    if (esEdicion) cargarCliente()
  }, [id])

  async function cargarCliente() {
    setCargandoDatos(true)
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
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
        metodo_pago: data.metodo_pago ?? 'efectivo',
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
      setDni(data.correo?.split('@')[0] ?? '')
    }
    setCargandoDatos(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!dni) { setError('El DNI es obligatorio'); return }
    if (!/^\d+$/.test(dni)) { setError('El DNI solo puede contener números'); return }
    if (dni.length < 6 || dni.length > 11) { setError('El DNI debe tener entre 6 y 11 dígitos'); return }
    if (!esEdicion && !pin) { setError('El PIN es obligatorio'); return }
    if (pin && !/^\d+$/.test(pin)) { setError('El PIN solo puede contener números'); return }
    if (pin && pin.length !== 4) { setError('El PIN debe tener exactamente 4 dígitos'); return }
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.nombre)) { setError('El nombre solo puede contener letras'); return }
    if (!form.apellido.trim()) { setError('El apellido es obligatorio'); return }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.apellido)) { setError('El apellido solo puede contener letras'); return }
    if (!form.genero) { setError('El género es obligatorio'); return }
    if (!form.edad) { setError('La edad es obligatoria'); return }
    if (!/^\d+$/.test(String(form.edad))) { setError('La edad debe ser un número entero'); return }
    if (Number(form.edad) < 12 || Number(form.edad) > 100) { setError('La edad debe estar entre 12 y 100 años'); return }
    if (!form.peso) { setError('El peso es obligatorio'); return }
    if (!/^\d+(\.\d{1,2})?$/.test(String(form.peso))) { setError('El peso debe ser un número válido (ej: 70 o 70.5)'); return }
    if (Number(form.peso) < 20 || Number(form.peso) > 300) { setError('El peso debe estar entre 20 y 300 kg'); return }
    if (!form.altura) { setError('La altura es obligatoria'); return }
    if (!/^\d+$/.test(String(form.altura))) { setError('La altura debe ser un número entero en cm (ej: 170)'); return }
    if (Number(form.altura) < 50 || Number(form.altura) > 250) { setError('La altura debe estar entre 50 y 250 cm'); return }
    if (!form.fecha_vencimiento) { setError('La fecha de vencimiento es obligatoria'); return }
    if (form.horas_sueno) {
      if (!/^\d+$/.test(String(form.horas_sueno))) { setError('Las horas de sueño deben ser un número entero'); return }
      if (Number(form.horas_sueno) < 1 || Number(form.horas_sueno) > 24) { setError('Las horas de sueño deben estar entre 1 y 24'); return }
    }
    if (form.enfermedad_cronica && !form.descripcion_enfermedad.trim()) { setError('Describí la enfermedad crónica'); return }
    if (form.medicacion_regular && !form.descripcion_medicacion.trim()) { setError('Describí la medicación regular'); return }
    if (form.cirugias && !form.descripcion_cirugias.trim()) { setError('Describí las cirugías'); return }
    if (form.lesiones && !form.descripcion_lesiones.trim()) { setError('Describí las lesiones'); return }

    setLoading(true)
    try {
      esEdicion ? await editarCliente() : await crearCliente()
      toast(esEdicion ? 'Cliente guardado' : 'Cliente creado')
      navigate('/admin/clientes')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function crearCliente() {
    const { data: existente } = await supabase
      .from('clientes')
      .select('id')
      .ilike('correo', `${dni}@%`)
      .maybeSingle()

    if (existente) throw new Error(`El DNI ${dni} ya está registrado`)

    const result = await invocarFuncion('crear-usuario', {
      dni, pin, rol: 'cliente',
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

    if (result.cliente_id && form.fecha_vencimiento) {
      await supabase.from('renovaciones').insert({
        cliente_id: result.cliente_id,
        fecha_vencimiento: form.fecha_vencimiento,
        metodo_pago: form.metodo_pago,
        fecha_renovacion: new Date().toISOString().split('T')[0],
      })
    }
  }

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

    if (pin.length === 4) {
      const { data: clienteData } = await supabase.from('clientes').select('user_id').eq('id', id).single()
      const { data, error: pinError } = await supabase.functions.invoke('actualizar-pin', {
        body: { user_id: clienteData.user_id, pin }
      })
      if (pinError || data?.error) throw new Error('Error actualizando PIN')
    }
  }

  if (cargandoDatos) return (
    <>
      <div className="admin-form-header">
        <div className="skeleton" style={{ width: '80px', height: '20px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ width: '140px', height: '24px', borderRadius: '6px' }} />
      </div>
      <SkeletonList count={5} />
    </>
  )

  return (
    <div className="admin-form-page">

      <div className="admin-form-header">
        <button className="btn-back" onClick={() => navigate('/admin/clientes')}>
          ← Volver
        </button>
        <h1 className="admin-page-title">{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Acceso ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Acceso</p>
          <div className="admin-form-grid">
            <div className="input-group">
              <label className="input-label">DNI</label>
              <input
                className="input"
                type="text"
                value={dni}
                onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                disabled={esEdicion}
                placeholder="12345678"
                minLength={6}
                maxLength={11}
                autoComplete="off"
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                {esEdicion ? 'Nuevo PIN (vacío = no cambiar)' : 'PIN'}
              </label>
              <input
                className="input"
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 dígitos"
                maxLength={4}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {/* ── Datos personales ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Datos personales</p>
          <div className="admin-form-grid">
            <div className="input-group">
              <label className="input-label">Nombre</label>
              <input
                className="input"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') }))}
                placeholder="Ej: Juan"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Apellido</label>
              <input
                className="input"
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={e => setForm(prev => ({ ...prev, apellido: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') }))}
                placeholder="Ej: González"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Edad</label>
              <input
                className="input"
                type="number"
                name="edad"
                value={form.edad}
                onChange={e => setForm(prev => ({ ...prev, edad: e.target.value.replace(/\D/g, '') }))}
                min={12}
                max={100}
                placeholder="Ej: 25"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Género</label>
              <select className="input" name="genero" value={form.genero} onChange={handleChange}>
                <option value="">Seleccionar</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Peso (kg)</label>
              <input
                className="input"
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
            <div className="input-group">
              <label className="input-label">Altura (cm)</label>
              <input
                className="input"
                type="number"
                name="altura"
                value={form.altura}
                onChange={e => setForm(prev => ({ ...prev, altura: e.target.value.replace(/\D/g, '') }))}
                min={50}
                max={250}
                placeholder="Ej: 170"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Nivel de actividad</label>
              <select className="input" name="nivel_actividad" value={form.nivel_actividad} onChange={handleChange}>
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Fecha de vencimiento</label>
              <input
                className="input"
                type="date"
                name="fecha_vencimiento"
                value={form.fecha_vencimiento}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Método de pago</label>
              <select className="input" name="metodo_pago" value={form.metodo_pago} onChange={handleChange}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Objetivo ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Objetivo</p>
          <div className="input-group">
            <label className="input-label">Objetivo</label>
            <textarea
              className="input"
              name="objetivo"
              value={form.objetivo}
              onChange={handleChange}
              placeholder="Ej: Bajar de peso, ganar masa muscular..."
            />
          </div>
          <div className="input-group">
            <label className="input-label">Horas de sueño</label>
            <input
              className="input"
              type="number"
              name="horas_sueno"
              value={form.horas_sueno}
              onChange={e => setForm(prev => ({ ...prev, horas_sueno: e.target.value.replace(/\D/g, '') }))}
              min={1}
              max={24}
              placeholder="Ej: 8"
            />
          </div>
        </div>

        {/* ── Salud ── */}
        <div className="admin-form-section">
          <p className="admin-form-section-title">Salud</p>

          {/* Condiciones simples en grilla */}
          <div className="admin-check-grid" style={{ marginBottom: '12px' }}>
            {[
              { name: 'diabetes', label: 'Diabetes' },
              { name: 'hipotension', label: 'Hipotensión' },
              { name: 'hipotiroidismo', label: 'Hipotiroidismo' },
              { name: 'asma', label: 'Asma' },
              { name: 'fuma', label: 'Fuma' },
              { name: 'alcohol', label: 'Consume alcohol' },
            ].map(({ name, label }) => (
              <label key={name} className="admin-check-label">
                <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} />
                {label}
              </label>
            ))}
          </div>

          {/* Condiciones con descripción */}
          <div className="admin-check-list">
            <div className="admin-check-item">
              <label className="admin-check-label">
                <input type="checkbox" name="enfermedad_cronica" checked={form.enfermedad_cronica} onChange={handleChange} />
                Enfermedad crónica
              </label>
              {form.enfermedad_cronica && (
                <input className="input" type="text" name="descripcion_enfermedad" value={form.descripcion_enfermedad} onChange={handleChange} placeholder="Describí la enfermedad" />
              )}
            </div>

            <div className="admin-check-item">
              <label className="admin-check-label">
                <input type="checkbox" name="medicacion_regular" checked={form.medicacion_regular} onChange={handleChange} />
                Medicación regular
              </label>
              {form.medicacion_regular && (
                <input className="input" type="text" name="descripcion_medicacion" value={form.descripcion_medicacion} onChange={handleChange} placeholder="Describí la medicación" />
              )}
            </div>

            <div className="admin-check-item">
              <label className="admin-check-label">
                <input type="checkbox" name="cirugias" checked={form.cirugias} onChange={handleChange} />
                Cirugías
              </label>
              {form.cirugias && (
                <input className="input" type="text" name="descripcion_cirugias" value={form.descripcion_cirugias} onChange={handleChange} placeholder="Describí las cirugías" />
              )}
            </div>

            <div className="admin-check-item">
              <label className="admin-check-label">
                <input type="checkbox" name="lesiones" checked={form.lesiones} onChange={handleChange} />
                Lesiones
              </label>
              {form.lesiones && (
                <input className="input" type="text" name="descripcion_lesiones" value={form.descripcion_lesiones} onChange={handleChange} placeholder="Describí las lesiones" />
              )}
            </div>
          </div>
        </div>

        {error && <div className="msg-error mb-16">{error}</div>}

        <div className="admin-form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/clientes')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>

      </form>
    </div>
  )
}
