import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CakeSlice,
  CalendarDays,
  Headphones,
  Mic2,
  Music2,
  Play,
  Radio,
  Search,
  Scissors,
  Sparkles,
  Trophy,
  Users,
  Volume2,
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
  Progress,
  ResponsiveContainer,
  StatCard,
  StatusBadge,
} from '../../../design-system'
import '../../../design-system/styles/index.css'
import { getSupabaseClient } from '../../../core/database'
import { useRadio } from '../../../core/providers/RadioProvider'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../../modules/competition/services/footballAutoSyncService'
import { HeroMatchCenterV2 } from '../home/components/HeroMatchCenterV2'
import { HomeModuleBoundary } from '../home/components/HomeModuleBoundary'
import { barStudioTools, communityEvents, latestResults } from '../home/data/dashboardData'
import { HOME_TV_CATEGORIES, HOME_TV_CHANNELS } from '../home/data/homeTvChannels'
import { loadHomeDashboardContent } from '../home/services/homeContentService'
import { loadHomeTVChannels } from '../../../modules/tv/services/TVHomeChannelSource'
import { submitRadioMusicRequest } from '../../radio/requests/radioRequestsApi'

const OfficialChat = lazy(() =>
  import('../../../modules/chat/components/OfficialChat').then((module) => ({
    default: module.OfficialChat,
  })),
)

const initialDashboard = {
  news: [],
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
              category={item.category || 'Comunidade'}
              className="bds-home-news-row"
              date={item.date || ''}
              image={item.image}
              source="Fonte sincronizada"
              title={item.title || 'Noticia indisponivel'}
            />
          ))}
        </div>
      ) : <div className="bds-home-empty">Nenhuma noticia sincronizada encontrada.</div>}
    </FeatureCard>
  )
}

function CommunityPanel() {
  const safeEvents = Array.isArray(communityEvents) ? communityEvents : []
  const nextEvent = safeEvents[0] || null
  const lastResult = latestResults[0] || null

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="EVENTOS DO BAR"
      icon={<Users size={20} />}
      action={<ActionButton variant="outline" onClick={() => { window.location.href = '/football' }}>Competicao</ActionButton>}
    >
      <div className="bds-home-stats-grid" data-designer-id="community.stats" data-designer-label="Comunidade / Estatisticas">
        <StatCard icon={<CalendarDays size={18} />} label="Proximo evento" value={nextEvent?.date || 'A definir'} hint={nextEvent?.title || 'Em breve'} />
        <StatCard icon={<Trophy size={18} />} label="Noite do Bolao" value={nextEvent?.title || 'Em breve'} hint={nextEvent?.category || 'Competicao'} />
        <StatCard icon={<CakeSlice size={18} />} label="Resultado do ultimo campeonato" value={lastResult?.game || 'Sem resultado disponivel'} hint={lastResult?.championship || 'A definir'} />
      </div>
    </FeatureCard>
  )
}

