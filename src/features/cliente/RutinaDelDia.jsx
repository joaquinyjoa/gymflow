import { useEffect, useState, useRef } from 'react'
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completados, setCompletados] = useState(new Set())
  const carruselRef = useRef(null)

  // Resetear completados al cambiar de día
  useEffect(() => { setCompletados(new Set()); setCurrentIndex(0) }, [diaSeleccionado])

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

          {/* Carrusel de ejercicios */}
          <div
            className="ejercicios-carrusel"
            ref={carruselRef}
            onScroll={() => {
              if (!carruselRef.current) return
              const idx = Math.round(carruselRef.current.scrollLeft / carruselRef.current.offsetWidth)
              setCurrentIndex(idx)
            }}
          >
            {rutinaDelDia.ejercicios.map((ej, index) => (
              <EjercicioCard
                key={ej.id}
                ej={ej}
                index={index}
                rutinaClienteId={rutinaDelDia.id}
                completado={completados.has(ej.id)}
                onCompletar={() => setCompletados(prev => {
                  const next = new Set(prev)
                  if (next.has(ej.id)) next.delete(ej.id)
                  else next.add(ej.id)
                  return next
                })}
                onVerMas={() => navigate(`/rutina/ejercicio/${ej.ejercicioFinal?.id}`, {
                  state: { ejercicio: ej.ejercicioFinal }
                })}
              />
            ))}
          </div>

          {/* Dots */}
          {rutinaDelDia.ejercicios.length > 1 && (
            <div className="carrusel-dots">
              {rutinaDelDia.ejercicios.map((_, i) => (
                <button
                  key={i}
                  className={`carrusel-dot${i === currentIndex ? ' activo' : ''}`}
                  onClick={() => {
                    carruselRef.current?.scrollTo({ left: i * carruselRef.current.offsetWidth, behavior: 'smooth' })
                    setCurrentIndex(i)
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function useTemporizador(segundos) {
  const [activo, setActivo] = useState(false)
  const [restante, setRestante] = useState(segundos)
  const intervaloRef = useRef(null)

  function iniciar() {
    setRestante(segundos)
    setActivo(true)
  }

  function cancelar() {
    clearInterval(intervaloRef.current)
    setActivo(false)
    setRestante(segundos)
  }

  useEffect(() => {
    if (!activo) return
    intervaloRef.current = setInterval(() => {
      setRestante(prev => {
        if (prev <= 1) {
          clearInterval(intervaloRef.current)
          setActivo(false)
          // Vibración (Android Chrome / algunos browsers)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          // Beep via AudioContext
          try {
            const AudioCtx = window.AudioContext || window['webkitAudioContext']
          const ctx = new AudioCtx()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 880
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.5)
          } catch {}
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervaloRef.current)
  }, [activo])

  return { activo, restante, iniciar, cancelar }
}

function EjercicioCard({ ej, index, rutinaClienteId, completado, onCompletar, onVerMas }) {
  const timer = useTemporizador(ej.descanso_segundos)

  const mm = String(Math.floor(timer.restante / 60)).padStart(2, '0')
  const ss = String(timer.restante % 60).padStart(2, '0')
  const progreso = timer.restante / ej.descanso_segundos

  return (
    <div className={`ejercicio-card${completado ? ' completado' : ''}`}>

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

      {/* Temporizador de descanso */}
      <div className="timer-descanso">
        {!timer.activo ? (
          <button className="btn-timer-iniciar" onClick={timer.iniciar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Iniciar descanso ({ej.descanso_segundos}s)
          </button>
        ) : (
          <div className="timer-activo">
            <svg className="timer-ring" viewBox="0 0 44 44" width="44" height="44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="3"/>
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="var(--acento)" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progreso)}`}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '22px 22px', transition: 'stroke-dashoffset 1s linear' }}
              />
              <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-primary)">{mm}:{ss}</text>
            </svg>
            <span className="timer-label">
              {timer.restante === 0 ? '¡Listo!' : `Descansando ${mm}:${ss}`}
            </span>
            <button className="btn-timer-cancelar" onClick={timer.cancelar}>✕</button>
          </div>
        )}
      </div>

      {/* Registro de peso */}
      <RegistroPeso
        rutinaClienteId={rutinaClienteId}
        ejercicioId={ej.ejercicio_id}
        series={ej.series}
      />

      {/* Acciones */}
      <div className="ejercicio-acciones">
        <button className={`btn-completar${completado ? ' completado' : ''}`} onClick={onCompletar}>
          {completado ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Completado
            </>
          ) : 'Marcar como completado'}
        </button>
        <button className="btn-ver-mas" onClick={onVerMas}>
          <IconChevron />
        </button>
      </div>
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
