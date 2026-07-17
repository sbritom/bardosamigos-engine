import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Mic2,
  Music2,
  Play,
  Search,
  Scissors,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import {
  ActionButton,
  DashboardGrid,
  FeatureCard,
  Loading,
  MatchCard,
  NewsCard,
  ResponsiveContainer,
} from '../../../design-system'
import '../../../design-system/styles/index.css'
import { getSupabaseClient } from '../../../core/database'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../../modules/competition/services/footballAutoSyncService'
import { HeroMatchCenterV2 } from '../home/components/HeroMatchCenterV2'
import { HomeModuleBoundary } from '../home/components/HomeModuleBoundary'
import { barStudioTools } from '../home/data/dashboardData'
import { HOME_TV_CATEGORIES, HOME_TV_CHANNELS } from '../home/data/homeTvChannels'
import { loadHomeDashboardContent } from '../home/services/homeContentService'
import { loadHomeTVChannels } from '../../../modules/tv/services/TVHomeChannelSource'

const OfficialChat = lazy(() =>
  import('../../../modules/chat/components/OfficialChat').then((module) => ({
    default: module.OfficialChat,
  })),
)

const initialDashboard = {
  news: [],
  events: [],
  youtubeHits: [],
  competitionMatches: [],
  nextMatch: null,
  liveMatchCenter: null,
  latestResults: [],
  errors: [],
}

const studioToolMeta = {
  'Cortar Foto Redonda': ['Scissors', 'Foto redonda para perfil e xat.'],
  'Gerador de Cores': ['Sparkles', 'Cores para nomes e visual do xat.'],
  'Remover Fundo': ['Wrench', 'Recorte de imagem preparado.'],
  'Criador de Avatar (Em breve)': ['Sparkles', 'Em breve.'],
}

const toolIcons = { Scissors, Sparkles, Music2, Wrench }

