const OFFICIAL_HLS_HOSTS = new Set([
  '6e52fb8b.wurl.com',
  'playout175.livextend.cloud',
  'globallive.tdm.com.mo',
  'stream.tvm.co.mz',
  'porbrics.mediacdn.ru',
  'media-tyo.hls.nhkworld.jp',
  'amdlive-ch01-g-ctnd-com.akamaized.net',
  'english-livetx.cgtn.com',
  'live.france24.com',
  'mblesmain01.telesur.ultrabase.net',
  'mblenmain01.telesur.ultrabase.net',
])

export function normalizeOfficialTVHlsUrl(input) {
  const value = String(input || '').trim()
  if (!value) return { valid: false, url: '', error: 'Informe a URL HLS.' }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return { valid: false, url: '', error: 'A URL HLS e invalida.' }
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, url: '', error: 'O stream HLS precisa usar HTTPS.' }
  }
  if (parsed.username || parsed.password) {
    return { valid: false, url: '', error: 'URLs HLS com credenciais nao sao permitidas.' }
  }
  if (!OFFICIAL_HLS_HOSTS.has(parsed.hostname.toLowerCase())) {
    return { valid: false, url: '', error: 'Este host HLS nao e uma fonte oficial aprovada.' }
  }
  if (!parsed.pathname.toLowerCase().endsWith('.m3u8')) {
    return { valid: false, url: '', error: 'A fonte oficial precisa apontar para uma playlist HLS .m3u8.' }
  }

  parsed.hash = ''
  return {
    valid: true,
    url: parsed.toString(),
    error: null,
    host: parsed.hostname.toLowerCase(),
  }
}

export function isOfficialTVHlsUrl(input) {
  return normalizeOfficialTVHlsUrl(input).valid
}

export function listOfficialTVHlsHosts() {
  return [...OFFICIAL_HLS_HOSTS]
}
