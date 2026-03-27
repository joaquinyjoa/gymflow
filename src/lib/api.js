import { supabase } from './supabase'

export async function invocarFuncion(nombre, body) {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${nombre}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body)
    }
  )

  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? 'Error en la operación')
  return result
}