import crypto from 'node:crypto'

const DEFAULT_OFFICIAL_ORIGINS = [
  'https://imortal0800.vercel.app',
  'https://imortal0800.com',
  'https://www.imortal0800.com',
]

const LOCAL_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/

function normalizeOrigin(value) {
  const candidate = String(value || '').trim()
  if (!candidate) return ''

  try {
    const url = new URL(candidate.includes('://') ? candidate : `https://${candidate}`)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.origin
  } catch {
    return ''
  }
}

function getConfiguredOfficialOrigins() {
  const configured = [
    process.env.PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VITE_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]

  return new Set(
    [...DEFAULT_OFFICIAL_ORIGINS, ...configured]
      .map(normalizeOrigin)
      .filter(Boolean),
  )
}

const OFFICIAL_ORIGINS = getConfiguredOfficialOrigins()

function getRequestOrigin(request) {
  const host = String(
    request.headers?.['x-forwarded-host']
      || request.headers?.host
      || ''
  ).trim()

  if (!host) return ''

  const forwardedProto = String(request.headers?.['x-forwarded-proto'] || '').trim()
  const proto = forwardedProto === 'http' ? 'http' : 'https'
  return normalizeOrigin(`${proto}://${host}`)
}

export function isTrustedOrigin(request) {
  const origin = normalizeOrigin(request.headers?.origin)
  if (!origin) return true
  if (OFFICIAL_ORIGINS.has(origin)) return true
  if (LOCAL_ORIGIN_RE.test(origin)) return true
  return origin === getRequestOrigin(request)
}

export function applyApiCors(
  request,
  response,
  {
    methods = 'GET, OPTIONS',
    headers = 'Content-Type, Authorization',
  } = {},
) {
  const origin = normalizeOrigin(request.headers?.origin)
  const trusted = isTrustedOrigin(request)

  response.setHeader('Access-Control-Allow-Methods', methods)
  response.setHeader('Access-Control-Allow-Headers', headers)
  response.setHeader('Vary', 'Origin')

  if (origin && trusted) {
    response.setHeader('Access-Control-Allow-Origin', origin)
  }

  return trusted
}

export function rejectOversizedBody(request, response, maxBytes = 16 * 1024) {
  const rawLength = String(request.headers?.['content-length'] || '').trim()
  if (!rawLength) return false

  const length = Number(rawLength)
  if (!Number.isFinite(length) || length < 0 || length <= maxBytes) return false

  response.status(413).json({
    ok: false,
    error: 'Payload muito grande.',
  })
  return true
}

export function getBearerToken(request) {
  const header = String(
    request.headers?.authorization
      || request.headers?.Authorization
      || ''
  )
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

export function timingSafeEqualText(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8')
  const b = Buffer.from(String(right || ''), 'utf8')
  if (!a.length || a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
