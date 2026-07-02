import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CakeSlice,
  CalendarDays,
  Headphones,
  Mic2,
  Music2,
  Play,
  Radio,
  Scissors,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  Wrench,
} from 'lucide-react'
import {
  ActionButton,
  CardHeader,
  DashboardGrid,
  EmptyState,
  FeatureCard,
  HeroCard,
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
import { formatBrazilDateTime, nowUtcIso } from '../../../core/time'
import { getLiveMatchCenter } from '../../../modules/competition/services/liveMatchCenterService'
import { getFootballAutoSyncInterval, hasLiveFootballMatch, syncFootballBeforeRead } from '../../../modules/competition/services/footballAutoSyncService'
import { useCountdown } from '../home/hooks/useCountdown'
import { HeroMatchCenterV2 } from '../home/components/HeroMatchCenterV2'
import { HomeModuleBoundary } from '../home/components/HomeModuleBoundary'
import { barStudioTools, communityEvents, tvEvent } from '../home/data/dashboardData'
import { loadHomeDashboardContent } from '../home/services/homeContentService'

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
  NameGrad: ['Sparkles', 'Gradiente premium para nomes.'],
  NameWave: ['Sparkles', 'Efeito visual para nomes.'],
  'Pedir Musica': ['Music2', 'Pedido privado para locutores.'],
  'Redimensionar Imagem': ['Wrench', 'Tamanho certo em segundos.'],
  'Remover Fundo (Em breve)': ['Wrench', 'Recorte automatico em breve.'],
  'Criador de Avatar (Em breve)': ['Sparkles', 'Avatar exclusivo em breve.'],
}

const toolIcons = { Scissors, Sparkles, Music2, Wrench }

function formatCountdown(remaining) {
  return remaining.label || `${String(remaining.hours).padStart(2, '0')}h ${String(remaining.minutes).padStart(2, '0')}m`
}

function formatDateTime(value) {
  return formatBrazilDateTime(value)
}

function TeamCrest({ name, label, src, side = 'home' }) {
  const displayName = name || 'Time'
  const fallbackLabel = label || displayName.slice(0, 3).toUpperCase()

  return (
    <div className={`bds-live-hero-team bds-live-hero-team--${side}`}>
      <div className="bds-live-hero-crest">
        {src ? <img src={src} alt="" loading="lazy" /> : fallbackLabel}
      </div>
      <span className="bds-live-hero-team-name">{displayName}</span>
    </div>
  )
}

function HeroSection({ liveMatchCenter }) {
  const baseMatch = liveMatchCenter?.match || null
  const remaining = useCountdown(baseMatch?.startsAt || nowUtcIso())
  const hero = getLiveMatchCenter([], {
    match: baseMatch,
    countdownLabel: formatCountdown(remaining),
    formattedDateTime: formatDateTime(baseMatch?.startsAt),
  })

  if (hero.isEmpty) {
    return (
      <HeroCard className="bds-home-live-hero">
        <EmptyState
          title="Nenhuma partida disponivel"
          description="Assim que houver jogos sincronizados, o destaque aparece aqui automaticamente."
          actionLabel="Abrir Competition"
          onAction={() => { window.location.href = '/football' }}
        />
      </HeroCard>
    )
  }

  return (
    <HeroCard className="bds-home-live-hero">
      <div className="bds-live-hero-banner">
        <div className="bds-live-hero-competition">
          {hero.competitionLogo && <img src={hero.competitionLogo} alt="" className="bds-home-competition-logo" loading="lazy" />}
          <strong>{hero.competition}</strong>
        </div>

        <StatusBadge status={hero.displayStatus} tone={hero.statusTone}>{hero.displayStatus}</StatusBadge>

        <div className="bds-live-hero-match" aria-label={`${hero.homeTeam} contra ${hero.awayTeam}`}>
          <TeamCrest name={hero.homeTeam} label={hero.homeShield} src={hero.homeCrest} side="home" />
          <strong className="bds-live-hero-score">{hero.score}</strong>
          <TeamCrest name={hero.awayTeam} label={hero.awayShield} src={hero.awayCrest} side="away" />
        </div>

        {hero.infoItems.length > 0 && (
          <div className="bds-live-hero-info">
            {hero.infoItems.map((item) => <span key={item}>{item}</span>)}
          </div>
        )}

        <div className="bds-live-hero-actions">
          {hero.showTvButton && <ActionButton variant="secondary" onClick={() => { window.location.href = '/tv' }}>Assistir na TV</ActionButton>}
          {hero.showCompetitionButton && <ActionButton onClick={() => { window.location.href = '/football' }}>Abrir Competition</ActionButton>}
        </div>
      </div>
    </HeroCard>
  )
}

