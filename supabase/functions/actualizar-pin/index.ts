import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      JSON.stringify({ error: 'Solo el administrador puede cambiar PINs' }),
      { status: 403, headers: CORS }
    )
  }

  // ── Procesar request ───────────────────────────────────────────────────
  const { user_id, pin } = await req.json()

  if (!user_id || !pin) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos obligatorios' }),
      { status: 400, headers: CORS }
    )
  }

  const { error } = await supabase.auth.admin.updateUserById(user_id, { password: pin })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: CORS })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS })
})
