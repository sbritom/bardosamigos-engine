import { HOME_TV_CHANNELS } from '../../../apps/portal/home/data/homeTvChannels.js'
import { slugifyTVValue } from '../utils/slugifyTVValue.js'

const CATEGORY_LABELS = {
  todos: 'Todos',
  esportes: 'Esportes',
  'filmes-e-series': 'Filmes e Series',
  'tv-aberta': 'TV Aberta',
  variedades: 'Variedades',
  noticias: 'Noticias',
  infantil: 'Infantil',
  especiais: 'Especiais',
}

const TEXT_REPLACEMENTS = [
  ['SÃ©ries', 'Series'],
  ['NotÃ­cias', 'Noticias'],
  ['PatrÃ£o', 'Patrao'],
  ['SÃ©rie', 'Serie'],
]

function cleanText(value) {
  return TEXT_REPLACEMENTS.reduce(
    (text, [search, replacement]) => text.replaceAll(search, replacement),
    String(value || '').trim(),
  )
}

function normalizeCategoryName(value) {
  const cleaned = cleanText(value)
  return CATEGORY_LABELS[slugifyTVValue(cleaned)] || cleaned || 'TV'
}

function createCategoryMap(channels) {
  const map = new Map()
  channels.forEach((channel) => {
    const name = normalizeCategoryName(channel.category)
    const slug = slugifyTVValue(name)
    if (!map.has(slug)) {
      map.set(slug, {
        id: `local-${slug}`,
        name,
        slug,
        description: `Canais de ${name} da TV Bar dos Amigos.`,
        icon: '',
        color: '#38bdf8',
        displayOrder: map.size,
        enabled: true,
      })
    }
  })
  return map
}

export function getNormalizedLocalTVChannels() {
  const seen = new Set()
  const duplicates = []
  const channels = []

  HOME_TV_CHANNELS.forEach((channel, index) => {
    const name = cleanText(channel.name)
    const category = normalizeCategoryName(channel.category)
    const src = String(channel.src || '').trim()
    const slug = slugifyTVValue(channel.id || name)
    const duplicateKey = src || slug

    if (seen.has(duplicateKey)) {
      duplicates.push({ id: channel.id, name, src })
      return
    }

    seen.add(duplicateKey)
    channels.push({
      id: slug,
      name,
      category,
      src,
      displayOrder: index,
    })
  })

  return { channels, duplicates }
}

export function getLocalTVHomeCatalog() {
  const { channels, duplicates } = getNormalizedLocalTVChannels()
  const categories = [
    'Todos',
    ...Array.from(new Set(channels.map((channel) => channel.category))),
  ]

  return {
    channels,
    categories,
    duplicates,
    source: 'local-fallback',
  }
}

export function getLocalTVPlatformCatalog() {
  const { channels, duplicates } = getNormalizedLocalTVChannels()
  const categoryMap = createCategoryMap(channels)
  const platformChannels = channels.map((channel) => {
    const category = categoryMap.get(slugifyTVValue(channel.category))
    return {
      id: `local-${channel.id}`,
      name: channel.name,
      slug: channel.id,
      description: null,
      categoryId: category.id,
      category,
      logo: null,
      provider: 'embed-canais-tv',
      embedUrl: channel.src,
      country: 'BR',
      language: 'pt-BR',
      featured: false,
      verified: true,
      enabled: true,
      displayOrder: channel.displayOrder,
      views: 0,
    }
  })

  return {
    categories: Array.from(categoryMap.values()),
    channels: platformChannels,
    duplicates,
    source: 'local-fallback',
  }
}
