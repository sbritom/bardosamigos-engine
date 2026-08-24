import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, RadioTower, SearchX, Star, Tv } from 'lucide-react'
import { Badge } from '../../../design-system'
import { useAuth } from '../../auth/AuthContext'
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
import { TVFavoriteService } from '../services/TVFavoriteService'
import './tvPlatform.css'
import './tvBlackGold.css'

function TVPlatformContent() {
  const { user, isAuthenticated, openAuth } = useAuth()
  const [activeChannel, setActiveChannel] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favoriteFeedback, setFavoriteFeedback] = useState('')
  const playerRef = useRef(null)
  const categories = useTVCategories()
  const channels = useTVChannels()
  const featured = useTVFeatured()

  useEffect(() => {
    let active = true

    if (!user?.id) {
      setFavoriteIds(new Set())
      setFavoritesOnly(false)
      setFavoriteFeedback('')
      return undefined
    }

    TVFavoriteService.list(user.id).then((result) => {
      if (!active) return
      if (result?.error) {
        setFavoriteFeedback('Nao foi possivel carregar seus canais favoritos agora.')
        return
      }

      const ids = (result?.data || [])
        .map((item) => item?.channel?.id || item?.channelId)
        .filter(Boolean)
      setFavoriteIds(new Set(ids))
      setFavoriteFeedback('')
    }).catch(() => {
      if (active) setFavoriteFeedback('Nao foi possivel carregar seus canais favoritos agora.')
    })

    return () => {
      active = false
    }
  }, [user?.id])

  const visibleChannels = useMemo(() => {
    if (!favoritesOnly) return channels.data
    return channels.data.filter((channel) => favoriteIds.has(channel.id))
  }, [channels.data, favoriteIds, favoritesOnly])

  const channelCount = channels.count || channels.data.length
  const fallbackChannel = useMemo(
    () => featured.data.find((item) => item?.channel)?.channel || channels.data[0] || null,
    [channels.data, featured.data],
  )
  const selectedChannel = activeChannel || fallbackChannel
  const activeCategoryName = selectedChannel?.category?.name || selectedChannel?.language || 'Ao vivo'

  const emptyCopy = useMemo(() => {
    if (favoritesOnly) {
      return {
        icon: <Star size={32} />,
        title: 'Nenhum canal favorito',
        description: 'Toque na estrela de um canal para encontra-lo aqui depois.',
      }
    }
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
  }, [channels.filters.search, favoritesOnly])

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

  const toggleFavorite = useCallback(async (channel) => {
    if (!isAuthenticated || !user?.id) {
      openAuth('Entre para salvar seus canais favoritos. Assistir TV continua livre para visitantes.', 'login')
      return
    }

    const isFavorite = favoriteIds.has(channel.id)
    setFavoriteFeedback('')

    try {
      const result = isFavorite
        ? await TVFavoriteService.remove(user.id, channel.id)
        : await TVFavoriteService.add(user.id, channel.id)

      if (result?.error) throw result.error

      setFavoriteIds((current) => {
        const next = new Set(current)
        if (isFavorite) next.delete(channel.id)
        else next.add(channel.id)
        return next
      })
      setFavoriteFeedback(isFavorite ? 'Canal removido dos favoritos.' : 'Canal salvo nos favoritos.')
    } catch (error) {
      setFavoriteFeedback(error?.message || 'Nao foi possivel atualizar seus favoritos.')
    }
  }, [favoriteIds, isAuthenticated, openAuth, user?.id])

  const toggleFavoritesOnly = useCallback(() => {
    if (!isAuthenticated) {
      openAuth('Entre para ver sua lista de canais favoritos.', 'login')
      return
    }
    setFavoritesOnly((current) => !current)
  }, [isAuthenticated, openAuth])

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
            className={!channels.filters.categoryId && !favoritesOnly ? 'is-active' : ''}
            onClick={() => {
              setFavoritesOnly(false)
              channels.setCategory('')
            }}
          >
            Todos
          </button>
          <button
            type="button"
            className={favoritesOnly ? 'is-active' : ''}
            onClick={toggleFavoritesOnly}
          >
            <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
            Favoritos
          </button>
          {categories.data.map((category) => (
            <button
              key={category.id}
              type="button"
              className={!favoritesOnly && channels.filters.categoryId === category.id ? 'is-active' : ''}
              onClick={() => {
                setFavoritesOnly(false)
                channels.setCategory(channels.filters.categoryId === category.id ? '' : category.id)
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
        {favoriteFeedback && <small className="block text-sm font-semibold text-[var(--text-secondary)]">{favoriteFeedback}</small>}
      </section>

      <TVSection
        title={favoritesOnly ? 'Meus favoritos' : 'Canais'}
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
                favorite={favoriteIds.has(channel.id)}
                onSelect={selectChannel}
                onToggleFavorite={toggleFavorite}
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
