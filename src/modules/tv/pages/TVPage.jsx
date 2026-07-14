import { useCallback, useMemo, useRef, useState } from 'react'
import { Maximize2, RadioTower, SearchX, Tv } from 'lucide-react'
import { Alert, Badge } from '../../../design-system'
import {
  TVChannelCard,
  TVEmptyState,
  TVLoading,
  TVPlayer,
  TVSearch,
  TVSection,
} from '../components'
import {
  useTVCategories,
  useTVChannels,
  useTVFeatured,
} from '../hooks'
import { TVProvider } from '../providers'
import './tvPlatform.css'

function TVPlatformContent() {
  const [activeChannel, setActiveChannel] = useState(null)
  const playerRef = useRef(null)
  const categories = useTVCategories()
  const channels = useTVChannels()
  const featured = useTVFeatured()

  const visibleChannels = channels.data
  const channelCount = channels.count || visibleChannels.length
  const fallbackChannel = useMemo(
    () => featured.data.find((item) => item?.channel)?.channel || visibleChannels[0] || null,
    [featured.data, visibleChannels],
  )
  const selectedChannel = activeChannel || fallbackChannel
  const activeCategoryName = selectedChannel?.category?.name || selectedChannel?.language || 'Ao vivo'

  const emptyCopy = useMemo(() => {
    if (channels.filters.search) {
      return {
        icon: <SearchX size={32} />,
        title: 'Nenhum canal encontrado',
        description: 'Tente outro termo ou remova os filtros da pesquisa.',
      }
    }
    return {
      icon: <RadioTower size={32} />,
      title: 'Catalogo em preparacao',
      description: 'Nenhum canal foi publicado ainda.',
    }
  }, [channels.filters.search])

  const selectChannel = useCallback((channel) => {
    setActiveChannel(channel)
    window.requestAnimationFrame(() => {
      const player = playerRef.current
      if (!player) return
      const rect = player.getBoundingClientRect()
      const outsideViewport = rect.top < 0 || rect.bottom > window.innerHeight
      if (outsideViewport) {
        player.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }, [])

  const openFullscreen = useCallback(async () => {
    const player = playerRef.current
    if (!player || !player.requestFullscreen) return
    try {
      await player.requestFullscreen()
    } catch (error) {
      console.warn('[TVPage] Nao foi possivel abrir tela cheia.', error)
    }
  }, [])

  return (
    <main className="tv-platform">
      <header className="tv-platform__header">
        <div className="tv-platform__brand">
          <span><Tv size={20} aria-hidden="true" /></span>
          <h1>TV DO BAR</h1>
        </div>
        <Badge>{channelCount} CANAIS</Badge>
      </header>

      {channels.error && (
        <Alert status="warning" title="TV temporariamente indisponivel">
          A pagina continua acessivel enquanto a conexao com o catalogo e restabelecida.
        </Alert>
      )}

      <section className="tv-platform__player-section" ref={playerRef}>
        <TVPlayer
          embed_url={selectedChannel?.embedUrl}
          title={selectedChannel?.name}
          poster={selectedChannel?.logo}
          provider={selectedChannel?.provider}
        />
        <div className="tv-platform__nowbar">
          <div>
            <span>Canal atual</span>
            <strong>{selectedChannel?.name || 'Selecione um canal'}</strong>
            {selectedChannel && <small>{activeCategoryName}</small>}
          </div>
          <button type="button" onClick={openFullscreen}>
            <Maximize2 size={16} aria-hidden="true" />
            Tela cheia
          </button>
        </div>
      </section>

      <section className="tv-platform__controls" aria-label="Filtros da TV">
        <TVSearch value={channels.filters.search} onChange={channels.setSearch} />
        <div className="tv-platform__categories" aria-label="Categorias">
          <button
            type="button"
            className={!channels.filters.categoryId ? 'is-active' : ''}
            onClick={() => channels.setCategory('')}
          >
            Todos
          </button>
          {categories.data.map((category) => (
            <button
              key={category.id}
              type="button"
              className={channels.filters.categoryId === category.id ? 'is-active' : ''}
              onClick={() => channels.setCategory(channels.filters.categoryId === category.id ? '' : category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <TVSection
        title="Canais"
        action={<Badge>{visibleChannels.length} EXIBIDOS</Badge>}
      >
        {channels.loading || categories.loading ? (
          <TVLoading count={8} />
        ) : visibleChannels.length ? (
          <div className="tv-platform__channels">
            {visibleChannels.map((channel) => (
              <TVChannelCard
                key={channel.id}
                channel={channel}
                active={selectedChannel?.id === channel.id}
                onSelect={selectChannel}
              />
            ))}
          </div>
        ) : (
          <TVEmptyState {...emptyCopy} />
        )}
      </TVSection>
    </main>
  )
}

export default function TVPage() {
  return (
    <TVProvider>
      <TVPlatformContent />
    </TVProvider>
  )
}
