import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { invocarFuncion } from '../../../lib/api'
import { useToast } from '../../../components/Toast'

const estadoInicial = {
  nombre: '',
  apellido: '',
}

export default function EntrenadorForm() {
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
    if (esEdicion) cargarEntrenador()
  }, [id])

  async function cargarEntrenador() {
    setCargandoDatos(true)
    const { data, error } = await supabase.from('entrenadores').select('*').eq('id', id).single()
    if (error) {
      setError('Error al cargar entrenador')
    } else {
      setForm({
        nombre: data.nombre ?? '',
        apellido: data.apellido ?? '',
      })
      setDni(data.correo?.split('@')[0] ?? '')
    }
    setCargandoDatos(false)
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

    setLoading(true)
    try {
      esEdicion ? await editarEntrenador() : await crearEntrenador()
      toast(esEdicion ? 'Entrenador guardado' : 'Entrenador creado')
      navigate('/admin/entrenadores')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function crearEntrenador() {
    const { data: existente } = await supabase
      .from('entrenadores')
      .select('id')
      .ilike('correo', `${dni}@%`)
      .maybeSingle()

    if (existente) throw new Error(`El DNI ${dni} ya está registrado`)

    await invocarFuncion('crear-usuario', {
      dni, pin, rol: 'entrenador',
      perfil: { nombre: form.nombre, apellido: form.apellido }
    })
  }

  async function editarEntrenador() {
    const { error: entrenadorError } = await supabase
      .from('entrenadores')
      .update({ nombre: form.nombre, apellido: form.apellido })
      .eq('id', id)

    if (entrenadorError) throw new Error(`Error actualizando entrenador: ${entrenadorError.message}`)

    if (pin.length === 4) {
      const { data: entrenadorData } = await supabase.from('entrenadores').select('user_id').eq('id', id).single()
      const { data, error: pinError } = await supabase.functions.invoke('actualizar-pin', {
        body: { user_id: entrenadorData.user_id, pin }
      })
      if (pinError || data?.error) throw new Error('Error actualizando PIN')
    }
  }

  if (cargandoDatos) return (
    <div className="admin-loading">
      <p className="text-muted">Cargando datos del entrenador...</p>
    </div>
  )

  return (
    <div className="admin-form-page">

      <div className="admin-form-header">
        <button className="btn-back" onClick={() => navigate('/admin/entrenadores')}>
          ← Volver
        </button>
        <h1 className="admin-page-title">{esEdicion ? 'Editar entrenador' : 'Nuevo entrenador'}</h1>
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
                placeholder="Ej: Carlos"
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
                placeholder="Ej: López"
              />
            </div>
          </div>
        </div>

        {error && <div className="msg-error mb-16">{error}</div>}

        <div className="admin-form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/entrenadores')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear entrenador'}
          </button>
        </div>

      </form>
    </div>
  )
}
