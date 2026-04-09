import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: CORS })
  }

  const { user_id, activo } = await req.json()

  if (!user_id || activo === undefined) {
    return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400, headers: CORS })
  }

  // Si se desactiva, revocar todas las sesiones activas
  if (!activo) {
    await supabaseAdmin.auth.admin.signOut(user_id, 'global')
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS })
})
