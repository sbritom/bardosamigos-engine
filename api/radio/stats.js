const ICECAST_STATS_URL =
  'https://s01.svrdedicado.org:7956/status-json.xsl'

const RADIO_STREAM_URL =
  'https://s01.svrdedicado.org:7956/stream'

const REQUEST_TIMEOUT_MS = 8000

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, */*',
        'User-Agent': 'IMORTAL0800/1.0',
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeSources(source) {
  if (Array.isArray(source)) return source
  if (source && typeof source === 'object') return [source]
  return []
}

function pickRadioSource(payload) {
  const sources = normalizeSources(payload?.icestats?.source)

  return sources.find((source) => {
    const listenUrl = String(source?.listenurl || '').toLowerCase()
    return listenUrl.includes(':7956/stream') || listenUrl.endsWith('/stream')
  }) || sources[0] || null
}

async function getIcecastStats() {
  const response = await fetchWithTimeout(ICECAST_STATS_URL)

  if (!response.ok) {
    throw new Error(`Icecast stats returned HTTP ${response.status}`)
  }

  const payload = await response.json()
  const source = pickRadioSource(payload)

  if (!source) {
    return {
      online: false,
      songTitle: 'Programação ao vivo',
      listeners: 0,
      peakListeners: 0,
      bitrate: 0,
      sampleRate: 0,
      contentType: '',
      serverTitle: 'IMORTAL0800',
      streamUrl: RADIO_STREAM_URL,
      cover: '',
      protocol: 'Icecast',
      updatedAt: new Date().toISOString(),
      source: 'icecast-empty',
    }
  }

  return {
    online: true,
    songTitle: source.title || 'Programação ao vivo',
    listeners: Number(source.listeners) || 0,
    peakListeners: Number(source.listener_peak) || 0,
    bitrate: Number(source.bitrate) || 0,
    sampleRate: Number(source.samplerate) || 0,
    contentType: source.server_type || '',
    serverTitle: source.server_name || 'IMORTAL0800',
    streamUrl: RADIO_STREAM_URL,
    cover: '',
    protocol: 'Icecast',
    updatedAt: new Date().toISOString(),
    source: 'icecast-json',
  }
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.status(204).end()
    return
  }

  if (request.method !== 'GET') {
    response.status(405).json({
      ok: false,
      error: 'Method not allowed',
    })
    return
  }

  try {
    const data = await getIcecastStats()

    response.setHeader(
      'Cache-Control',
      's-maxage=10, stale-while-revalidate=20'
    )

    response.status(200).json({
      ok: true,
      data,
    })
  } catch (error) {
    console.error('Radio stats unavailable:', error)

    response.status(502).json({
      ok: false,
      error: 'Não foi possível obter os dados da rádio.',
    })
  }
}