function TvCard() {
  const [tvChannels, setTvChannels] = useState(HOME_TV_CHANNELS)
  const [tvCategories, setTvCategories] = useState(HOME_TV_CATEGORIES)
  const [currentChannel, setCurrentChannel] = useState(HOME_TV_CHANNELS[0])
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const normalizedSearch = searchTerm.trim().toLowerCase()

  useEffect(() => {
    let active = true
    loadHomeTVChannels().then((catalog) => {
      if (!active) return
      const nextChannels = catalog.channels?.length ? catalog.channels : HOME_TV_CHANNELS
      const nextCategories = catalog.categories?.length ? catalog.categories : HOME_TV_CATEGORIES
      setTvChannels(nextChannels)
      setTvCategories(nextCategories)
      setCurrentChannel((channel) => {
        if (channel && nextChannels.some((item) => item.id === channel.id)) return channel
        return nextChannels[0] || HOME_TV_CHANNELS[0]
      })
      setActiveCategory((category) => (nextCategories.includes(category) ? category : 'Todos'))
    })
    return () => {
      active = false
    }
  }, [])

  const filteredChannels = useMemo(() => {
    return tvChannels.filter((channel) => {
      const matchesCategory = activeCategory === 'Todos' || channel.category === activeCategory
      const matchesSearch = !normalizedSearch ||
        channel.name.toLowerCase().includes(normalizedSearch) ||
        channel.category.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, normalizedSearch, tvChannels])

  function selectChannel(channel) {
    setCurrentChannel(channel)
    setIsChannelModalOpen(false)
  }

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="TV AO VIVO"
      icon={<Play size={20} />}
      action={<ActionButton className="bds-home-tv-header-button" variant="secondary" onClick={() => setIsChannelModalOpen(true)}>Escolha outro canal</ActionButton>}
    >
      <div className="bds-home-panel-body bds-home-tv-panel" data-designer-id="tv.content" data-designer-label="TV / Conteudo">
        <div className="bds-home-tv-stage" data-designer-id="tv.player" data-designer-label="TV / Player">
          <iframe
            key={currentChannel.id}
            className="bds-home-tv-iframe"
            src={currentChannel.src}
            title={`TV ao vivo - ${currentChannel.name}`}
            allow="autoplay; fullscreen; encrypted-media"
            loading="lazy"
            referrerPolicy="no-referrer"
            allowFullScreen
          />

        </div>

        {isChannelModalOpen && (
          <div className="bds-home-tv-modal" role="dialog" aria-modal="true" aria-label="Escolher canal de TV">
            <div className="bds-home-tv-modal__header">
              <div>
                <span>TV Ao Vivo</span>
                <strong>Escolher canal</strong>
              </div>
              <button className="bds-home-tv-modal__close" type="button" aria-label="Fechar seletor de canais" onClick={() => setIsChannelModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="bds-home-tv-search">
              <Search size={16} />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar canal"
                aria-label="Buscar canal"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="bds-home-tv-categories" aria-label="Categorias de canais">
              {tvCategories.map((category) => (
                <button
                  key={category}
                  className={category === activeCategory ? 'is-active' : ''}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="bds-home-tv-channel-grid">
              {filteredChannels.length ? filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  className={channel.id === currentChannel.id ? 'bds-home-tv-channel is-active' : 'bds-home-tv-channel'}
                  type="button"
                  onClick={() => selectChannel(channel)}
                >
                  <span>{channel.category}</span>
                  <strong>{channel.name}</strong>
                </button>
              )) : (
                <div className="bds-home-tv-no-results">Nenhum canal encontrado.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </FeatureCard>
  )
}

function CompetitionMatchRow({ match }) {
  const hasScore = match.homeScore !== null && match.homeScore !== undefined && match.awayScore !== null && match.awayScore !== undefined

  return (
    <MatchCard
      action={match.competitionLogo && <img src={match.competitionLogo} alt="" className="bds-home-competition-logo" loading="lazy" />}
      awayCrest={match.awayCrest}
      awayTeam={match.awayTeam}
      className="bds-home-match-row"
      competition={match.championship}
      homeCrest={match.homeCrest}
      homeTeam={match.homeTeam}
      meta={match.dateLabel || match.localTime}
      onOpen={() => { window.location.href = '/football' }}
      score={hasScore ? `${match.homeScore} x ${match.awayScore}` : 'VS'}
      status={match.status || match.standardStatus}
    />
  )
}

function FootballCard({ matches }) {
  const safeMatches = Array.isArray(matches) ? matches : []

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="Futebol"
      icon={<CalendarDays size={20} />}
      action={<ActionButton variant="outline" onClick={() => { window.location.href = '/football' }}>Abrir</ActionButton>}
    >
      <div className="bds-home-card-list" data-designer-id="football.cards" data-designer-label="Futebol / Cards">
        {safeMatches.length ? safeMatches.slice(0, 3).map((match) => <CompetitionMatchRow key={match.id} match={match} />) : (
          <div className="bds-home-empty">Nenhum jogo sincronizado encontrado.</div>
        )}
      </div>
    </FeatureCard>
  )
}

function NewsPanel({ news, loading }) {
  const safeNews = Array.isArray(news) ? news : []

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="Noticias"
      icon={<Mic2 size={20} />}
      action={<ActionButton variant="outline" onClick={() => { window.location.href = '/news' }}>Ver todas</ActionButton>}
    >
      {loading ? <Loading label="Carregando noticias" /> : safeNews.length ? (
        <div className="bds-home-card-list" data-designer-id="news.cards" data-designer-label="Noticias / Cards">
          {safeNews.slice(0, 3).map((item, index) => (
            <NewsCard
              key={item.id || `news-${index}`}
              className="bds-home-news-row"
              image={item.image}
              onOpen={() => { window.location.href = '/news' }}
              title={item.title || 'Noticia indisponivel'}
            />
          ))}
        </div>
      ) : <div className="bds-home-empty">Nenhuma noticia sincronizada encontrada.</div>}
    </FeatureCard>
  )
}

function CommunityPanel({ events = [] }) {
  const safeEvents = Array.isArray(events) ? events : []
  const nextEvent = safeEvents[0] || null
  const eventDateTime = nextEvent
    ? [nextEvent.homeDateLabel || nextEvent.dateLabel, nextEvent.homeTimeLabel || nextEvent.timeLabel].filter(Boolean).join(' â€¢ ') || 'Data e horario a definir'
    : ''

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="EVENTOS DO BAR"
      icon={<CalendarDays size={20} />}
      action={<ActionButton variant="outline" onClick={() => { window.location.href = '/events' }}>VER EVENTOS</ActionButton>}
    >
      {nextEvent ? (
        <div className="bds-home-community-note" data-designer-id="community.banner" data-designer-label="Eventos / Banner">
          <span>{eventDateTime}</span>
          <strong>{nextEvent.title || 'Evento do Bar'}</strong>
          {nextEvent.summary && <p>{nextEvent.summary}</p>}
        </div>
      ) : (
        <div className="bds-home-empty">Nenhum evento programado no momento.</div>
      )}
    </FeatureCard>
  )
}

function RadioCard({ hits = [] }) {
  const safeHits = Array.isArray(hits) ? hits : []

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="📈 Hits do Momento"
      description="As músicas em alta no YouTube Brasil."
      icon={<Music2 size={20} />}
    >
      <div className="bds-home-card-list" data-designer-id="radio.topSongs" data-designer-label="Hits do Momento / Lista">
        {safeHits.length ? safeHits.map((track, index) => (
          <div key={track.id || `${track.position}-${track.title}`} className="bds-home-radio-card">
            <div className="bds-home-radio-main">
              <div className="bds-home-radio-icon">
                {track.thumbnail ? <img src={track.thumbnail} alt="" loading="lazy" /> : String(track.position || index + 1).padStart(2, '0')}
              </div>
              <div>
                <span>#{String(track.position || index + 1).padStart(2, '0')}</span>
                <strong>{track.title}</strong>
                <p>{track.channelTitle}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="bds-home-empty">Nenhum hit disponível no momento.</div>
        )}
      </div>
    </FeatureCard>
  )
}

function BarStudioCard() {
  const tools = Array.isArray(barStudioTools) ? barStudioTools : []

  return (
    <FeatureCard
      title="BAR STUDIO"
      icon={<Scissors size={20} />}
      action={<ActionButton onClick={() => { window.location.href = '/tools' }}>Abrir BarStudio</ActionButton>}
    >
      <div className="bds-home-tools-grid" data-designer-id="barstudio.tools" data-designer-label="BarStudio / Ferramentas">
        {tools.length ? tools.map((tool, index) => {
          const [iconName, description] = studioToolMeta[tool] || ['Wrench', 'Ferramenta da comunidade.']
          const Icon = toolIcons[iconName] || Wrench
          return (
            <button key={tool} className="bds-home-tool-card" type="button" data-designer-id={`barstudio.tool.${index}`} data-designer-label={`BarStudio / ${tool}`}>
              <div className="bds-card-header__icon" data-designer-id={`barstudio.icon.${index}`} data-designer-label={`BarStudio / Icone ${tool}`}>
                <Icon size={20} />
              </div>
              <strong>{tool}</strong>
              <span>{description}</span>
            </button>
          )
        }) : <div className="bds-home-empty">Nenhuma ferramenta disponivel agora.</div>}
      </div>
    </FeatureCard>
  )
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(true)
  const hasLiveMatchRef = useRef(false)

  useEffect(() => {
    let active = true
    let refreshTimer = null

    async function loadDashboard({ syncFirst = false } = {}) {
      try {
        if (syncFirst) {
          await syncFootballBeforeRead({ hasLiveMatch: hasLiveMatchRef.current })
        }

        const content = await loadHomeDashboardContent()
        if (active) {
          hasLiveMatchRef.current = hasLiveFootballMatch({
            matches: content?.competitionMatches || [],
            liveMatchCenter: content?.liveMatchCenter || null,
          })
          setDashboard({
            news: Array.isArray(content?.news) ? content.news : [],
            events: Array.isArray(content?.events) ? content.events : [],
            youtubeHits: Array.isArray(content?.youtubeHits) ? content.youtubeHits : [],
            competitionMatches: Array.isArray(content?.competitionMatches) ? content.competitionMatches : [],
            nextMatch: content?.nextMatch || null,
            liveMatchCenter: content?.liveMatchCenter || null,
            latestResults: Array.isArray(content?.latestResults) ? content.latestResults : [],
            errors: Array.isArray(content?.errors) ? content.errors : [],
          })
        }
      } catch (error) {
        console.error('[HomePage] Falha ao carregar dashboard', error)
        if (active) setDashboard(initialDashboard)
      } finally {
        if (active) setLoading(false)
      }
    }

    async function scheduleRefresh() {
      await loadDashboard({ syncFirst: true })
      if (!active) return

      refreshTimer = window.setTimeout(scheduleRefresh, getFootballAutoSyncInterval(hasLiveMatchRef.current))
    }

    scheduleRefresh()
    const supabase = getSupabaseClient()
    const matchChannel = supabase
      ?.channel('home-live-match-center')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_matches' },
        () => {
          loadDashboard()
        },
      )
      .subscribe()

    return () => {
      active = false
      if (refreshTimer) window.clearTimeout(refreshTimer)
      if (supabase && matchChannel) {
        supabase.removeChannel(matchChannel)
      }
    }
  }, [])

  return (
    <main className="bds-home-shell">
      <ResponsiveContainer size="xl">
        <DashboardGrid>
          <div className="bds-grid-span-12" data-designer-id="hero" data-designer-label="Hero"><HomeModuleBoundary moduleName="Hero"><HeroMatchCenterV2 liveMatchCenter={dashboard.liveMatchCenter} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="tv" data-designer-label="TV"><HomeModuleBoundary moduleName="TV"><TvCard /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="chat" data-designer-label="Chat"><HomeModuleBoundary moduleName="Chat"><Suspense fallback={<Loading label="Carregando chat oficial" />}><OfficialChat /></Suspense></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="football" data-designer-label="Futebol"><HomeModuleBoundary moduleName="Futebol"><FootballCard matches={dashboard.competitionMatches} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="news" data-designer-label="Noticias"><HomeModuleBoundary moduleName="Noticias"><NewsPanel loading={loading} news={dashboard.news} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="radio" data-designer-label="Radio"><HomeModuleBoundary moduleName="Radio"><RadioCard hits={dashboard.youtubeHits} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="community" data-designer-label="Comunidade"><HomeModuleBoundary moduleName="Comunidade"><CommunityPanel events={dashboard.events} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-12" data-designer-id="barstudio" data-designer-label="BarStudio"><HomeModuleBoundary moduleName="BarStudio"><BarStudioCard /></HomeModuleBoundary></div>
        </DashboardGrid>
      </ResponsiveContainer>
    </main>
  )
}

