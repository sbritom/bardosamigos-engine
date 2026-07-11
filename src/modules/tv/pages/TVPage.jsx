import { useMemo, useState } from 'react'
import { Clock3, Heart, RadioTower, SearchX, Tv } from 'lucide-react'
import { Alert, Badge } from '../../../design-system'
import {
  TVCategoryCard,
  TVChannelCard,
  TVEmptyState,
  TVHero,
  TVLoading,
  TVPlayer,
  TVSearch,
  TVSection,
  TVSidebar,
} from '../components'
import {
  useTVCategories,
  useTVChannels,
  useTVFavorites,
  useTVFeatured,
  useTVRecent,
} from '../hooks'
import { TVProvider } from '../providers'
import './tvPlatform.css'

function TVPlatformContent() {
  const [activeChannel, setActiveChannel] = useState(null)
  const [view, setView] = useState('all')
  const categories = useTVCategories()
  const channels = useTVChannels()
  const featured = useTVFeatured()
  const favorites = useTVFavorites()
  const recent = useTVRecent()

  const visibleChannels = useMemo(() => {
    if (view === 'favorites') return favorites.data.map((item) => item.channel).filter(Boolean)
    if (view === 'recent') return recent.data.map((item) => item.channel).filter(Boolean)
    return channels.data
  }, [view, channels.data, favorites.data, recent.data])

  const emptyCopy = useMemo(() => {
    if (channels.filters.search) {
      return {
        icon: <SearchX size={32} />,
        title: 'Nenhum canal encontrado',
        description: 'Tente outro termo ou remova os filtros da pesquisa.',
      }
    }
    if (view === 'favorites') {
      return {
        icon: <Heart size={32} />,
        title: 'Seus favoritos aparecerao aqui',
        description: 'Entre na sua conta e favorite canais quando o catalogo estiver publicado.',
      }
    }
    if (view === 'recent') {
      return {
        icon: <Clock3 size={32} />,
        title: 'Nenhum canal assistido recentemente',
        description: 'Seu historico sera preenchido automaticamente durante a reproducao.',
      }
    }
    return {
      icon: <RadioTower size={32} />,
      title: 'Catalogo em preparacao',
      description: 'Nenhum canal foi publicado ainda. A infraestrutura ja esta pronta para receber o catalogo.',
    }
  }, [channels.filters.search, view])

  return (
    <main className="tv-platform">
      <TVHero featured={featured.data[0]} onWatch={setActiveChannel} />

      <div className="tv-platform__toolbar">
        <TVSidebar active={view} onChange={setView} />
        <TVSearch value={channels.filters.search} onChange={channels.setSearch} />
      </div>

      {channels.error && (
        <Alert status="warning" title="TV temporariamente indisponivel">
          A pagina continua acessivel enquanto a conexao com o catalogo e restabelecida.
        </Alert>
      )}

      <TVSection eyebrow="TRANSMISSAO" title="Player principal" subtitle="Selecione um canal para assistir.">
        <TVPlayer
          embed_url={activeChannel?.embedUrl}
          title={activeChannel?.name}
          poster={activeChannel?.logo}
          provider={activeChannel?.provider}
        />
      </TVSection>

      <TVSection
        eyebrow="EXPLORE"
        title="Categorias"
        subtitle="O catalogo sera organizado automaticamente conforme novas categorias forem publicadas."
        action={<Badge>{categories.count} CATEGORIAS</Badge>}
      >
        {categories.loading ? (
          <TVLoading count={4} />
        ) : categories.data.length ? (
          <div className="tv-platform__categories">
            {categories.data.map((category) => (
              <TVCategoryCard
                key={category.id}
                category={category}
                active={channels.filters.categoryId === category.id}
                onSelect={(id) => channels.setCategory(channels.filters.categoryId === id ? '' : id)}
              />
            ))}
          </div>
        ) : (
          <TVEmptyState
            icon={<Tv size={32} />}
            title="Categorias ainda nao publicadas"
            description="Elas aparecerao aqui assim que forem habilitadas no TV Manager."
          />
        )}
      </TVSection>

      <TVSection
        eyebrow="CATALOGO"
        title={view === 'favorites' ? 'Favoritos' : view === 'recent' ? 'Recentes' : 'Canais'}
        subtitle="Somente canais ativos e verificados pelo catalogo sao exibidos."
        action={<Badge>{visibleChannels.length} CANAIS</Badge>}
      >
        {channels.loading ? (
          <TVLoading count={6} />
        ) : visibleChannels.length ? (
          <div className="tv-platform__channels">
            {visibleChannels.map((channel) => (
              <TVChannelCard key={channel.id} channel={channel} onSelect={setActiveChannel} />
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
