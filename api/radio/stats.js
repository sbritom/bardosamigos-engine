import { createClient } from '@supabase/supabase-js'

const ICECAST_STATS_URL =
  'https://s01.svrdedicado.org:7956/status-json.xsl'

const RADIO_STREAM_URL =
  'https://s01.svrdedicado.org:7956/stream'

const REQUEST_TIMEOUT_MS = 8000
const ARTWORK_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const artworkCache = new Map()

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function getProviderIntegration() {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('radio_provider_integrations')
    .select('provider,json_url,xml_url,enabled')
    .eq('id', 'imortal0800-primary')
    .maybeSingle()

  if (error || !data?.enabled || !data?.json_url) return null
  return data
}

function parseNumber(value) {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^0-9-]/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeProviderCover(value) {
  if (typeof value === 'string') return value.trim()
  if (!value || typeof value !== 'object') return ''

  const candidates = [
    value.url,
    value.src,
    value.image,
    value.capa,
    value.cover,
    value.large,
    value.medium,
    value.small,
  ]

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim())?.trim() || ''
}

function isProviderOnline(status) {
  const normalized = String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

  return ['ligado', 'online', 'on', 'ativo', 'active'].includes(normalized)
}

async function getOfficialProviderStats() {
  const integration = await getProviderIntegration()
  if (!integration) {
    throw new Error('VOX API integration is not configured.')
  }

  const response = await fetchWithTimeout(integration.json_url)
  if (!response.ok) {
    throw new Error(`VOX API returned HTTP ${response.status}`)
  }

  const payload = await response.json()
  const songTitle = String(payload?.musica_atual || '').trim() || 'Programação ao vivo'
  const providerCover = normalizeProviderCover(payload?.capa_musica)
  const cover = providerCover || await getTrackArtwork(songTitle)

  return {
    online: isProviderOnline(payload?.status),
    statusLabel: String(payload?.status || '').trim(),
    songTitle,
    listeners: parseNumber(payload?.ouvintes_conectados),
    listenerLimit: parseNumber(payload?.plano_ouvintes),
    peakListeners: 0,
    bitrate: parseNumber(payload?.plano_bitrate),
    bitrateLabel: String(payload?.plano_bitrate || '').trim(),
    sampleRate: 0,
    contentType: '',
    serverTitle: String(payload?.titulo || '').trim() || 'IMORTAL0800',
    streamUrl: RADIO_STREAM_URL,
    cover,
    genre: String(payload?.genero || '').trim(),
    serverIp: String(payload?.ip || '').trim(),
    port: parseNumber(payload?.porta),
    djPort: parseNumber(payload?.porta_dj),
    ftpPlan: String(payload?.plano_ftp || '').trim(),
    shoutcastUrl: String(payload?.shoutcast || '').trim(),
    protocol: 'VOX API',
    provider: integration.provider || 'vox-svrdedicado',
    updatedAt: new Date().toISOString(),
    source: providerCover
      ? 'vox-api-json+provider-artwork'
      : cover
        ? 'vox-api-json+itunes-artwork'
        : 'vox-api-json',
  }
}

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


function normalizeSongQuery(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-–—|]+|[-–—|]+\s*$/g, '')
    .trim()
}

function upscaleArtworkUrl(url) {
  return String(url || '')
    .replace(/\/100x100bb\.(jpg|png)$/i, '/600x600bb.$1')
    .replace(/\/100x100bb$/i, '/600x600bb')
}

async function getTrackArtwork(songTitle) {
  const query = normalizeSongQuery(songTitle)
  if (!query || /^(programação ao vivo|imortal0800)$/i.test(query)) return ''

  const cached = artworkCache.get(query.toLowerCase())
  if (cached && Date.now() - cached.createdAt < ARTWORK_CACHE_TTL_MS) {
    return cached.url
  }

  try {
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', query)
    url.searchParams.set('entity', 'song')
    url.searchParams.set('limit', '1')
    url.searchParams.set('country', 'BR')

    const response = await fetchWithTimeout(url.toString())
    if (!response.ok) return ''

    const payload = await response.json()
    const artwork = upscaleArtworkUrl(payload?.results?.[0]?.artworkUrl100 || '')

    artworkCache.set(query.toLowerCase(), {
      url: artwork,
      createdAt: Date.now(),
    })

    return artwork
  } catch {
    return ''
  }
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

  const songTitle = source.title || 'Programação ao vivo'
  const cover = await getTrackArtwork(songTitle)

  return {
    online: true,
    songTitle,
    listeners: Number(source.listeners) || 0,
    peakListeners: Number(source.listener_peak) || 0,
    bitrate: Number(source.bitrate) || 0,
    sampleRate: Number(source.samplerate) || 0,
    contentType: source.server_type || '',
    serverTitle: source.server_name || 'IMORTAL0800',
    streamUrl: RADIO_STREAM_URL,
    cover,
    protocol: 'Icecast',
    updatedAt: new Date().toISOString(),
    source: cover ? 'icecast-json+itunes-artwork' : 'icecast-json',
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
    let providerError = null

    try {
      data = await getOfficialProviderStats()
    } catch (error) {
      providerError = error
      console.warn('VOX API unavailable, using Icecast fallback:', error?.message || error)
      data = await getIcecastStats()
    }

    response.setHeader(
      'Cache-Control',
      's-maxage=10, stale-while-revalidate=20'
    )

    response.status(200).json({
      ok: true,
      data: {
        ...data,
        fallbackActive: Boolean(providerError),
      },
    })
  } catch (error) {
    console.error('Radio stats unavailable:', error)

    response.status(502).json({
      ok: false,
      error: 'Não foi possível obter os dados da rádio.',
    })
  }
}
