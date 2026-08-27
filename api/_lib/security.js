import crypto from 'node:crypto'

const OFFICIAL_ORIGINS = new Set([
  'https://radiobardosamigos.com.br',
  'https://www.radiobardosamigos.com.br',
])

const LOCAL_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/

function getRequestOrigin(request) {
  const host = String(
    request.headers?.['x-forwarded-host']
      || request.headers?.host
      || ''
  ).trim()

  if (!host) return ''

  const forwardedProto = String(request.headers?.['x-forwarded-proto'] || '').trim()
  const proto = forwardedProto === 'http' ? 'http' : 'https'
  return `${proto}://${host}`
}

export function isTrustedOrigin(request) {
  const origin = String(request.headers?.origin || '').trim()
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
  const origin = String(request.headers?.origin || '').trim()
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
