import { createClient } from '@supabase/supabase-js'

const REQUEST_TIMEOUT_MS = 8000
const PROVIDER_INTEGRATION_ID = 'imortal0800-primary'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server credentials are not configured.')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'IMORTAL0800/1.0',
        ...(options.headers || {}),
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, dec) => {
      const code = Number.parseInt(hex || dec, hex ? 16 : 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ' '
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1800)
}

function safeValue(value) {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 300)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return `[array:${value.length}]`
  return '[object]'
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: integration, error } = await supabase
      .from('radio_provider_integrations')
      .select('json_url,manual_request_url,enabled')
      .eq('id', PROVIDER_INTEGRATION_ID)
      .maybeSingle()

    if (error) throw error
    if (!integration?.enabled || !integration?.json_url) {
      throw new Error('Radio provider integration is unavailable.')
    }

    const providerResponse = await fetchWithTimeout(integration.json_url, {
      headers: { Accept: 'application/json, */*' },
    })
    if (!providerResponse.ok) throw new Error(`Provider HTTP ${providerResponse.status}`)

    const payload = await providerResponse.json()
    const providerFields = Object.keys(payload || {}).sort()
    const providerValues = Object.fromEntries(
      providerFields.map((key) => [key, safeValue(payload?.[key])]),
    )

    let requestPage = null
    if (integration.manual_request_url) {
      try {
        const manualResponse = await fetchWithTimeout(integration.manual_request_url, {
          headers: { Accept: 'text/html, text/plain, */*' },
        })
        requestPage = {
          status: manualResponse.status,
          text: stripHtml(await manualResponse.text()),
        }
      } catch (manualError) {
        requestPage = { error: String(manualError?.message || manualError).slice(0, 200) }
      }
    }

    response.setHeader('Cache-Control', 'no-store')
    response.status(200).json({
      ok: true,
      data: {
        providerFields,
        providerValues,
        requestPage,
        checkedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    response.status(502).json({
      ok: false,
      error: String(error?.message || error).slice(0, 240),
    })
  }
}
