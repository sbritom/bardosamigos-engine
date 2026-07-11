import { normalizeTVEmbedUrl, TV_EMBED_IFRAME_POLICY } from '../utils'

const providers = new Map()

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

registerTVEmbedProvider('iframe', ({ embedUrl, title }) => {
  const normalized = normalizeTVEmbedUrl(embedUrl)
  if (!normalized.valid) return null
  return (
    <iframe
      src={normalized.url}
      title={title}
      allow={TV_EMBED_IFRAME_POLICY.allow}
      allowFullScreen
      loading="lazy"
      referrerPolicy={TV_EMBED_IFRAME_POLICY.referrerPolicy}
      sandbox={TV_EMBED_IFRAME_POLICY.sandbox}
    />
  )
})
