import { getBearerToken, timingSafeEqualText } from '../_lib/security.js'
import { syncGNewsToSupabase } from '../_lib/newsCacheService.js'

function isAuthorizedCronRequest(request) {
  const configuredSecret = String(process.env.CRON_SECRET || '').trim()
  if (!configuredSecret) return { ok: false, configured: false }

  return {
    ok: timingSafeEqualText(getBearerToken(request), configuredSecret),
    configured: true,
  }
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  response.setHeader('Cache-Control', 'private, no-store, max-age=0')

  const cronAccess = isAuthorizedCronRequest(request)
  if (!cronAccess.configured) {
    response.status(503).json({ ok: false, error: 'Cron security is not configured.' })
    return
  }

  if (!cronAccess.ok) {
    response.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }

  try {
    const result = await syncGNewsToSupabase()
    response.status(result.ok ? 200 : 409).json(result)
  } catch (error) {
    response.status(500).json({
      ok: false,
      data: {
        fetched: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [{ message: error.message || 'News sync failed.' }],
      },
    })
  }
}
