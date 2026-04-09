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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: CORS })
  }

  // Cliente con anon key + JWT del usuario para verificar identidad
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  // Cliente con service role para operaciones admin
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verificar que el caller es admin
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: CORS })
  }

  const { data: userData } = await supabaseAdmin
    .from('users').select('rol').eq('id', user.id).single()

  if (userData?.rol !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Solo el administrador puede crear usuarios' }),
      { status: 403, headers: CORS }
    )
  }

  // Procesar request
  const { dni, pin, rol, perfil } = await req.json()

  if (!dni || !pin || !rol || !perfil) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos obligatorios' }),
      { status: 400, headers: CORS }
    )
  }

  const email = `${dni}${EMAIL_DOMAIN}`

  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
  const { error: userInsertError } = await supabaseAdmin
    .from('users')
    .insert({ id: userId, rol, activo: true })

  if (userInsertError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return new Response(JSON.stringify({ error: userInsertError.message }), { status: 400, headers: CORS })
  }

  // 3. Insertar perfil en clientes o entrenadores
  const tabla = rol === 'cliente' ? 'clientes' : 'entrenadores'
  const { error: perfilError } = await supabaseAdmin
    .from(tabla)
    .insert({ user_id: userId, correo: email, ...perfil })

  if (perfilError) {
    await supabaseAdmin.from('users').delete().eq('id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return new Response(JSON.stringify({ error: perfilError.message }), { status: 400, headers: CORS })
  }

  // 4. Obtener el ID del perfil creado
  const { data: perfilCreado } = await supabaseAdmin
    .from(tabla)
    .select('id')
    .eq('user_id', userId)
    .single()

  return new Response(
    JSON.stringify({ ok: true, cliente_id: perfilCreado?.id ?? null }),
    { status: 200, headers: CORS }
  )
})
