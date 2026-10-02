import { createClient } from '@supabase/supabase-js'

const ALLOWED_SCOPES = new Set(['general', 'competition', 'season'])

function getSupabaseAdmin() {
  const url = String(process.env.SUPABASE_URL || '').trim()
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (!url || !key) {
    throw Object.assign(new Error('Supabase server credentials are not configured.'), { status: 503 })
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const scope = String(request.query?.scope || 'general').trim().toLowerCase()
  if (!ALLOWED_SCOPES.has(scope)) {
    response.status(400).json({ ok: false, error: 'Escopo de ranking inválido.' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('imortal_get_latest_prediction_ranking', {
      p_scope: scope,
    })

    if (error) throw error

    response.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    response.status(200).json({ ok: true, data: data || null })
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store')
    response.status(Number(error?.status) || 502).json({
      ok: false,
      data: null,
      error: error?.message || 'Não foi possível carregar o ranking.',
    })
  }
}
