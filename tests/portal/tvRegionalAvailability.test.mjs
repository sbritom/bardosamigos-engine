import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  TV_AVAILABILITY_SCOPE,
  getTVChannelAvailabilityScope,
  isTVChannelAvailableInCountry,
  sortTVChannelsForCountry,
} from '../../src/modules/tv/utils/tvAvailability.js'
import { normalizeOfficialTVHlsUrl } from '../../src/modules/tv/utils/tvHlsPolicy.js'

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('provedor brasileiro e sempre BR_ONLY', () => {
  const channel = {
    provider: 'embed-canais-tv',
    availabilityScope: 'GLOBAL',
  }

  assert.equal(getTVChannelAvailabilityScope(channel), TV_AVAILABILITY_SCOPE.BR_ONLY)
  assert.equal(isTVChannelAvailableInCountry(channel, 'BR'), true)
  assert.equal(isTVChannelAvailableInCountry(channel, 'PT'), false)
  assert.equal(isTVChannelAvailableInCountry(channel, 'US'), false)
})

test('canais GLOBAL continuam disponiveis fora do Brasil', () => {
  const channel = {
    provider: 'youtube-official',
    availabilityScope: 'GLOBAL',
  }

  assert.equal(isTVChannelAvailableInCountry(channel, 'BR'), true)
  assert.equal(isTVChannelAvailableInCountry(channel, 'PT'), true)
  assert.equal(isTVChannelAvailableInCountry(channel, 'US'), true)
})

test('COUNTRY_LIST respeita lista explicita de paises', () => {
  const channel = {
    provider: 'official',
    availabilityScope: 'COUNTRY_LIST',
    allowedCountries: ['BR', 'PT'],
  }

  assert.equal(isTVChannelAvailableInCountry(channel, 'PT'), true)
  assert.equal(isTVChannelAvailableInCountry(channel, 'US'), false)
})

test('fora do Brasil canais disponiveis sao priorizados no catalogo', () => {
  const brazilian = { id: 'br', provider: 'embed-canais-tv', availabilityScope: 'BR_ONLY' }
  const global = { id: 'global', provider: 'youtube-official', availabilityScope: 'GLOBAL' }

  assert.deepEqual(
    sortTVChannelsForCountry([brazilian, global], 'PT').map((channel) => channel.id),
    ['global', 'br'],
  )
})

test('migration marca catalogo legado como BR_ONLY e adiciona fontes globais oficiais', async () => {
  const sql = await source('supabase/migrations/20260825132718_add_tv_regional_availability_and_global_channels.sql')

  assert.match(sql, /where provider = 'embed-canais-tv'/i)
  assert.match(sql, /availability_scope = 'BR_ONLY'/i)
  assert.match(sql, /allowed_countries = array\['BR'\]/i)

  for (const slug of [
    'france24-english',
    'al-jazeera-english',
    'dw-news',
    'bloomberg-television',
    'euronews-english',
    'nasa-media',
  ]) {
    assert.ok(sql.includes(`'${slug}'`), `${slug} deve estar no catalogo global inicial`)
  }

  assert.match(sql, /youtube-nocookie\.com\/embed/i)
})

test('migration adiciona quatro canais infantis globais por live oficial de canal', async () => {
  const sql = await source('supabase/migrations/20260825135646_add_global_kids_tv_channels.sql')

  for (const slug of [
    'wb-kids-global',
    'babytv-global',
    'peppa-pig-global',
    'wildbrain-zoo-global',
  ]) {
    assert.ok(sql.includes(`'${slug}'`), `${slug} deve estar no catalogo infantil global`)
  }

  assert.match(sql, /where slug = 'infantil'/i)
  assert.match(sql, /availability_scope = 'GLOBAL'/i)
  assert.match(sql, /youtube-nocookie\.com\/embed\/live_stream\?channel=UC/i)
})