function RadioCard() {
  const { currentStation, playing, loading, error, toggle, volume, setVolume } = useRadio()
  const station = currentStation || {}
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestFeedback, setRequestFeedback] = useState('')
  const [requestFeedbackTone, setRequestFeedbackTone] = useState('info')
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [requestForm, setRequestForm] = useState({ songAndArtist: '', message: '' })
  const [failedCoverUrl, setFailedCoverUrl] = useState('')
  const listenerCount = Number(station.listeners) || 0
  const listenerLabel = `${listenerCount} ${listenerCount === 1 ? 'ouvinte' : 'ouvintes'}`
  const coverUrl = typeof station.cover === 'string' ? station.cover.trim() : ''
  const hasCover = /^https?:\/\//i.test(coverUrl) && failedCoverUrl !== coverUrl

  function handleOpenRequestModal() {
    setRequestFeedback('')
    setRequestFeedbackTone('info')
    setRequestModalOpen(true)
  }

  function handleRequestChange(event) {
    const { name, value } = event.target
    setRequestForm((current) => ({ ...current, [name]: value }))
  }

  async function handleRequestSubmit(event) {
    event.preventDefault()
    setRequestFeedback('')
    setRequestFeedbackTone('info')

    try {
      setRequestSubmitting(true)
      await submitRadioMusicRequest(requestForm)
      setRequestFeedback('Pedido enviado para o locutor! Seu pedido foi registrado com sucesso.')
      setRequestFeedbackTone('success')
      setRequestForm({ songAndArtist: '', message: '' })
    } catch (requestError) {
      setRequestFeedback(requestError.status === 429
        ? 'Aguarde um pouco antes de enviar outro pedido.'
        : requestError.message || 'Nao foi possivel registrar o pedido agora.')
      setRequestFeedbackTone('error')
    } finally {
      setRequestSubmitting(false)
    }
  }

  return (
    <FeatureCard
      className="bds-home-card-full"
      title="RÁDIO DO BAR"
      icon={<Radio size={20} />}
      action={station.online ? <StatusBadge status="AO VIVO" tone="live">AO VIVO</StatusBadge> : null}
    >
      <div className="bds-home-radio-card" data-designer-id="radio.player" data-designer-label="Radio / Player">
        <div className="bds-home-radio-main" data-designer-id="radio.currentTrack" data-designer-label="Radio / Musica Atual">
          <div className="bds-home-radio-icon" data-designer-id="radio.icon" data-designer-label="Radio / Icone">
            {hasCover ? (
              <img src={coverUrl} alt="" onError={() => setFailedCoverUrl(coverUrl)} />
            ) : (
              <Radio size={34} />
            )}
          </div>
          <div>
            <span>Tocando agora</span>
            <strong>{station.currentTrack || 'Radio pronta'}</strong>
            <p>{station.artist || station.name || 'Aguardando transmissao'}</p>
          </div>
          <span data-designer-id="radio.buttons" data-designer-label="Radio / Botoes"><ActionButton loading={loading} icon={playing ? <Headphones size={18} /> : <Play size={18} />} onClick={toggle}>
            {playing ? 'Pausar' : 'Tocar'}
          </ActionButton></span>
        </div>
        <div>
          <div className="bds-home-radio-status">
            <span>{error || listenerLabel}</span>
            <span>{loading ? 'Conectando' : station.online ? 'AO VIVO' : 'Aguardando sinal'}</span>
          </div>
          <Progress value={playing ? 100 : 0} />
        </div>
        <label className="bds-home-volume" data-designer-id="radio.volume" data-designer-label="Radio / Volume">
          <Volume2 size={18} />
          <input aria-label="Volume da radio" max="100" min="0" onChange={(event) => setVolume(event.target.value)} type="range" value={volume} />
          <span>{volume}%</span>
        </label>
        <button className="bds-home-request-button" type="button" aria-label="Pedir música" title="Pedidos musicais em preparacao" onClick={handleOpenRequestModal}>
          <Music2 size={16} />
          Pedir música
        </button>
        {error && <div className="bds-home-error"><AlertCircle size={18} />{error}</div>}
        {requestModalOpen && (
          <div className="bds-home-radio-request-modal" role="dialog" aria-modal="true" aria-labelledby="radio-request-title">
            <div className="bds-home-radio-request-panel">
              <div className="bds-home-radio-request-header">
                <div>
                  <span>Radio do Bar</span>
                  <strong id="radio-request-title">Pedir musica</strong>
                </div>
                <button type="button" aria-label="Fechar pedido de musica" onClick={() => setRequestModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form className="bds-home-radio-request-form" onSubmit={handleRequestSubmit}>
                <label>
                  Musica e artista
                  <input
                    name="songAndArtist"
                    placeholder="Nome da musica e do artista"
                    type="text"
                    minLength={3}
                    maxLength={180}
                    required
                    value={requestForm.songAndArtist}
                    onChange={handleRequestChange}
                  />
                </label>
                <label>
                  Recado <span>(opcional)</span>
                  <textarea
                    name="message"
                    placeholder="Deixe um recado para a radio"
                    rows="3"
                    maxLength={500}
                    value={requestForm.message}
                    onChange={handleRequestChange}
                  />
                </label>
                {requestFeedback && <p className={`bds-home-radio-request-feedback is-${requestFeedbackTone}`}>{requestFeedback}</p>}
                <div className="bds-home-radio-request-actions">
                  <button type="button" onClick={() => setRequestModalOpen(false)} disabled={requestSubmitting}>Fechar</button>
                  <button type="submit" disabled={requestSubmitting}>{requestSubmitting ? 'Enviando...' : 'Enviar pedido'}</button>
                </div>
              </form>
            </div>
          </div>
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
          <div className="bds-grid-span-6" data-designer-id="radio" data-designer-label="Radio"><HomeModuleBoundary moduleName="Radio"><RadioCard /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="community" data-designer-label="Comunidade"><HomeModuleBoundary moduleName="Comunidade"><CommunityPanel /></HomeModuleBoundary></div>
          <div className="bds-grid-span-12" data-designer-id="barstudio" data-designer-label="BarStudio"><HomeModuleBoundary moduleName="BarStudio"><BarStudioCard /></HomeModuleBoundary></div>
        </DashboardGrid>
      </ResponsiveContainer>
    </main>
  )
}
