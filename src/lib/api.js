import { supabase } from './supabase'

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa')
  return session.access_token
}

async function fetchFuncion(nombre, body, token) {
  return fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${nombre}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body)
    }
  )
}

export async function invocarFuncion(nombre, body) {
  let token = await getToken()
  let response = await fetchFuncion(nombre, body, token)

  // Token expirado — refrescar y reintentar una vez
  if (response.status === 401) {
    const { data: { session } } = await supabase.auth.refreshSession()
    if (!session) throw new Error('Sesión expirada, iniciá sesión de nuevo')
    token = session.access_token
    response = await fetchFuncion(nombre, body, token)
  }

  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? 'Error en la operación')
  return result
}