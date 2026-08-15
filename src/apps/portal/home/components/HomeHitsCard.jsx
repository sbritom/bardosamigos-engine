import { Music2 } from 'lucide-react'
import { FeatureCard } from '../../../../design-system'

const HIT_LIMIT = 5

const FALLBACK_HITS = [
  {
    id: 'fallback-dai-dai',
    position: 1,
    title: 'Dai Dai',
    artist: 'Shakira e Burna Boy',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Shakira+Dai+Dai+Burna+Boy',
  },
  {
    id: 'fallback-peao-todo-tatuado',
    position: 2,
    title: 'Peão Todo Tatuado',
    artist: 'Mariana Fagundes e Jeninho',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Peao+Todo+Tatuado+Mariana+Fagundes+Jeninho',
  },
  {
    id: 'fallback-carnivoro',
    position: 3,
    title: 'Carnívoro',
    artist: 'MC Jacaré, MC Negão Original, MC Lele JP e DJ Japa NK',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Carnivoro+MC+Jacare+MC+Negao+Original+MC+Lele+JP+DJ+Japa+NK',
  },
  {
    id: 'fallback-cuida-do-pet',
    position: 4,
    title: 'Cuida do Pet',
    artist: 'MC Willian, MC Iguinho CT, Oldilla e Aaron Modesto',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Cuida+do+Pet+MC+Willian+MC+Iguinho+CT+Oldilla+Aaron+Modesto',
  },
  {
    id: 'fallback-pau-pra-toda-obra',
    position: 5,
    title: 'Pau Pra Toda Obra',
    artist: 'MC IG, MC Jacaré, MC Lele JP e MC Ryan SP',
    youtubeUrl: 'https://www.youtube.com/results?search_query=Pau+Pra+Toda+Obra+MC+IG+MC+Jacare+MC+Lele+JP+MC+Ryan+SP',
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
        {hit.cover ? <img src={hit.cover} alt={`Capa de ${hit.title}`} loading="lazy" /> : <Music2 size={16} />}
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
  const safeHits = sourceHits.map(normalizeHit).slice(0, HIT_LIMIT)

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
