import { Music2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FeatureCard } from '../../../../design-system'

const HIT_LIMIT = 5
const ITUNES_SEARCH_ENDPOINT = 'https://itunes.apple.com/search'

const FALLBACK_HITS = [
  {
    id: 'fallback-jetski',
    position: 1,
    title: 'JETSKI',
    artist: 'PEDRO SAMPAIO, Melody e MC MENO K',
    youtubeUrl: 'https://www.youtube.com/results?search_query=JETSKI+PEDRO+SAMPAIO+Melody+MC+MENO+K',
  },
  {
    id: 'fallback-sequencia-feiticeira',
    position: 2,
    title: 'SEQUÊNCIA FEITICEIRA',
    artist: 'PEDRO SAMPAIO, MC GW, Mc Jhey e MC Rodrigo do CN',
    youtubeUrl: 'https://www.youtube.com/results?search_query=SEQUENCIA+FEITICEIRA+PEDRO+SAMPAIO',
  },
  {
    id: 'fallback-p-do-pecado',
    position: 3,
    title: 'P do Pecado (Ao Vivo)',
    artist: 'Grupo Menos É Mais e Simone Mendes',
    youtubeUrl: 'https://www.youtube.com/results?search_query=P+do+Pecado+Grupo+Menos+E+Mais+Simone+Mendes',
  },
  {
    id: 'fallback-eu-me-apaixonei',
    position: 4,
    title: 'Eu Me Apaixonei',
    artist: 'Vitinho Imperador',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Eu+Me+Apaixonei+Vitinho+Imperador',
  },
  {
    id: 'fallback-carnivoro',
    position: 5,
    title: 'Carnívoro',
    artist: 'MC Jacaré, MC Negão Original, MC Lele JP e DJ Japa NK',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Carnivoro+MC+Jacare+MC+Negao+Original+MC+Lele+JP+DJ+Japa+NK',
  },
]

function getHitCover(track = {}) {
  return track.cover || track.albumCover || track.album_cover || track.thumbnail || track.image || ''
}

function getHitArtist(track = {}) {
  return track.artist || track.artistName || track.artist_name || track.channelTitle || track.channel || 'Artista indisponivel'
}

function getHitUrl(track = {}) {
  return track.spotifyUrl || track.spotify_url || track.youtubeUrl || track.youtube_url || track.url || track.link || ''
}

function getHitDuration(track = {}) {
  return track.duration || track.durationLabel || track.duration_label || track.metadata?.duration || ''
}

function getPositionLabel(position) {
  if (position === 1) return '🥇 #1'
  if (position === 2) return '🥈 #2'
  if (position === 3) return '🥉 #3'
  return `${position}°`
}

function normalizeHit(track = {}, index = 0) {
  const position = Number(track.position || index + 1)
  const title = track.title || track.name || track.songTitle || track.song_title || 'Hit indisponivel'

  return {
    id: track.id || track.slug || `${position}-${title}`,
    artist: getHitArtist(track),
    cover: getHitCover(track),
    duration: getHitDuration(track),
    link: getHitUrl(track),
    position,
    title,
  }
}

function upgradeArtwork(url = '') {
  if (!url) return ''
  return url.replace(/100x100bb\.(jpg|png)$/i, '300x300bb.$1')
}

async function findArtworkForHit(hit, signal) {
  if (hit.cover) return hit.cover

  const term = `${hit.title} ${hit.artist}`.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
  const params = new URLSearchParams({
    term,
    media: 'music',
    entity: 'song',
    country: 'BR',
    limit: '5',
  })

  try {
    const response = await fetch(`${ITUNES_SEARCH_ENDPOINT}?${params.toString()}`, { signal })
    if (!response.ok) return ''

    const payload = await response.json()
    const results = Array.isArray(payload?.results) ? payload.results : []
    const normalizedTitle = hit.title.toLocaleLowerCase('pt-BR').replace(/\s*\(.*?\)\s*/g, '').trim()

    const closest = results.find((item) => {
      const trackName = String(item.trackName || '').toLocaleLowerCase('pt-BR')
      return normalizedTitle && (trackName.includes(normalizedTitle) || normalizedTitle.includes(trackName))
    }) || results[0]

    return upgradeArtwork(closest?.artworkUrl100 || closest?.artworkUrl60 || '')
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.warn('[HomeHitsCard] Nao foi possivel carregar capa real.', hit.title, error)
    }
    return ''
  }
}

function HomeHitsState({ type }) {
  const stateText = {
    empty: 'Nenhum hit disponivel no momento.',
    error: 'Nao foi possivel carregar os hits agora.',
    loading: 'Carregando hits do momento...',
  }

  return (
    <div className={`bds-home-hits-state bds-home-hits-state--${type}`}>
      {stateText[type] || stateText.empty}
    </div>
  )
}

function HomeHitItem({ hit }) {
  const content = (
    <>
      <span className="bds-home-hits-position">{getPositionLabel(hit.position)}</span>
      <span className="bds-home-hits-cover" aria-hidden="true">
        {hit.cover ? <img src={hit.cover} alt="" loading="lazy" /> : <Music2 size={16} />}
      </span>
      <span className="bds-home-hits-track">
        <strong>{hit.title}</strong>
        <span>{hit.artist}</span>
      </span>
      {hit.duration ? <span className="bds-home-hits-duration">{hit.duration}</span> : null}
    </>
  )

  if (hit.link) {
    return (
      <a className="bds-home-hits-item" href={hit.link} target="_blank" rel="noreferrer" aria-label={`Abrir ${hit.title} de ${hit.artist}`}>
        {content}
      </a>
    )
  }

  return <div className="bds-home-hits-item">{content}</div>
}

export function HomeHitsCard({ hits = [], loading = false, error = null }) {
  const sourceHits = Array.isArray(hits) && hits.length ? hits : FALLBACK_HITS
  const normalizedHits = useMemo(() => sourceHits.map(normalizeHit).slice(0, HIT_LIMIT), [sourceHits])
  const [artworkById, setArtworkById] = useState({})

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    async function hydrateArtwork() {
      const entries = await Promise.all(normalizedHits.map(async (hit) => {
        const artwork = await findArtworkForHit(hit, controller.signal)
        return [hit.id, artwork]
      }))

      if (active) {
        setArtworkById(Object.fromEntries(entries.filter(([, artwork]) => Boolean(artwork))))
      }
    }

    hydrateArtwork()
    return () => {
      active = false
      controller.abort()
    }
  }, [normalizedHits])

  const safeHits = normalizedHits.map((hit) => ({
    ...hit,
    cover: hit.cover || artworkById[hit.id] || '',
  }))

  return (
    <FeatureCard
      className="bds-home-card-full bds-home-hits-card"
      title="📈 Hits do Momento"
      description="As musicas em alta no YouTube Brasil."
      icon={<Music2 size={20} />}
    >
      <div className="bds-home-hits-list" data-designer-id="radio.topSongs" data-designer-label="Hits do Momento / Lista">
        {loading ? <HomeHitsState type="loading" /> : null}
        {!loading && error && !safeHits.length ? <HomeHitsState type="error" /> : null}
        {!loading && safeHits.length ? safeHits.map((hit) => <HomeHitItem key={hit.id} hit={hit} />) : null}
        {!loading && !safeHits.length ? <HomeHitsState type="empty" /> : null}
      </div>
    </FeatureCard>
  )
}
