import { supabase } from './supabase'

export async function invocarFuncion(nombre, body) {
  const { data, error } = await supabase.functions.invoke(nombre, { body })
  if (error) throw new Error(error.message ?? 'Error en la operación')
  if (data?.error) throw new Error(data.error)
  return data
}