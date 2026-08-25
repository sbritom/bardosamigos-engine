import { OfficialHlsPlayer } from '../components/OfficialHlsPlayer'
import {
  normalizeOfficialTVHlsUrl,
  normalizeTVEmbedUrl,
  TV_EMBED_IFRAME_POLICY,
} from '../utils'

const providers = new Map()
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const YOUTUBE_CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/

export function registerTVEmbedProvider(name, renderer) {
  if (!name || typeof renderer !== 'function') {
    throw new TypeError('TV embed providers require a name and renderer.')
  }
  providers.set(name, renderer)
  return () => providers.delete(name)
}

export function resolveTVEmbedProvider(name = 'iframe') {
  return providers.get(name) || providers.get('iframe')
}

export function listTVEmbedProviders() {
  return [...providers.keys()]
}

function iframeFor(url, title) {
  return (
    <iframe
      src={url}
      title={title}
      allow={TV_EMBED_IFRAME_POLICY.allow}
      allowFullScreen
      loading="lazy"
      referrerPolicy={TV_EMBED_IFRAME_POLICY.referrerPolicy}
      sandbox={TV_EMBED_IFRAME_POLICY.sandbox}
    />
  )
}

registerTVEmbedProvider('iframe', ({ embedUrl, title }) => {
  const normalized = normalizeTVEmbedUrl(embedUrl)
  if (!normalized.valid) return null
  return iframeFor(normalized.url, title)
})

registerTVEmbedProvider('youtube-official', ({ embedUrl, title }) => {
  let parsed
  try {
    parsed = new URL(String(embedUrl || ''))
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') return null
  if (parsed.hostname !== 'www.youtube-nocookie.com') return null
  if (!parsed.pathname.startsWith('/embed/')) return null

  const embedId = parsed.pathname.slice('/embed/'.length).split('/')[0]
  if (embedId === 'live_stream') {
    const channelId = parsed.searchParams.get('channel') || ''
    if (!YOUTUBE_CHANNEL_ID.test(channelId)) return null
  } else if (!YOUTUBE_VIDEO_ID.test(embedId)) {
    return null
  }

  parsed.hash = ''
  return iframeFor(parsed.toString(), title)
})

registerTVEmbedProvider('hls-official', ({ embedUrl, title }) => {
  const normalized = normalizeOfficialTVHlsUrl(embedUrl)
  if (!normalized.valid) return null
  return <OfficialHlsPlayer src={normalized.url} title={title} />
})
