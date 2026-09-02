import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ExternalLink,
  Gamepad2,
  Gift,
  Newspaper,
  RefreshCw,
  Rocket,
  Search,
  Swords,
  Trophy,
} from 'lucide-react'
import { ActionButton } from '../../../design-system'
import './gamesPage.css'

const FILTERS = [
  ['all', 'Tudo'],
  ['esports', 'Esports'],
  ['releases', 'Lançamentos'],
  ['championships', 'Campeonatos'],
  ['free', 'Jogos grátis'],
]

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function includesTerm(values = [], term = '') {
  if (!term) return true
  return normalize(values.filter(Boolean).join(' ')).includes(term)
}

function isChampionship(item = {}) {
  return /campeonato|torneio|liga|final|mundial|qualificat|circuito|copa/.test(
    normalize(`${item.title} ${item.description}`)
  )
}

function classify(item = {}) {
  const text = normalize(`${item.title} ${item.description}`)
  if (/esport|campeonato|torneio|competitiv|free fire|fortnite|valorant|league of legends|lol|cs2|counter strike|dota/.test(text)) return 'esports'
  if (/gratis|gratuito|free to play|free-to-play|de graca|epic games store/.test(text)) return 'free'
  if (/lancamento|lanca|release|estreia|chega|novo jogo|nova temporada|atualizacao|update/.test(text)) return 'releases'
  return 'news'
}

function formatDate(value, options = {}) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(options.year ? { year: 'numeric' } : {}),
    ...(options.time ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

function withPreviewAccess(path) {
  if (typeof window === 'undefined') return path

  const shareToken = new URLSearchParams(window.location.search).get('_vercel_share')
  if (!shareToken) return path

  const url = new URL(path, window.location.origin)
  url.searchParams.set('_vercel_share', shareToken)
  return `${url.pathname}${url.search}`
}

async function fetchJson(path) {
  const url = withPreviewAccess(path)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        data: {},
        error: new Error(`Resposta inválida ao carregar ${path}`),
      }
    }

    const data = await response.json().catch(() => ({}))
    return {
      ok: response.ok,
      data,
      error: response.ok ? null : new Error(data.error || `Falha ao carregar ${path}`),
    }
  } catch (error) {
    return { ok: false, data: {}, error }
  }
}