test('politica HLS aceita apenas playlists HTTPS de hosts oficiais aprovados', () => {
  const valid = normalizeOfficialTVHlsUrl('https://media-tyo.hls.nhkworld.jp/hls/w/live/master.m3u8')
  assert.equal(valid.valid, true)
  assert.equal(valid.host, 'media-tyo.hls.nhkworld.jp')

  assert.equal(normalizeOfficialTVHlsUrl('https://example.com/live.m3u8').valid, false)
  assert.equal(normalizeOfficialTVHlsUrl('http://media-tyo.hls.nhkworld.jp/live.m3u8').valid, false)
  assert.equal(normalizeOfficialTVHlsUrl('https://media-tyo.hls.nhkworld.jp/video.mp4').valid, false)
})

test('seed HLS prepara treze canais globais sem publica-los antes do player', async () => {
  const sql = await source('supabase/migrations/20260825142933_seed_global_hls_channels_disabled.sql')

  for (const slug of [
    'euronews-portugues-global',
    'artv-portugal-global',
    'canal-macau-global',
    'tvm-internacional-global',
    'tv-brics-portugues-global',
    'nhk-world-japan-global',
    'arirang-tv-global',
    'cgtn-global',
    'cgtn-documentary-global',
    'france24-espanol-global',
    'france24-francais-global',
    'telesur-global',
    'telesur-english-global',
  ]) {
    assert.ok(sql.includes(`'${slug}'`), `${slug} deve estar no seed HLS global`)
  }

  assert.match(sql, /'hls-official'/)
  assert.match(sql, /'GLOBAL'/)
  assert.match(sql, /false,\s*v\.display_order,\s*'GLOBAL'/s)
})

test('adaptadores oficiais validam YouTube e HLS antes de reproduzir', async () => {
  const provider = await source('src/modules/tv/providers/TVEmbedProviderRegistry.jsx')
  const hlsPlayer = await source('src/modules/tv/components/OfficialHlsPlayer.jsx')

  assert.match(provider, /YOUTUBE_VIDEO_ID/)
  assert.match(provider, /YOUTUBE_CHANNEL_ID/)
  assert.match(provider, /embedId === 'live_stream'/)
  assert.match(provider, /searchParams\.get\('channel'\)/)
  assert.match(provider, /OfficialHlsPlayer/)
  assert.doesNotMatch(provider, /ReactPlayer/)
  assert.match(provider, /registerTVEmbedProvider\('hls-official'/)
  assert.match(provider, /normalizeOfficialTVHlsUrl/)
  assert.match(hlsPlayer, /import\('hls\.js\/light'\)/)
  assert.match(hlsPlayer, /canPlayType\(NATIVE_HLS_TYPE\)/)
})

test('frontend consulta pais no Vercel, bloqueia por regiao e oferece filtro Global', async () => {
  const geoApi = await source('api/geo.js')
  const page = await source('src/modules/tv/pages/TVPage.jsx')
  const player = await source('src/modules/tv/components/TVPlayer.jsx')
  const channelService = await source('src/modules/tv/services/TVChannelService.js')

  assert.match(geoApi, /x-vercel-ip-country/i)
  assert.match(geoApi, /private, no-store/i)
  assert.doesNotMatch(geoApi, /x-forwarded-for|client-ip|remoteAddress/i)

  assert.match(page, /fetch\('\/api\/geo'/)
  assert.match(page, /regionCheckPending=\{!geoResolved\}/)
  assert.match(page, /blockedByRegion=/)
  assert.match(page, /sortTVChannelsForCountry/)
  assert.match(page, /globalOnly/)
  assert.match(page, />\s*Globais\s*</)
  assert.match(player, /!regionCheckPending && !blockedByRegion && embedUrl/)
  assert.match(player, /Verificando disponibilidade/)
  assert.match(channelService, /normalizeOfficialTVHlsUrl/)
  assert.match(channelService, /pageSize:\s*200/)
})