function TvCard() {
  const safeTvEvent = tvEvent || {}

  return (
    <FeatureCard
      className="bds-home-card-full"
      eyebrow="Arena principal"
      title="TV Ao Vivo"
      description="Transmissao e eventos em destaque"
      icon={<Play size={20} />}
      action={<StatusBadge status={safeTvEvent.status || 'EM BREVE'} tone="live">{safeTvEvent.status || 'Pronta'}</StatusBadge>}
    >
      <div className="bds-home-panel-body" data-designer-id="tv.content" data-designer-label="TV / Conteudo">
        <div className="bds-home-tv-stage" data-designer-id="tv.player" data-designer-label="TV / Player">
          <div className="bds-home-tv-content" data-designer-id="tv.categories" data-designer-label="TV / Categorias">
            <Play size={32} />
            <h3>TV <span>AO VIVO</span></h3>
            <p>Transmissao principal da comunidade</p>
          </div>
        </div>

        <div className="bds-home-stats-grid" data-designer-id="tv.stats" data-designer-label="TV / Estatisticas">
          <StatCard label="Proximo evento" value={safeTvEvent.title || 'Sem transmissao agendada'} />
          <StatCard label="Categoria" value={safeTvEvent.category || 'TV'} />
          <StatCard label="Status" value={safeTvEvent.status || 'Pronta'} />
        </div>
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

function FootballCard({ matches, results }) {
  const safeMatches = Array.isArray(matches) ? matches : []
  const safeResults = Array.isArray(results) ? results : []

  return (
    <FeatureCard
      className="bds-home-card-full"
      eyebrow="Sofascore do bar"
      title="Futebol"
      description="Ao vivo, proximos jogos e resultados"
      icon={<CalendarDays size={20} />}
      action={<ActionButton variant="outline" onClick={() => { window.location.href = '/football' }}>Abrir</ActionButton>}
    >
      <div className="bds-home-card-list" data-designer-id="football.cards" data-designer-label="Futebol / Cards">
        {safeMatches.length ? safeMatches.slice(0, 3).map((match) => <CompetitionMatchRow key={match.id} match={match} />) : (
          <div className="bds-home-empty">Nenhum jogo sincronizado encontrado.</div>
        )}
        {safeResults.length > 0 && (
          <div className="bds-home-result-box" data-designer-id="football.results" data-designer-label="Futebol / Resultados">
            <CardHeader eyebrow="Ultimos resultados" />
            <div className="bds-home-card-list">
              {safeResults.slice(0, 2).map((result, index) => (
                <div key={result.id || `result-${index}`} className="bds-home-result-row">
                  <span>{result.game || 'Resultado indisponivel'}</span>
                  <small>{result.championship || 'Competicao'}</small>
                </div>
              ))}
            </div>
          </div>
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
      eyebrow="Radar da comunidade"
      title="Noticias"
      description="Resumo rapido do que importa"
      icon={<Mic2 size={20} />}
      action={<ActionButton variant="outline" onClick={() => { window.location.href = '/news' }}>Ver todas</ActionButton>}
    >
      {loading ? <Loading label="Carregando noticias" /> : safeNews.length ? (
        <div className="bds-home-card-list" data-designer-id="news.cards" data-designer-label="Noticias / Cards">
          {safeNews.map((item, index) => (
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

  return (
    <FeatureCard
      className="bds-home-card-full"
      eyebrow="Movimento do bar"
      title="Comunidade"
      description="Sem exposicao de nomes, so sinais do grupo"
      icon={<Users size={20} />}
    >
      <div className="bds-home-stats-grid" data-designer-id="community.stats" data-designer-label="Comunidade / Estatisticas">
        <StatCard icon={<Users size={18} />} label="Online agora" value="128" hint="amigos conectados" />
        <StatCard icon={<Trophy size={18} />} label="Ultimo campeao" value="Equipe Ouro" hint="Bar Competition" />
        <StatCard icon={<CalendarDays size={18} />} label="Proximo evento" value={nextEvent?.title || '-'} hint={nextEvent?.date || ''} />
        <StatCard icon={<CakeSlice size={18} />} label="Aniversario" value="Em breve" hint="agenda privada" />
      </div>
      <div className="bds-home-community-note" data-designer-id="community.events" data-designer-label="Comunidade / Eventos">
        A comunidade acompanha TV, futebol, radio e chat oficial em um so lugar.
      </div>
    </FeatureCard>
  )
}

function RadioCard() {
  const { currentStation, playing, loading, error, toggle, volume, setVolume } = useRadio()
  const station = currentStation || {}

  return (
    <FeatureCard
      className="bds-home-card-full"
      eyebrow="Player do bar"
      title="Radio"
      description="Som do bar em tempo real"
      icon={<Radio size={20} />}
      action={<StatusBadge status={playing ? 'AO VIVO' : 'EM BREVE'} tone={playing ? 'live' : 'neutral'}>{playing ? 'AO VIVO' : 'Pronta'}</StatusBadge>}
    >
      <div className="bds-home-radio-card" data-designer-id="radio.player" data-designer-label="Radio / Player">
        <div className="bds-home-radio-main" data-designer-id="radio.currentTrack" data-designer-label="Radio / Musica Atual">
          <div className="bds-home-radio-icon" data-designer-id="radio.icon" data-designer-label="Radio / Icone"><Radio size={34} /></div>
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
            <span>{error || station.program || 'Programacao indisponivel'}</span>
            <span>{loading ? 'Conectando' : playing ? 'Online' : 'Pronta'}</span>
          </div>
          <Progress value={playing ? 100 : 0} />
        </div>
        <label className="bds-home-volume" data-designer-id="radio.volume" data-designer-label="Radio / Volume">
          <Volume2 size={18} />
          <input aria-label="Volume da radio" max="100" min="0" onChange={(event) => setVolume(event.target.value)} type="range" value={volume} />
          <span>{volume}%</span>
        </label>
        {error && <div className="bds-home-error"><AlertCircle size={18} />{error}</div>}
      </div>
    </FeatureCard>
  )
}

function BarStudioCard() {
  const tools = Array.isArray(barStudioTools) ? barStudioTools : []

  return (
    <FeatureCard
      eyebrow="Hub oficial de ferramentas"
      title="BarStudio"
      description="Ferramentas rapidas para a comunidade"
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
          <div className="bds-grid-span-7" data-designer-id="football" data-designer-label="Futebol"><HomeModuleBoundary moduleName="Futebol"><FootballCard matches={dashboard.competitionMatches} results={dashboard.latestResults} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-5" data-designer-id="news" data-designer-label="Noticias"><HomeModuleBoundary moduleName="Noticias"><NewsPanel loading={loading} news={dashboard.news} /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="radio" data-designer-label="Radio"><HomeModuleBoundary moduleName="Radio"><RadioCard /></HomeModuleBoundary></div>
          <div className="bds-grid-span-6" data-designer-id="community" data-designer-label="Comunidade"><HomeModuleBoundary moduleName="Comunidade"><CommunityPanel /></HomeModuleBoundary></div>
          <div className="bds-grid-span-12" data-designer-id="barstudio" data-designer-label="BarStudio"><HomeModuleBoundary moduleName="BarStudio"><BarStudioCard /></HomeModuleBoundary></div>
        </DashboardGrid>
      </ResponsiveContainer>
    </main>
  )
}
