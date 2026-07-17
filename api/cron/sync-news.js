import { syncGNewsToSupabase } from '../_lib/newsCacheService.js'

const ALLOWED_SCHEDULES = new Set(['0 11 * * *', '0 21 * * *'])

function isAuthorizedCronRequest(request) {
  const configuredSecret = String(process.env.CRON_SECRET || '').trim()
  const authorization = String(request.headers.authorization || '')
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  if (configuredSecret && bearer && bearer === configuredSecret) return true

  const userAgent = String(request.headers['user-agent'] || '')
  const schedule = String(request.headers['x-vercel-cron-schedule'] || '')

  return userAgent.includes('vercel-cron/1.0') && ALLOWED_SCHEDULES.has(schedule)
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  if (!isAuthorizedCronRequest(request)) {
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
