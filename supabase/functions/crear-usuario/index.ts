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
    console.log('1. Iniciando función')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')
    console.log('2. Auth header recibido')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    console.log('3. Usuario:', user?.id, 'Error:', userError?.message)
    if (!user) throw new Error('No autorizado')

    const { data: userData, error: rolError } = await supabaseAdmin
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single()
    console.log('4. Rol:', userData?.rol, 'Error:', rolError?.message)

    if (userData?.rol !== 'admin') throw new Error('Sin permisos')

    const body = await req.json()
    console.log('5. Body recibido:', JSON.stringify(body))

    const { dni, pin, rol, perfil } = body
    if (!dni || !pin || !rol) throw new Error('Faltan campos obligatorios')

    const email = `${dni}@retofitness.com`

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
    })
    console.log('6. Auth user creado:', authData?.user?.id, 'Error:', authError?.message)
    if (authError) throw new Error(authError.message)

    const uid = authData.user.id

    const { error: insertUserError } = await supabaseAdmin
      .from('users')
      .insert({ id: uid, rol, activo: true })
    console.log('7. User insertado, Error:', insertUserError?.message)
    if (insertUserError) throw new Error(insertUserError.message)

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
    console.log('8. Cliente insertado, Error:', perfilError?.message)
    if (perfilError) throw new Error(perfilError.message)
  } else if (rol === 'entrenador') {
      const { error: perfilError } = await supabaseAdmin
        .from('entrenadores')
        .insert({ user_id: uid, correo: email, ...perfil })
      console.log('8. Entrenador insertado, Error:', perfilError?.message)
      if (perfilError) throw new Error(perfilError.message)
    }

    return new Response(
      JSON.stringify({ ok: true, uid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.log('ERROR:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})