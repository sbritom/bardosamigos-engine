const MXCAST_OFFICIAL_STATS_URL =
  'https://api.mxcast.com.br/stream/7186/stats'

const MXCAST_FALLBACK_STATS_URL =
  'https://stm1.mxcast.com.br:7186/stats?sid=1'

const RADIO_STREAM_URL =
  'https://stm1.mxcast.com.br:7186/stream'

const REQUEST_TIMEOUT_MS = 8000

function decodeXml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function getXmlValue(xml, tagName) {
  const match = String(xml || '').match(
    new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  )

  return decodeXml(match?.[1]?.trim() || '')
}

async function fetchWithTimeout(url) {
  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, application/xml, text/xml, */*',
        'User-Agent': 'Radio-Bar-dos-Amigos/1.0',
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function getOfficialStats() {
  const response = await fetchWithTimeout(MXCAST_OFFICIAL_STATS_URL)

  if (!response.ok) {
    throw new Error(`MxCast official API returned HTTP ${response.status}`)
  }

  const data = await response.json()

  return {
    online: data.stream_status === 'on',
    songTitle: decodeXml(data.song_title) || 'Programação ao vivo',
    listeners: Number(data.listeners) || 0,
    peakListeners: Number(data.peak_listeners) || 0,
    bitrate: Number(data.bitrate) || 0,
    sampleRate: Number(data.samplerate) || 0,
    contentType: data.encoder || '',
    serverTitle: data.server_name || 'Radio Bar Dos Amigos',
    streamUrl: RADIO_STREAM_URL,
    cover: data.cover || '',
    protocol: data.protocol || '',
    updatedAt: new Date().toISOString(),
    source: 'mxcast-api',
  }
}

async function getFallbackStats() {
  const response = await fetchWithTimeout(MXCAST_FALLBACK_STATS_URL)

  if (!response.ok) {
    throw new Error(`MxCast fallback returned HTTP ${response.status}`)
  }

  const xml = await response.text()

  return {
    online: getXmlValue(xml, 'STREAMSTATUS') === '1',
    songTitle: getXmlValue(xml, 'SONGTITLE') || 'Programação ao vivo',
    listeners: Number(getXmlValue(xml, 'CURRENTLISTENERS')) || 0,
    peakListeners: Number(getXmlValue(xml, 'PEAKLISTENERS')) || 0,
    bitrate: Number(getXmlValue(xml, 'BITRATE')) || 0,
    sampleRate: Number(getXmlValue(xml, 'SAMPLERATE')) || 0,
    contentType: getXmlValue(xml, 'CONTENT') || '',
    serverTitle: getXmlValue(xml, 'SERVERTITLE') || 'Radio Bar Dos Amigos',
    streamUrl: RADIO_STREAM_URL,
    cover: '',
    protocol: 'Shoutcast',
    updatedAt: new Date().toISOString(),
    source: 'shoutcast-fallback',
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
    let data

    try {
      data = await getOfficialStats()
    } catch (officialError) {
      console.warn(
        'MxCast official API unavailable, using fallback:',
        officialError.message
      )

      data = await getFallbackStats()
    }

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
