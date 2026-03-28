import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { getRutinas, guardarPeso, leerPeso } from '../../hooks/useRutinaCache'

const DIAS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

export default function RutinaDelDia() {
  const [rutinas, setRutinas] = useState([])
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [desdeCache, setDesdeCache] = useState(false)
  const [error, setError] = useState(null)

  const { perfil, clienteVencido = false } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (perfil?.id) cargarRutinas()
  }, [perfil])

  async function cargarRutinas() {
    setLoading(true)
    try {
      const { rutinas, desdeCache } = await getRutinas(perfil.id)
      setRutinas(rutinas)
      setDesdeCache(desdeCache)

      // Seleccionar el día de hoy si tiene rutina, sino el primero disponible
      const hoy = new Date().getDay()
      const diaHoy = hoy === 0 ? 7 : hoy
      const tieneHoy = rutinas.some(r => r.dia_semana === diaHoy)
      setDiaSeleccionado(tieneHoy ? diaHoy : rutinas[0]?.dia_semana ?? null)
    } catch (err) {
      setError('Error al cargar tu rutina')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Mostrar mensaje de vencimiento
  if (clienteVencido) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '48px' }}>😔</p>
        <h2>Tu acceso está vencido</h2>
        <p style={{ marginTop: '12px', color: '#666' }}>
          Para ver tu rutina necesitás renovar tu membresía.
        </p>
        <p style={{ marginTop: '8px', color: '#666' }}>
          Acercate a recepción o contactá a tu gimnasio para abonar el mes y volver a entrenar. 💪
        </p>
      </div>
    )
  }

  const rutinaDelDia = rutinas.find(r => r.dia_semana === diaSeleccionado)

  if (loading) return <p>Cargando tu rutina...</p>
  if (error) return <p>{error}</p>
    if (clienteVencido) {
    return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '48px' }}>😔</p>
        <h2>Tu acceso está vencido</h2>
        <p style={{ marginTop: '12px', color: '#666' }}>
            Para ver tu rutina necesitás renovar tu membresía.
        </p>
        <p style={{ marginTop: '8px', color: '#666' }}>
            Acercate a recepción o contactá a tu gimnasio para abonar el mes y volver a entrenar. 💪
        </p>
        </div>
    )
    }

    if (rutinas.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '48px' }}>🏋️</p>
        <h2>No tenés rutinas asignadas</h2>
        <p style={{ color: '#666', marginTop: '12px' }}>
        Consultá a tu entrenador para que te asigne una rutina.
        </p>
    </div>
    )

  return (
    <div>
      {desdeCache && (
        <p style={{ fontSize: '12px', color: 'gray', textAlign: 'center' }}>
          📱 Rutina guardada localmente
        </p>
      )}

      {/* Selector de días */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0' }}>
        {DIAS.map(d => {
          const tieneRutina = rutinas.some(r => r.dia_semana === d.value)
          if (!tieneRutina) return null
          return (
            <button
              key={d.value}
              onClick={() => setDiaSeleccionado(d.value)}
              style={{
                padding: '8px 16px',
                background: diaSeleccionado === d.value ? '#333' : '#eee',
                color: diaSeleccionado === d.value ? 'white' : 'black',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {d.label}
            </button>
          )
        })}
      </div>

      {/* Rutina del día seleccionado */}
      {rutinaDelDia && (
        <div>
          <h1>{rutinaDelDia.rutina.nombre}</h1>
          {rutinaDelDia.rutina.descripcion && (
            <p>{rutinaDelDia.rutina.descripcion}</p>
          )}
          <p>Dificultad: {rutinaDelDia.rutina.nivel_dificultad}</p>
          <p>{rutinaDelDia.ejercicios.length} ejercicios</p>

          {/* Lista de ejercicios */}
          <div>
            {rutinaDelDia.ejercicios.map((ej, index) => (
              <div
                key={ej.id}
                style={{
                  border: '1px solid #ccc',
                  margin: '8px 0',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* GIF */}
                  {ej.ejercicioFinal?.enlace_video && (
                    <img
                      src={ej.ejercicioFinal.enlace_video}
                      alt={ej.ejercicioFinal.nombre}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <strong>{index + 1}. {ej.ejercicioFinal?.nombre}</strong>
                    <p>{ej.ejercicioFinal?.musculo_principal}</p>
                    <p>{ej.series} series × {ej.repeticiones}</p>
                    <p>Descanso: {ej.descanso_segundos}s — Intensidad: {ej.porcentaje_fuerza}%</p>
                    {ej.notas && <p>📝 {ej.notas}</p>}
                  </div>
                </div>

                {/* Registro de peso por serie */}
                <RegistroPeso
                  rutinaClienteId={rutinaDelDia.id}
                  ejercicioId={ej.ejercicio_id}
                  series={ej.series}
                />

                {/* Botón ver más */}
                <button
                  onClick={() => navigate(`/rutina/ejercicio/${ej.ejercicioFinal?.id}`, {
                    state: { ejercicio: ej.ejercicioFinal }
                  })}
                  style={{ marginTop: '8px' }}
                >
                  Ver más →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente interno para registrar peso por serie
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
    <div style={{ marginTop: '8px' }}>
      <p style={{ fontSize: '12px', color: 'gray' }}>Registrá tu peso por serie (kg)</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Array.from({ length: Number(series) }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ fontSize: '11px' }}>Serie {i + 1}</label>
            <input
              type="number"
              value={pesos[i] ?? ''}
              onChange={e => handlePesoChange(i, e.target.value)}
              placeholder="kg"
              style={{ width: '60px', textAlign: 'center' }}
              min={0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}