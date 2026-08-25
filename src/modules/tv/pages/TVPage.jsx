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
import { isTVChannelAvailableInCountry, sortTVChannelsForCountry } from '../utils'
import './tvPlatform.css'
import './tvBlackGold.css'

function countryDisplayName(countryCode) {
  if (!countryCode) return ''
  try {
    return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(countryCode) || countryCode
  } catch {
    return countryCode
  }
}

function TVPlatformContent() {
  const { user, isAuthenticated, openAuth } = useAuth()
  const [activeChannel, setActiveChannel] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favoriteFeedback, setFavoriteFeedback] = useState('')
  const [viewerCountry, setViewerCountry] = useState('')
  const [geoResolved, setGeoResolved] = useState(false)
  const playerRef = useRef(null)
  const categories = useTVCategories()
  const channels = useTVChannels()
  const featured = useTVFeatured()

  useEffect(() => {
    let active = true

    fetch('/api/geo', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active) return
        setViewerCountry(String(payload?.country || '').toUpperCase())
      })
      .catch(() => {
        if (active) setViewerCountry('')
      })
      .finally(() => {
        if (active) setGeoResolved(true)
      })

    return () => {
      active = false
    }
  }, [])

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

  const availableChannels = useMemo(
    () => channels.data.filter((channel) => isTVChannelAvailableInCountry(channel, viewerCountry)),
    [channels.data, viewerCountry],
  )

  const visibleChannels = useMemo(() => {
    const base = favoritesOnly
      ? channels.data.filter((channel) => favoriteIds.has(channel.id))
      : channels.data
    return sortTVChannelsForCountry(base, viewerCountry)
  }, [channels.data, favoriteIds, favoritesOnly, viewerCountry])

  const channelCount = channels.count || channels.data.length
  const fallbackChannel = useMemo(() => {
    const availableFeatured = featured.data.find((item) => (
      item?.channel && isTVChannelAvailableInCountry(item.channel, viewerCountry)
    ))?.channel
    return availableFeatured || availableChannels[0] || channels.data[0] || null
  }, [availableChannels, channels.data, featured.data, viewerCountry])

  const selectedChannel = activeChannel || fallbackChannel
  const selectedAvailable = selectedChannel
    ? isTVChannelAvailableInCountry(selectedChannel, viewerCountry)
    : false
  const activeCategoryName = selectedChannel?.category?.name || selectedChannel?.language || 'Ao vivo'
  const catalogError = channels.error || categories.error || featured.error
  const catalogLoading = channels.loading || categories.loading || featured.loading
  const outsideBrazil = Boolean(geoResolved && viewerCountry && viewerCountry !== 'BR')
  const viewerCountryName = useMemo(() => countryDisplayName(viewerCountry), [viewerCountry])

  const emptyCopy = useMemo(() => {
    if (favoritesOnly) {
      return {
        icon: <Star size={32} aria-hidden="true" />,
        title: 'Nenhum canal favorito',
        description: 'Toque na estrela de um canal para encontra-lo aqui depois.',
      }
    }
    if (channels.filters.search) {
      return {
        icon: <SearchX size={32} aria-hidden="true" />,
        title: 'Nenhum canal encontrado',
        description: 'Tente outro termo ou remova os filtros da pesquisa.',
      }
    }
    return {
      icon: <RadioTower size={32} aria-hidden="true" />,
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
    if (!geoResolved || !player || !player.requestFullscreen || !selectedAvailable) return
    try {
      await player.requestFullscreen()
    } catch (error) {
      console.warn('[TVPage] Nao foi possivel abrir tela cheia.', error)
    }
  }, [geoResolved, selectedAvailable])

  return (
    <main className="tv-platform" aria-busy={catalogLoading}>
      <header className="tv-platform__header">
        <div className="tv-platform__brand">
          <span><Tv size={20} aria-hidden="true" /></span>
          <h1>TV DO BAR</h1>
        </div>
        <Badge>{outsideBrazil ? `${availableChannels.length} DISPONIVEIS` : `${channelCount} CANAIS`}</Badge>
      </header>

      {!catalogLoading && catalogError ? (
        <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100" role="status" aria-live="polite">
          Nao foi possivel atualizar todo o catalogo agora. Os canais ja disponiveis continuam acessiveis.
        </p>
      ) : null}

      {outsideBrazil ? (
        <p className="mb-4 rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100" role="status">
          Acesso identificado em {viewerCountryName || viewerCountry}. As fontes brasileiras atuais reproduzem apenas no Brasil; canais marcados como Global continuam disponiveis normalmente.
        </p>
      ) : null}

      <section className="tv-platform__player-section" ref={playerRef}>
        <TVPlayer
          embed_url={selectedChannel?.embedUrl}
          title={selectedChannel?.name}
          poster={selectedChannel?.logo}
          provider={selectedChannel?.provider}
          blockedByRegion={Boolean(geoResolved && selectedChannel && !selectedAvailable)}
          regionCheckPending={!geoResolved}
          viewerCountry={viewerCountryName || viewerCountry}
        />
        <div className="tv-platform__nowbar">
          <div>
            <span>Canal atual</span>
            <strong>{selectedChannel?.name || 'Selecione um canal'}</strong>
            {selectedChannel && <small>{activeCategoryName}</small>}
          </div>
          <button
            type="button"
            onClick={openFullscreen}
            disabled={!geoResolved || !selectedChannel || !selectedAvailable}
            aria-label="Abrir player da TV em tela cheia"
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
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
            <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} aria-hidden="true" />
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
        {favoriteFeedback && (
          <small className="block text-sm font-semibold text-[var(--text-secondary)]" role="status" aria-live="polite">
            {favoriteFeedback}
          </small>
        )}
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
                unavailable={Boolean(viewerCountry && !isTVChannelAvailableInCountry(channel, viewerCountry))}
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
