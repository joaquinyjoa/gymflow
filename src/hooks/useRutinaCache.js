import { supabase } from '../lib/supabase'

const CACHE_KEY_RUTINA = (clienteId) => `rutina_cliente_${clienteId}`
const CACHE_KEY_TIMESTAMP = (clienteId) => `rutina_timestamp_${clienteId}`
const CACHE_KEY_PESO = (rutinaClienteId, ejercicioId) => `peso_${rutinaClienteId}_${ejercicioId}`

// Guardar rutina en cache
function guardarEnCache(clienteId, rutina, updatedAt) {
  localStorage.setItem(CACHE_KEY_RUTINA(clienteId), JSON.stringify(rutina))
  localStorage.setItem(CACHE_KEY_TIMESTAMP(clienteId), updatedAt)
}

// Leer rutina del cache
function leerDelCache(clienteId) {
  try {
    const rutina = localStorage.getItem(CACHE_KEY_RUTINA(clienteId))
    const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP(clienteId))
    if (!rutina) return null
    return { rutina: JSON.parse(rutina), timestamp }
  } catch {
    return null
  }
}

// Obtener rutina completa desde Supabase
async function fetchRutinaCompleta(clienteId) {
  const { data, error } = await supabase
    .from('rutinas_clientes')
    .select(`
      id,
      dia_semana,
      updated_at,
      rutinas(
        id,
        nombre,
        descripcion,
        nivel_dificultad,
        rutinas_ejercicios(
          id,
          orden,
          series,
          repeticiones,
          descanso_segundos,
          porcentaje_fuerza,
          notas,
          ejercicio_id,
          ejercicios!rutinas_ejercicios_ejercicio_id_fkey(
            id,
            nombre,
            musculo_principal,
            descripcion,
            instrucciones,
            consejos,
            enlace_video,
            equipamiento
          ),
          ejercicio_alternativo_id
        )
      ),
      rutinas_clientes_ejercicios(
        id,
        ejercicio_id,
        orden,
        series,
        repeticiones,
        descanso_segundos,
        porcentaje_fuerza,
        notas,
        ejercicios!rutinas_clientes_ejercicios_ejercicio_id_fkey(
          id,
          nombre,
          musculo_principal,
          descripcion,
          instrucciones,
          consejos,
          enlace_video,
          equipamiento
        )
      )
    `)
    .eq('cliente_id', clienteId)
    .order('dia_semana', { ascending: true })

  if (error) throw new Error(error.message)

  // Procesar overrides — si hay un override para un ejercicio, reemplazarlo
  const rutinasConOverrides = data.map(asignacion => {
    const overrides = asignacion.rutinas_clientes_ejercicios ?? []
    const ejerciciosBase = asignacion.rutinas?.rutinas_ejercicios ?? []

    const ejerciciosProcesados = ejerciciosBase
      .sort((a, b) => a.orden - b.orden)
      .map(ej => {
        const override = overrides.find(o => o.ejercicio_id === ej.ejercicio_id)
        return {
          ...ej,
          ejercicioFinal: override
            ? override.ejercicios
            : ej.ejercicios,
          series: override?.series ?? ej.series,
          repeticiones: override?.repeticiones ?? ej.repeticiones,
          descanso_segundos: override?.descanso_segundos ?? ej.descanso_segundos,
          porcentaje_fuerza: override?.porcentaje_fuerza ?? ej.porcentaje_fuerza,
          notas: override?.notas ?? ej.notas,
          tieneOverride: Boolean(override),
        }
      })

    return {
      id: asignacion.id,
      dia_semana: asignacion.dia_semana,
      updated_at: asignacion.updated_at,
      rutina: {
        id: asignacion.rutinas?.id,
        nombre: asignacion.rutinas?.nombre,
        descripcion: asignacion.rutinas?.descripcion,
        nivel_dificultad: asignacion.rutinas?.nivel_dificultad,
      },
      ejercicios: ejerciciosProcesados,
    }
  })

  return rutinasConOverrides
}

// Obtener solo los timestamps actuales desde Supabase (query mínima)
async function fetchTimestamps(clienteId) {
  const { data, error } = await supabase
    .from('rutinas_clientes')
    .select('id, updated_at')
    .eq('cliente_id', clienteId)

  if (error) throw new Error(error.message)
  return data
}

// Hook principal
export async function getRutinas(clienteId) {
  const cache = leerDelCache(clienteId)

  // Si no hay cache, descargar todo
  if (!cache) {
    const rutinas = await fetchRutinaCompleta(clienteId)
    if (rutinas.length > 0) {
      const ultimoTimestamp = rutinas
        .map(r => r.updated_at)
        .sort()
        .pop()
      guardarEnCache(clienteId, rutinas, ultimoTimestamp)
    }
    return { rutinas, desdeCache: false }
  }

  // Si hay cache, verificar timestamps
  try {
    const timestamps = await fetchTimestamps(clienteId)
    const ultimoTimestampRemoto = timestamps
      .map(t => t.updated_at)
      .sort()
      .pop()

    // Si el timestamp remoto es más nuevo, actualizar cache
    if (ultimoTimestampRemoto > cache.timestamp) {
      const rutinas = await fetchRutinaCompleta(clienteId)
      guardarEnCache(clienteId, rutinas, ultimoTimestampRemoto)
      return { rutinas, desdeCache: false }
    }

    // Cache válido, usarlo
    return { rutinas: cache.rutina, desdeCache: true }
  } catch {
    // Si falla la red, usar cache igual (offline)
    return { rutinas: cache.rutina, desdeCache: true }
  }
}

// Guardar y leer peso por ejercicio
export function guardarPeso(rutinaClienteId, ejercicioId, series, valores) {
  const key = CACHE_KEY_PESO(rutinaClienteId, ejercicioId)
  const datos = { series, valores, fecha: new Date().toISOString() }
  localStorage.setItem(key, JSON.stringify(datos))
}

export function leerPeso(rutinaClienteId, ejercicioId) {
  try {
    const datos = localStorage.getItem(CACHE_KEY_PESO(rutinaClienteId, ejercicioId))
    return datos ? JSON.parse(datos) : null
  } catch {
    return null
  }
}