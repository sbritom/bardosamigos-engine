const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'file:', 'vbscript:'])
const RAW_HTML_PATTERN = /<\s*\/?\s*(script|iframe|object|embed|html)|[<>]/i

function configuredHosts() {
  return String(import.meta.env.VITE_TV_EMBED_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
}

function hostAllowed(hostname, allowlist) {
  if (!allowlist.length) return true
  const normalized = hostname.toLowerCase()
  return allowlist.some((entry) => (
    entry.startsWith('*.')
      ? normalized === entry.slice(2) || normalized.endsWith(entry.slice(1))
      : normalized === entry
  ))
}

export const TV_EMBED_IFRAME_POLICY = Object.freeze({
  allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
  sandbox: 'allow-scripts allow-same-origin allow-presentation',
  referrerPolicy: 'strict-origin-when-cross-origin',
})

export function normalizeTVEmbedUrl(input) {
  const value = String(input || '').trim()
  if (!value) return { valid: false, url: '', error: 'Informe a URL do embed.' }
  if (RAW_HTML_PATTERN.test(value)) {
    return { valid: false, url: '', error: 'Informe apenas a URL, sem HTML ou scripts.' }
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return { valid: false, url: '', error: 'A URL informada e invalida.' }
  }

  if (BLOCKED_PROTOCOLS.has(parsed.protocol)) {
    return { valid: false, url: '', error: 'O protocolo informado nao e permitido.' }
  }
  const developmentHttp = import.meta.env.DEV
    && parsed.protocol === 'http:'
    && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !developmentHttp) {
    return { valid: false, url: '', error: 'Use uma URL HTTPS segura.' }
  }
  if (parsed.username || parsed.password) {
    return { valid: false, url: '', error: 'URLs com credenciais nao sao permitidas.' }
  }
  if (!hostAllowed(parsed.hostname, configuredHosts())) {
    return { valid: false, url: '', error: 'Este host nao esta na lista de provedores permitidos.' }
  }

  parsed.hash = ''
  return { valid: true, url: parsed.toString(), error: null, host: parsed.hostname }
}

export function isTVEmbedUrlAllowed(input) {
  return normalizeTVEmbedUrl(input).valid
}
