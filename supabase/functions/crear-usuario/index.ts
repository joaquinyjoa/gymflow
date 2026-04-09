import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EMAIL_DOMAIN = '@retofitness.com'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── Verificar que el caller es admin ──────────────────────────────────
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: CORS })
  }

  const { data: { user: caller } } = await supabase.auth.getUser(token)
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: CORS })
  }

  const { data: callerData } = await supabase
    .from('users').select('rol').eq('id', caller.id).single()

  if (callerData?.rol !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Solo el administrador puede crear usuarios' }),
      { status: 403, headers: CORS }
    )
  }

  // ── Procesar request ───────────────────────────────────────────────────
  const { dni, pin, rol, perfil } = await req.json()

  if (!dni || !pin || !rol || !perfil) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos obligatorios' }),
      { status: 400, headers: CORS }
    )
  }

  const email = `${dni}${EMAIL_DOMAIN}`

  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
  })

  if (authError) {
    return new Response(
      JSON.stringify({ error: authError.message }),
      { status: 400, headers: CORS }
    )
  }

  const userId = authData.user.id

  // 2. Insertar en tabla users
  const { error: userError } = await supabase
    .from('users')
    .insert({ id: userId, rol, activo: true })

  if (userError) {
    await supabase.auth.admin.deleteUser(userId)
    return new Response(JSON.stringify({ error: userError.message }), { status: 400, headers: CORS })
  }

  // 3. Insertar perfil en clientes o entrenadores
  const tabla = rol === 'cliente' ? 'clientes' : 'entrenadores'
  const { data: perfilData, error: perfilError } = await supabase
    .from(tabla)
    .insert({ user_id: userId, correo: email, ...perfil })
    .select('id')
    .single()

  if (perfilError) {
    await supabase.from('users').delete().eq('id', userId)
    await supabase.auth.admin.deleteUser(userId)
    return new Response(JSON.stringify({ error: perfilError.message }), { status: 400, headers: CORS })
  }

  return new Response(JSON.stringify({ ok: true, cliente_id: perfilData?.id ?? null }), { status: 200, headers: CORS })
})
