import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar que quien llama es admin
    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (userData?.rol !== 'admin') throw new Error('Sin permisos')

    const body = await req.json()
    const { dni, pin, rol, perfil } = body

    // Validaciones del lado del servidor
    if (!dni || !pin || !rol) throw new Error('Faltan campos obligatorios')
    if (typeof dni !== 'string' || !/^\d{6,11}$/.test(dni)) throw new Error('DNI inválido')
    if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) throw new Error('PIN inválido')
    if (!['cliente', 'entrenador'].includes(rol)) throw new Error('Rol inválido')
    if (!perfil?.nombre || typeof perfil.nombre !== 'string') throw new Error('Nombre inválido')
    if (!perfil?.apellido || typeof perfil.apellido !== 'string') throw new Error('Apellido inválido')

    // Verificar que el DNI no esté en uso
    const { data: usuariosData } = await supabaseAdmin.auth.admin.listUsers()
    const emailBuscado = `${dni}@retofitness.com`
    const yaExiste = usuariosData.users.some(u => u.email === emailBuscado)
    if (yaExiste) throw new Error(`El DNI ${dni} ya está registrado en el sistema`)

    const email = emailBuscado

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
    })
    if (authError) throw new Error(authError.message)

    const uid = authData.user.id

    // 2. Insertar en tabla users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({ id: uid, rol, activo: true })
    if (userError) throw new Error(userError.message)

    // 3. Insertar perfil según rol
    if (rol === 'cliente') {
      const perfilLimpio = {
        ...perfil,
        edad: perfil.edad ? parseInt(perfil.edad) : null,
        peso: perfil.peso ? parseFloat(perfil.peso) : null,
        altura: perfil.altura ? parseInt(perfil.altura) : null,
        horas_sueno: perfil.horas_sueno ? parseInt(perfil.horas_sueno) : null,
      }
      const { error: perfilError } = await supabaseAdmin
        .from('clientes')
        .insert({ user_id: uid, correo: email, ...perfilLimpio })
      if (perfilError) throw new Error(perfilError.message)
    } else if (rol === 'entrenador') {
      const { error: perfilError } = await supabaseAdmin
        .from('entrenadores')
        .insert({ user_id: uid, correo: email, nombre: perfil.nombre, apellido: perfil.apellido })
      if (perfilError) throw new Error(perfilError.message)
    }

    return new Response(
      JSON.stringify({ ok: true, uid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})