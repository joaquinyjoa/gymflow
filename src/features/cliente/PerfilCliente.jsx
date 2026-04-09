import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { supabase } from '../../lib/supabase'
import { leerHistorialPesos } from '../../hooks/useRutinaCache'
import { useToast } from '../../components/Toast'

function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function estaVencido(fecha) {
  if (!fecha) return false
  return fecha < new Date().toISOString().split('T')[0]
}

export default function PerfilCliente() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const historial = leerHistorialPesos()

  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ peso: '', altura: '', objetivo: '' })
  const [guardando, setGuardando] = useState(false)
  const [editError, setEditError] = useState('')

  function abrirEdicion() {
    setFormEdit({ peso: perfil?.peso ?? '', altura: perfil?.altura ?? '', objetivo: perfil?.objetivo ?? '' })
    setEditError('')
    setEditando(true)
  }

  async function guardarEdicion() {
    setEditError('')
    if (formEdit.peso && (isNaN(formEdit.peso) || Number(formEdit.peso) < 20 || Number(formEdit.peso) > 300)) {
      setEditError('El peso debe estar entre 20 y 300 kg'); return
    }
    if (formEdit.altura && (isNaN(formEdit.altura) || Number(formEdit.altura) < 50 || Number(formEdit.altura) > 250)) {
      setEditError('La altura debe estar entre 50 y 250 cm'); return
    }
    setGuardando(true)
    const { error } = await supabase.from('clientes').update({
      peso: formEdit.peso ? Number(formEdit.peso) : perfil.peso,
      altura: formEdit.altura ? Number(formEdit.altura) : perfil.altura,
      objetivo: formEdit.objetivo || perfil.objetivo,
    }).eq('id', perfil.id)

    if (error) { setEditError('Error al guardar, intentá de nuevo') }
    else {
      setEditando(false)
      toast('Datos actualizados')
    }
    setGuardando(false)
  }

  const [pinActual, setPinActual]   = useState('')
  const [pinNuevo, setPinNuevo]     = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [cambiando, setCambiando]   = useState(false)
  const [pinError, setPinError]     = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const vencido = estaVencido(perfil?.fecha_vencimiento)

  async function cambiarPin() {
    setPinError('')
    if (!pinActual || !pinNuevo || !pinConfirm) { setPinError('Completá todos los campos'); return }
    if (pinNuevo.length < 4) { setPinError('El PIN debe tener al menos 4 caracteres'); return }
    if (pinNuevo !== pinConfirm) { setPinError('Los PINs nuevos no coinciden'); return }

    setCambiando(true)
    try {
      // Verificar PIN actual reautenticando
      const { data: { user } } = await supabase.auth.getUser()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pinActual,
      })
      if (signInError) { setPinError('El PIN actual es incorrecto'); return }

      const { error } = await supabase.auth.updateUser({ password: pinNuevo })
      if (error) throw error

      toast('PIN cambiado correctamente')
      setPinActual(''); setPinNuevo(''); setPinConfirm('')
      setMostrarForm(false)
    } catch {
      setPinError('Error al cambiar el PIN, intentá de nuevo')
    } finally {
      setCambiando(false)
    }
  }

  if (!perfil) return null

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <button className="btn-back" onClick={() => navigate('/rutina')}>← Volver</button>
        <h1 className="perfil-titulo">Mi perfil</h1>
      </div>

      {/* Datos personales */}
      <div className="perfil-card">
        <div className="perfil-section-title">Datos personales</div>
        <div className="perfil-row">
          <span className="perfil-label">Nombre</span>
          <span className="perfil-val">{perfil.nombre} {perfil.apellido}</span>
        </div>
        <div className="perfil-row">
          <span className="perfil-label">DNI</span>
          <span className="perfil-val">{perfil.correo?.split('@')[0]}</span>
        </div>
        {perfil.genero && (
          <div className="perfil-row">
            <span className="perfil-label">Género</span>
            <span className="perfil-val">{perfil.genero}</span>
          </div>
        )}
      </div>

      {/* Stats físicos */}
      {(perfil.edad || perfil.peso || perfil.altura) && (
        <div className="perfil-card">
          <div className="perfil-section-title-row">
            <span className="perfil-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Medidas</span>
            {!editando && (
              <button className="btn-perfil-edit" onClick={abrirEdicion}>Editar</button>
            )}
          </div>

          {editando ? (
            <div className="perfil-edit-form">
              {editError && <div className="msg-error mb-16">{editError}</div>}
              <div className="perfil-edit-grid">
                <div className="input-group">
                  <label className="input-label">Peso (kg)</label>
                  <input className="input" type="number" value={formEdit.peso}
                    onChange={e => setFormEdit(p => ({ ...p, peso: e.target.value }))}
                    placeholder={String(perfil.peso ?? '')} min={20} max={300} step="0.1" />
                </div>
                <div className="input-group">
                  <label className="input-label">Altura (cm)</label>
                  <input className="input" type="number" value={formEdit.altura}
                    onChange={e => setFormEdit(p => ({ ...p, altura: e.target.value }))}
                    placeholder={String(perfil.altura ?? '')} min={50} max={250} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Objetivo</label>
                <textarea className="input" rows={2} value={formEdit.objetivo}
                  onChange={e => setFormEdit(p => ({ ...p, objetivo: e.target.value }))}
                  placeholder={perfil.objetivo ?? ''} />
              </div>
              <div className="perfil-pin-acciones">
                <button className="btn btn-primary" onClick={guardarEdicion} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
                <button className="btn btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="perfil-stats-grid" style={{ marginTop: '12px' }}>
              {perfil.edad && (
                <div className="perfil-stat">
                  <span className="perfil-stat-val">{perfil.edad}</span>
                  <span className="perfil-stat-label">años</span>
                </div>
              )}
              {perfil.peso && (
                <div className="perfil-stat">
                  <span className="perfil-stat-val">{formEdit.peso || perfil.peso}</span>
                  <span className="perfil-stat-label">kg</span>
                </div>
              )}
              {perfil.altura && (
                <div className="perfil-stat">
                  <span className="perfil-stat-val">{formEdit.altura || perfil.altura}</span>
                  <span className="perfil-stat-label">cm</span>
                </div>
              )}
              {perfil.nivel_actividad && (
                <div className="perfil-stat">
                  <span className="perfil-stat-val">{perfil.nivel_actividad}</span>
                  <span className="perfil-stat-label">actividad</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Membresía */}
      <div className="perfil-card">
        <div className="perfil-section-title">Membresía</div>
        <div className="perfil-row">
          <span className="perfil-label">Vencimiento</span>
          <span className={vencido ? 'fecha-vencida' : 'fecha-vigente'}>
            {fmtFecha(perfil.fecha_vencimiento)}
            {vencido && <span className="badge badge-danger" style={{ marginLeft: '8px' }}>Vencida</span>}
          </span>
        </div>
        <div className="perfil-row">
          <span className="perfil-label">Estado</span>
          <span className={`badge ${perfil.estado && !vencido ? 'badge-success' : 'badge-neutral'}`}>
            {perfil.estado && !vencido ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        {perfil.objetivo && (
          <div className="perfil-row perfil-row-col">
            <span className="perfil-label">Objetivo</span>
            <span className="perfil-objetivo">{perfil.objetivo}</span>
          </div>
        )}
      </div>

      {/* Historial de pesos */}
      {historial.length > 0 && (
        <div className="perfil-card">
          <div className="perfil-section-title">Historial de pesos</div>
          {historial.map((ej, i) => (
            <div key={i} className="historial-ejercicio">
              <div className="historial-ej-nombre">{ej.nombre || 'Ejercicio'}</div>
              <div className="historial-entradas">
                {ej.entradas.map((e, j) => (
                  <div key={j} className="historial-entrada">
                    <span className="historial-fecha">
                      {new Date(e.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="historial-vals">
                      {e.valores.filter(v => v !== '').map((v, k) => (
                        <span key={k} className="historial-chip">S{k + 1}: {v}kg</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cambio de PIN */}
      <div className="perfil-card">
        <div className="perfil-section-title">Seguridad</div>

        {!mostrarForm ? (
          <button className="btn btn-secondary btn-full" onClick={() => setMostrarForm(true)}>
            Cambiar PIN
          </button>
        ) : (
          <div className="perfil-pin-form">
            {pinError && <div className="msg-error mb-16">{pinError}</div>}
            <div className="input-group">
              <label className="input-label">PIN actual</label>
              <input className="input" type="password" inputMode="numeric" value={pinActual}
                onChange={e => setPinActual(e.target.value)} placeholder="••••" />
            </div>
            <div className="input-group">
              <label className="input-label">Nuevo PIN</label>
              <input className="input" type="password" inputMode="numeric" value={pinNuevo}
                onChange={e => setPinNuevo(e.target.value)} placeholder="••••" />
            </div>
            <div className="input-group">
              <label className="input-label">Confirmar nuevo PIN</label>
              <input className="input" type="password" inputMode="numeric" value={pinConfirm}
                onChange={e => setPinConfirm(e.target.value)} placeholder="••••" />
            </div>
            <div className="perfil-pin-acciones">
              <button className="btn btn-primary" onClick={cambiarPin} disabled={cambiando}>
                {cambiando ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn btn-ghost" onClick={() => { setMostrarForm(false); setPinError('') }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
