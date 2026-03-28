import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { getRutinas, guardarPeso, leerPeso } from '../../hooks/useRutinaCache'
import '../../styles/features/cliente.css'

const DIAS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]

function IconChevron() {
  return (
    <svg className="icon-chevron" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

export default function RutinaDelDia() {
  const [rutinas, setRutinas] = useState([])
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const { perfil, clienteVencido } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarRutinas()
  }, [perfil])

  async function cargarRutinas() {
    setLoading(true)
    try {
      const { rutinas } = await getRutinas(perfil.id)
      setRutinas(rutinas)
      const hoy = new Date().getDay()
      const diaHoy = hoy === 0 ? 7 : hoy
      const tieneHoy = rutinas.some(r => r.dia_semana === diaHoy)
      setDiaSeleccionado(tieneHoy ? diaHoy : rutinas[0]?.dia_semana ?? null)
    } catch (err) {
      setError('Error al cargar tu rutina')
    } finally {
      setLoading(false)
    }
  }

  if (clienteVencido) return (
    <div className="estado-center">
      <div className="estado-icono">
        <svg className="icon-estado" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 className="estado-titulo">Acceso vencido</h2>
      <p className="estado-desc">
        Para ver tu rutina renová tu membresía. Acercate a recepción o contactá a tu gimnasio.
      </p>
    </div>
  )

  if (loading && rutinas.length === 0) return (
    <div className="estado-center">
      <p className="text-muted">Cargando tu rutina...</p>
    </div>
  )

  if (error) return <div className="msg-error mt-16">{error}</div>

  if (rutinas.length === 0) return (
    <div className="estado-center">
      <h2 className="estado-titulo">Sin rutinas asignadas</h2>
      <p>Consultá a tu entrenador para que te asigne una rutina.</p>
    </div>
  )

  const rutinaDelDia = rutinas.find(r => r.dia_semana === diaSeleccionado)

  return (
    <div className="rutina-container">

      {/* Selector de días */}
      <div className="dias-selector">
        {DIAS.map(d => {
          const tieneRutina = rutinas.some(r => r.dia_semana === d.value)
          if (!tieneRutina) return null
          const activo = diaSeleccionado === d.value
          return (
            <button
              key={d.value}
              onClick={() => setDiaSeleccionado(d.value)}
              className={`btn-dia${activo ? ' activo' : ''}`}
            >
              {d.label}
            </button>
          )
        })}
      </div>

      {rutinaDelDia && (
        <>
          {/* Header rutina */}
          <div className="card rutina-header">
            <div className="rutina-header-inner">
              <div>
                <h2 className="mb-8">{rutinaDelDia.rutina.nombre}</h2>
                <div className="rutina-badges">
                  <span className="badge badge-acento">{rutinaDelDia.rutina.nivel_dificultad}</span>
                  <span className="badge badge-neutral">{rutinaDelDia.ejercicios.length} ejercicios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de ejercicios */}
          {rutinaDelDia.ejercicios.length > 1 && (
            <p className="scroll-hint">Scroll hacia abajo para ver el siguiente ejercicio</p>
          )}
          <div className="ejercicios-lista">
            {rutinaDelDia.ejercicios.map((ej, index) => (
              <EjercicioCard
                key={ej.id}
                ej={ej}
                index={index}
                rutinaClienteId={rutinaDelDia.id}
                onVerMas={() => navigate(`/rutina/ejercicio/${ej.ejercicioFinal?.id}`, {
                  state: { ejercicio: ej.ejercicioFinal }
                })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function EjercicioCard({ ej, index, rutinaClienteId, onVerMas }) {
  return (
    <div className="ejercicio-card">

      {/* Número del ejercicio */}
      <div className="ejercicio-numero-header">
        <span className="ejercicio-numero">
          Ejercicio {String(index + 1).padStart(2, '0')}
        </span>
        {ej.tieneOverride && (
          <span className="badge badge-acento badge-xs">Personalizado</span>
        )}
      </div>

      {/* GIF full width */}
      <div className="ejercicio-gif">
        {ej.ejercicioFinal?.enlace_video ? (
          <img
            src={ej.ejercicioFinal.enlace_video}
            alt={ej.ejercicioFinal.nombre}
          />
        ) : (
          <div className="ejercicio-gif-placeholder">
            <svg className="icon-placeholder" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info debajo del GIF */}
      <div className="ejercicio-body">
        <h3>{ej.ejercicioFinal?.nombre}</h3>
        <p className="ejercicio-musculo">{ej.ejercicioFinal?.musculo_principal}</p>
        {ej.notas && (
          <p className="ejercicio-notas">{ej.notas}</p>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-val">{ej.series}</div>
          <div className="stat-label">Series</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">{ej.repeticiones}</div>
          <div className="stat-label">Reps</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">{ej.porcentaje_fuerza}%</div>
          <div className="stat-label">Intensidad</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">{ej.descanso_segundos}s</div>
          <div className="stat-label">Descanso</div>
        </div>
      </div>

      {/* Registro de peso */}
      <RegistroPeso
        rutinaClienteId={rutinaClienteId}
        ejercicioId={ej.ejercicio_id}
        series={ej.series}
      />

      {/* Ver más */}
      <button className="btn-ver-mas" onClick={onVerMas}>
        Ver instrucciones
        <IconChevron />
      </button>
    </div>
  )
}

function RegistroPeso({ rutinaClienteId, ejercicioId, series }) {
  const [pesos, setPesos] = useState(() => {
    const guardado = leerPeso(rutinaClienteId, ejercicioId)
    if (guardado && guardado.series === series) return guardado.valores
    return Array(Number(series)).fill('')
  })

  function handlePesoChange(index, valor) {
    const nuevos = [...pesos]
    nuevos[index] = valor.replace(/[^0-9.]/g, '')
    setPesos(nuevos)
    guardarPeso(rutinaClienteId, ejercicioId, series, nuevos)
  }

  return (
    <div className="registro-peso">
      <p className="registro-peso-titulo">Registrá tu peso</p>
      <div className="registro-peso-series">
        {Array.from({ length: Number(series) }).map((_, i) => {
          const tienePeso = pesos[i] && pesos[i] !== ''
          return (
            <div key={i} className="registro-peso-serie">
              <span className="registro-peso-label">S{i + 1}</span>
              <input
                type="number"
                value={pesos[i] ?? ''}
                onChange={e => handlePesoChange(i, e.target.value)}
                placeholder="kg"
                min={0}
                className={`peso-input${tienePeso ? ' con-peso' : ''}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
