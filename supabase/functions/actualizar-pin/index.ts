import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: CORS })
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verificar que el caller es admin
  const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !caller) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: CORS })
  }

  const { data: callerData } = await supabaseAdmin
    .from('users').select('rol').eq('id', caller.id).single()

  if (callerData?.rol !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Solo el administrador puede cambiar PINs' }),
      { status: 403, headers: CORS }
    )
  }

  const { user_id, pin } = await req.json()

  if (!user_id || !pin) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos obligatorios' }),
      { status: 400, headers: CORS }
    )
  }

  // Hashear el PIN con bcrypt y actualizar directamente en auth.users
  // (evita la política de contraseñas de Supabase que rechaza < 6 chars)
  const hash = await bcrypt.hash(pin)

  const { error } = await supabaseAdmin.rpc('update_user_password', {
    p_user_id: user_id,
    p_hash: hash,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: CORS })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS })
})
