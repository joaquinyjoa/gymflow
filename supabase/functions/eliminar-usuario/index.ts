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

    const { user_id } = await req.json()
    if (!user_id) throw new Error('Falta user_id')

    // Eliminar de Auth — esto elimina en cascada users y clientes/entrenadores
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (error) throw new Error(error.message)

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})