function GameCover({ item, className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!item?.image || failed) {
    return (
      <div className={`games-page__cover games-page__cover--fallback ${className}`}>
        <Gamepad2 size={26} />
        <span>IMORTAL0800 GAMES</span>
      </div>
    )
  }

  return (
    <img
      className={`games-page__cover ${className}`}
      src={item.image}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function DataCover({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`games-page__data-cover games-page__cover--fallback ${className}`}>
        <Gamepad2 size={24} />
        <span>IMORTAL0800 GAMES</span>
      </div>
    )
  }

  return (
    <img
      className={`games-page__data-cover ${className}`}
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function openExternal(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function NewsCard({ item, compact = false }) {
  return (
    <button
      className={compact ? 'games-page__news-card is-compact' : 'games-page__news-card'}
      type="button"
      onClick={() => openExternal(item?.url)}
      disabled={!item?.url}
    >
      <GameCover item={item} />
      <span className="games-page__news-copy">
        <span className="games-page__meta">
          {item?.source ? <span>{item.source}</span> : null}
          {formatDate(item?.publishedAt) ? <span>{formatDate(item.publishedAt)}</span> : null}
        </span>
        <strong>{item?.title || 'Notícia gamer'}</strong>
        {!compact && item?.description ? <p>{item.description}</p> : null}
      </span>
    </button>
  )
}

function ReleaseCard({ game }) {
  return (
    <button
      className="games-page__data-card"
      type="button"
      onClick={() => openExternal(game?.url)}
      disabled={!game?.url}
    >
      <DataCover src={game?.image} alt="" />
      <span className="games-page__data-copy">
        <span className="games-page__meta">
          <span>{formatDate(game?.released, { year: true }) || 'Data a confirmar'}</span>
          <span>RAWG</span>
        </span>
        <strong>{game?.name || 'Jogo'}</strong>
        <span className="games-page__chips">
          {(game?.platforms || []).slice(0, 3).map((platform) => <span key={platform}>{platform}</span>)}
        </span>
      </span>
    </button>
  )
}

function FreeGameCard({ item }) {
  const target = item?.openGiveawayUrl || item?.gamerPowerUrl

  return (
    <button
      className="games-page__data-card"
      type="button"
      onClick={() => openExternal(target)}
      disabled={!target}
    >
      <DataCover src={item?.image || item?.thumbnail} alt="" />
      <span className="games-page__data-copy">
        <span className="games-page__meta">
          <span>{item?.worth || 'Grátis'}</span>
          {item?.type ? <span>{item.type}</span> : null}
          {item?.endDate && item.endDate !== 'N/A' ? <span>até {formatDate(item.endDate)}</span> : null}
        </span>
        <strong>{item?.title || 'Jogo grátis'}</strong>
        <span className="games-page__chips">
          {(item?.platforms || []).slice(0, 3).map((platform) => <span key={platform}>{platform}</span>)}
        </span>
      </span>
    </button>
  )
}

function EsportsMatchCard({ match }) {
  const opponents = Array.isArray(match?.opponents) ? match.opponents : []
  const first = opponents[0] || { name: 'A definir' }
  const second = opponents[1] || { name: 'A definir' }
  const scores = new Map((match?.results || []).map((result) => [result.teamId, result.score]))
  const running = String(match?.status || '').toLowerCase() === 'running'
  const finished = ['finished', 'canceled'].includes(String(match?.status || '').toLowerCase())

  return (
    <article className="games-page__esports-card">
      <div className="games-page__esports-head">
        <span>{match?.videogame || 'Esports'}</span>
        <strong>{match?.league || match?.tournament || 'Competição'}</strong>
      </div>

      <div className="games-page__versus">
        <div className="games-page__team">
          {first.image ? <img src={first.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{String(first.name).slice(0, 2).toUpperCase()}</span>}
          <strong>{first.name}</strong>
        </div>

        <div className="games-page__score">
          {finished || running ? (
            <>
              <strong>{scores.get(first.id) ?? '-'}</strong>
              <span>x</span>
              <strong>{scores.get(second.id) ?? '-'}</strong>
            </>
          ) : (
            <span>{formatDate(match?.scheduledAt || match?.beginAt, { time: true }) || 'Em breve'}</span>
          )}
        </div>

        <div className="games-page__team">
          {second.image ? <img src={second.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{String(second.name).slice(0, 2).toUpperCase()}</span>}
          <strong>{second.name}</strong>
        </div>
      </div>

      <div className={`games-page__match-status ${running ? 'is-live' : ''}`}>
        {running ? 'AO VIVO' : finished ? 'FINALIZADO' : 'AGENDADO'}
      </div>
    </article>
  )
}

function ChampionshipRow({ match }) {
  const opponents = Array.isArray(match?.opponents) ? match.opponents : []
  const names = opponents.map((team) => team.name).filter(Boolean).join(' x ')
  const running = String(match?.status || '').toLowerCase() === 'running'

  return (
    <div className="games-page__championship-row">
      <span className="games-page__championship-icon">
        {match?.leagueImage ? <img src={match.leagueImage} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Trophy size={18} />}
      </span>
      <span className="games-page__championship-copy">
        <span className="games-page__meta">
          <span>{match?.videogame || 'Esports'}</span>
          <span>{running ? 'AO VIVO' : formatDate(match?.scheduledAt || match?.beginAt, { time: true }) || 'Agenda'}</span>
        </span>
        <strong>{match?.league || match?.tournament || 'Campeonato'}</strong>
        <small>{match?.serie || match?.tournament || names || 'Competição em destaque'}</small>
      </span>
    </div>
  )
}

function EmptyPanel({ title, description }) {
  return (
    <div className="games-page__empty">
      <Gamepad2 size={22} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}

export default function GamesPage() {
  const [payload, setPayload] = useState({
    news: [],
    featured: null,
    esportsNews: [],
    releasesNews: [],
    releases: [],
    freeGames: [],
    esports: { running: [], upcoming: [], past: [] },
  })
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [warnings, setWarnings] = useState([])

  async function loadGames() {
    setLoading(true)
    setWarnings([])

    const [newsResult, releasesResult, freeResult, esportsResult] = await Promise.all([
      fetchJson('/api/news?category=Games&limit=30'),
      fetchJson('/api/news?games=releases'),
      fetchJson('/api/news?games=free'),
      fetchJson('/api/news?games=esports'),
    ])

    const news = (Array.isArray(newsResult.data?.articles) ? newsResult.data.articles : []).map((item) => ({
      ...item,
      description: item.description || item.summary || '',
      publishedAt: item.publishedAt || item.date || '',
      kind: classify(item),
    }))

    setPayload({
      news,
      featured: news[0] || null,
      esportsNews: news.filter((item) => item.kind === 'esports').slice(0, 8),
      releasesNews: news.filter((item) => item.kind === 'releases').slice(0, 8),
      releases: releasesResult.ok && Array.isArray(releasesResult.data?.items) ? releasesResult.data.items : [],
      freeGames: freeResult.ok && Array.isArray(freeResult.data?.items) ? freeResult.data.items : [],
      esports: {
        running: esportsResult.ok && Array.isArray(esportsResult.data?.running) ? esportsResult.data.running : [],
        upcoming: esportsResult.ok && Array.isArray(esportsResult.data?.upcoming) ? esportsResult.data.upcoming : [],
        past: esportsResult.ok && Array.isArray(esportsResult.data?.past) ? esportsResult.data.past : [],
      },
    })

    const nextWarnings = []
    if (!newsResult.ok) nextWarnings.push('notícias')
    if (!releasesResult.ok) nextWarnings.push('lançamentos')
    if (!freeResult.ok) nextWarnings.push('jogos grátis')
    if (!esportsResult.ok) nextWarnings.push('esports')
    setWarnings(nextWarnings)
    setLoading(false)
  }

  useEffect(() => {
    loadGames()
  }, [])

  const championshipNews = useMemo(
    () => payload.news.filter(isChampionship).slice(0, 8),
    [payload.news],
  )

  const esportsMatches = useMemo(
    () => [...payload.esports.running, ...payload.esports.upcoming, ...payload.esports.past].slice(0, 12),
    [payload.esports],
  )

  const championshipMatches = useMemo(() => {
    const seen = new Set()
    return esportsMatches.filter((match) => {
      const key = [match.videogame, match.league, match.serie, match.tournament].join('|')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 6)
  }, [esportsMatches])

  const freeNews = useMemo(
    () => payload.news.filter((item) => item.kind === 'free').slice(0, 8),
    [payload.news],
  )

  const radarItems = useMemo(() => {
    if (payload.news.length) return payload.news

    return payload.releases.map((game) => ({
      id: `release-${game.id}`,
      title: game.name,
      description: `Próximo lançamento para ${(game.platforms || []).slice(0, 3).join(', ') || 'plataformas a confirmar'}.`,
      source: 'RAWG',
      publishedAt: game.released,
      image: game.image,
      url: game.url,
      kind: 'releases',
    }))
  }, [payload.news, payload.releases])

  const term = normalize(search)

  const filteredNews = useMemo(
    () => payload.news.filter((item) => includesTerm([item.title, item.description, item.source], term)),
    [payload.news, term],
  )

  const filteredReleases = useMemo(
    () => payload.releases.filter((game) => includesTerm([game.name, ...(game.platforms || []), ...(game.genres || [])], term)),
    [payload.releases, term],
  )

  const filteredFreeGames = useMemo(
    () => payload.freeGames.filter((item) => includesTerm([item.title, item.description, ...(item.platforms || [])], term)),
    [payload.freeGames, term],
  )

  const filteredEsports = useMemo(
    () => esportsMatches.filter((match) => includesTerm([
      match.videogame,
      match.league,
      match.tournament,
      ...(match.opponents || []).map((team) => team.name),
    ], term)),
    [esportsMatches, term],
  )

  const filteredChampionshipNews = useMemo(
    () => championshipNews.filter((item) => includesTerm([item.title, item.description, item.source], term)),
    [championshipNews, term],
  )

  const filteredChampionshipMatches = useMemo(
    () => championshipMatches.filter((match) => includesTerm([
      match.videogame,
      match.league,
      match.serie,
      match.tournament,
      ...(match.opponents || []).map((team) => team.name),
    ], term)),
    [championshipMatches, term],
  )

  const filteredEsportsNews = useMemo(
    () => payload.esportsNews.filter((item) => includesTerm([item.title, item.description, item.source], term)),
    [payload.esportsNews, term],
  )

  const featured = payload.featured || radarItems[0] || null

  function renderFilteredContent() {
    if (activeFilter === 'releases') {
      return filteredReleases.length
        ? <div className="games-page__source-grid">{filteredReleases.map((game) => <ReleaseCard key={game.id} game={game} />)}</div>
        : <EmptyPanel title="Nenhum lançamento encontrado." description="Tente outro termo de busca." />
    }

    if (activeFilter === 'free') {
      if (filteredFreeGames.length) {
        return <div className="games-page__source-grid">{filteredFreeGames.map((item) => <FreeGameCard key={item.id} item={item} />)}</div>
      }

      const matchingFreeNews = freeNews.filter((item) => includesTerm([item.title, item.description, item.source], term))
      return matchingFreeNews.length
        ? <div className="games-page__grid">{matchingFreeNews.map((item) => <NewsCard key={item.id} item={item} />)}</div>
        : <EmptyPanel title="Nenhuma oferta encontrada para esta busca." description="Tente outro termo." />
    }

    if (activeFilter === 'esports') {
      if (filteredEsports.length) {
        return <div className="games-page__esports-grid">{filteredEsports.map((match) => <EsportsMatchCard key={match.id} match={match} />)}</div>
      }
      return filteredEsportsNews.length
        ? <div className="games-page__grid">{filteredEsportsNews.map((item) => <NewsCard key={item.id} item={item} />)}</div>
        : <EmptyPanel title="Nenhum conteúdo de Esports encontrado." description="Assim que houver partidas ou notícias, elas aparecem aqui." />
    }

    if (activeFilter === 'championships') {
      if (filteredChampionshipMatches.length) {
        return <div className="games-page__championship-list">{filteredChampionshipMatches.map((match) => <ChampionshipRow key={match.id} match={match} />)}</div>
      }
      return filteredChampionshipNews.length
        ? <div className="games-page__grid">{filteredChampionshipNews.map((item) => <NewsCard key={item.id} item={item} />)}</div>
        : <EmptyPanel title="Nenhum campeonato encontrado para esta busca." description="Tente outro termo." />
    }

    return filteredNews.length
      ? <div className="games-page__grid">{filteredNews.map((item) => <NewsCard key={item.id} item={item} />)}</div>
      : <EmptyPanel title="Nenhum resultado encontrado." description="Tente outro termo de busca." />
  }

  return (
    <main className="games-page">
      <header className="games-page__hero">
        <div className="games-page__hero-copy">
          <span>IMORTAL0800</span>
          <h1>Games</h1>
          <p>Esports, lançamentos, campeonatos, novidades e jogos grátis reunidos em uma central atualizada automaticamente.</p>

          <div className="games-page__hero-actions">
            <ActionButton icon={<Gamepad2 size={17} />} onClick={() => setActiveFilter('all')}>
              Explorar Games
            </ActionButton>
            <ActionButton variant="outline" icon={<RefreshCw size={16} />} onClick={loadGames}>
              Atualizar
            </ActionButton>
          </div>
        </div>

        <div className="games-page__hero-art" aria-hidden="true">
          <div><Swords size={28} /><span>ESPORTS</span></div>
          <div><Rocket size={28} /><span>LANÇAMENTOS</span></div>
          <div><Gift size={28} /><span>JOGOS GRÁTIS</span></div>
        </div>
      </header>

      <section className="games-page__toolbar" aria-label="Filtros de Games">
        <div className="games-page__filters">
          {FILTERS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={activeFilter === id ? 'is-active' : ''}
              onClick={() => setActiveFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="games-page__search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            placeholder="Buscar em Games..."
            aria-label="Buscar em Games"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {warnings.length ? (
        <div className="games-page__notice" role="status">
          Algumas fontes estão temporariamente indisponíveis: {warnings.join(', ')}.
        </div>
      ) : null}

      {loading ? (
        <div className="games-page__loading">Carregando central de Games...</div>
      ) : (
        <>
          <section className="games-page__featured-grid">
            <div className="games-page__featured">
              <div className="games-page__section-title">
                <div>
                  <span>Destaque</span>
                  <h2>Agora em Games</h2>
                </div>
              </div>

              {featured ? (
                <button className="games-page__featured-card" type="button" onClick={() => openExternal(featured.url)}>
                  <GameCover item={featured} className="games-page__featured-cover" />
                  <span className="games-page__featured-copy">
                    <span className="games-page__meta">
                      {featured.source ? <span>{featured.source}</span> : null}
                      {formatDate(featured.publishedAt) ? <span>{formatDate(featured.publishedAt)}</span> : null}
                    </span>
                    <strong>{featured.title}</strong>
                    {featured.description ? <p>{featured.description}</p> : null}
                  </span>
                </button>
              ) : (
                <EmptyPanel title="Nenhum destaque disponível." description="Assim que houver conteúdo sincronizado, ele aparece aqui." />
              )}
            </div>

            <aside className="games-page__quick">
              <div className="games-page__quick-item">
                <Swords size={20} />
                <div><strong>Esports</strong><span>{payload.esports.running.length} ao vivo agora</span></div>
              </div>
              <div className="games-page__quick-item">
                <Rocket size={20} />
                <div><strong>Lançamentos</strong><span>{payload.releases.length} próximos jogos</span></div>
              </div>
              <div className="games-page__quick-item">
                <Trophy size={20} />
                <div><strong>Campeonatos</strong><span>{championshipMatches.length || championshipNews.length} em destaque</span></div>
              </div>
              <div className="games-page__quick-item">
                <Gift size={20} />
                <div><strong>Jogos grátis</strong><span>{payload.freeGames.length} ofertas ativas</span></div>
              </div>
            </aside>
          </section>

          {search || activeFilter !== 'all' ? (
            <section className="games-page__section">
              <div className="games-page__section-title">
                <div>
                  <span><Search size={15} /> Resultados</span>
                  <h2>{FILTERS.find(([id]) => id === activeFilter)?.[1] || 'Tudo'}</h2>
                </div>
              </div>
              {renderFilteredContent()}
            </section>
          ) : null}

          <section className="games-page__section">
            <div className="games-page__section-title">
              <div>
                <span><Swords size={15} /> Competitivo</span>
                <h2>Esports</h2>
              </div>
              <button type="button" onClick={() => setActiveFilter('esports')}>Ver Esports</button>
            </div>
            {esportsMatches.length ? (
              <div className="games-page__esports-grid">
                {esportsMatches.slice(0, 3).map((match) => <EsportsMatchCard key={match.id} match={match} />)}
              </div>
            ) : payload.esportsNews.length ? (
              <div className="games-page__grid">
                {payload.esportsNews.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            ) : (
              <EmptyPanel title="Sem novidades de Esports agora." description="As partidas aparecem quando a PandaScore estiver disponível; notícias continuam como fallback." />
            )}
          </section>

          <section className="games-page__section">
            <div className="games-page__section-title">
              <div>
                <span><Rocket size={15} /> Calendário</span>
                <h2>Próximos lançamentos</h2>
              </div>
              <a className="games-page__attribution" href="https://rawg.io/" target="_blank" rel="noreferrer">
                RAWG <ExternalLink size={12} />
              </a>
            </div>
            {payload.releases.length ? (
              <div className="games-page__source-grid">
                {payload.releases.slice(0, 6).map((game) => <ReleaseCard key={game.id} game={game} />)}
              </div>
            ) : payload.releasesNews.length ? (
              <div className="games-page__grid">
                {payload.releasesNews.slice(0, 6).map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="games-page__grid">
                {radarItems.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          <section className="games-page__section">
            <div className="games-page__section-title">
              <div>
                <span><Gift size={15} /> Gratuitos</span>
                <h2>Jogos grátis</h2>
              </div>
              <a className="games-page__attribution" href="https://www.gamerpower.com/" target="_blank" rel="noreferrer">
                GamerPower <ExternalLink size={12} />
              </a>
            </div>
            {payload.freeGames.length ? (
              <div className="games-page__source-grid">
                {payload.freeGames.slice(0, 6).map((item) => <FreeGameCard key={item.id} item={item} />)}
              </div>
            ) : freeNews.length ? (
              <div className="games-page__grid">
                {freeNews.slice(0, 6).map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="games-page__grid">
                {radarItems.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            )}
          </section>

          <section className="games-page__two-columns">
            <div className="games-page__section">
              <div className="games-page__section-title">
                <div>
                  <span><Trophy size={15} /> Destaques</span>
                  <h2>Campeonatos</h2>
                </div>
              </div>
              {championshipMatches.length ? (
                <div className="games-page__championship-list">
                  {championshipMatches.slice(0, 5).map((match) => <ChampionshipRow key={match.id} match={match} />)}
                </div>
              ) : (
                <div className="games-page__list">
                  {championshipNews.slice(0, 5).map((item) => <NewsCard key={item.id} item={item} compact />)}
                </div>
              )}
            </div>

            <div className="games-page__section">
              <div className="games-page__section-title">
                <div>
                  <span><Newspaper size={15} /> Radar gamer</span>
                  <h2>Últimas notícias</h2>
                </div>
              </div>
              <div className="games-page__list">
                {radarItems.slice(0, 5).map((item) => <NewsCard key={item.id} item={item} compact />)}
              </div>
            </div>
          </section>

          <div className="games-page__sources-note">
            <CalendarDays size={14} />
            <span>Dados de lançamentos por RAWG, ofertas por GamerPower e partidas de esports por PandaScore.</span>
          </div>
        </>
      )}
    </main>
  )
}
