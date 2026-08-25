function normalizeCountry(value) {
  const country = String(value || '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(country) ? country : null
}

export default function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const country = normalizeCountry(request.headers?.['x-vercel-ip-country'])

  response.status(200).json({
    country,
    source: country ? 'vercel' : 'unknown',
  })
}
