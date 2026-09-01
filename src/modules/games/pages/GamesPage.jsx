import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
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

function isChampionship(item = {}) {
  return /campeonato|torneio|liga|final|mundial|qualificat|circuito|copa/.test(
    normalize(`${item.title} ${item.description}`)
  )
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date)
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

function openArticle(item) {
  if (!item?.url) return
  window.open(item.url, '_blank', 'noopener,noreferrer')
}

function NewsCard({ item, compact = false }) {
  return (
    <button
      className={compact ? 'games-page__news-card is-compact' : 'games-page__news-card'}
      type="button"
      onClick={() => openArticle(item)}
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
    items: [],
    featured: null,
    esports: [],
    releases: [],
    free: [],
  })
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadGames() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/games', {
        headers: { Accept: 'application/json' },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar Games.')
      setPayload({
        items: Array.isArray(data.items) ? data.items : [],
        featured: data.featured || null,
        esports: Array.isArray(data.esports) ? data.esports : [],
        releases: Array.isArray(data.releases) ? data.releases : [],
        free: Array.isArray(data.free) ? data.free : [],
      })
    } catch (loadError) {
      setError(loadError)
      setPayload({ items: [], featured: null, esports: [], releases: [], free: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
  }, [])

  const championships = useMemo(
    () => payload.items.filter(isChampionship).slice(0, 6),
    [payload.items],
  )

  const filteredItems = useMemo(() => {
    const term = normalize(search)
    let items = payload.items

    if (activeFilter === 'esports') items = payload.esports
    if (activeFilter === 'releases') items = payload.releases
    if (activeFilter === 'championships') items = championships
    if (activeFilter === 'free') items = payload.free

    if (!term) return items

    return items.filter((item) => normalize(
      [item.title, item.description, item.source].filter(Boolean).join(' ')
    ).includes(term))
  }, [activeFilter, championships, payload, search])

  const featured = search || activeFilter !== 'all'
    ? filteredItems[0] || null
    : payload.featured

  return (
    <main className="games-page">
      <header className="games-page__hero">
        <div className="games-page__hero-copy">
          <span>IMORTAL0800</span>
          <h1>Games</h1>
          <p>Esports, lançamentos, notícias rápidas, campeonatos e jogos gratuitos em um só lugar.</p>

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
          <div><Trophy size={28} /><span>CAMPEONATOS</span></div>
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

      {error ? (
        <div className="games-page__notice" role="status">
          A fonte de Games está indisponível agora. Você pode tentar atualizar novamente.
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
                  <h2>{activeFilter === 'all' ? 'Agora em Games' : FILTERS.find(([id]) => id === activeFilter)?.[1]}</h2>
                </div>
              </div>

              {featured ? (
                <button className="games-page__featured-card" type="button" onClick={() => openArticle(featured)}>
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
                <div><strong>Esports</strong><span>{payload.esports.length} destaques recentes</span></div>
              </div>
              <div className="games-page__quick-item">
                <Rocket size={20} />
                <div><strong>Lançamentos</strong><span>{payload.releases.length} novidades recentes</span></div>
              </div>
              <div className="games-page__quick-item">
                <Trophy size={20} />
                <div><strong>Campeonatos</strong><span>{championships.length} conteúdos encontrados</span></div>
              </div>
              <div className="games-page__quick-item">
                <Gift size={20} />
                <div><strong>Jogos grátis</strong><span>{payload.free.length} oportunidades recentes</span></div>
              </div>
            </aside>
          </section>

          <section className="games-page__section">
            <div className="games-page__section-title">
              <div>
                <span><Swords size={15} /> Competitivo</span>
                <h2>Esports</h2>
              </div>
              <button type="button" onClick={() => setActiveFilter('esports')}>Ver Esports</button>
            </div>
            {payload.esports.length ? (
              <div className="games-page__grid">
                {payload.esports.slice(0, 3).map((item) => <NewsCard key={item.id} item={item} />)}
              </div>
            ) : (
              <EmptyPanel title="Sem novidades de Esports agora." description="A seção será preenchida automaticamente quando surgirem novos conteúdos." />
            )}
          </section>

          <section className="games-page__section">
            <div className="games-page__section-title">
              <div>
                <span><Trophy size={15} /> Destaques</span>
                <h2>Campeonatos</h2>
              </div>
              <button type="button" onClick={() => setActiveFilter('championships')}>Ver campeonatos</button>
            </div>
            {championships.length ? (
              <div className="games-page__list">
                {championships.slice(0, 4).map((item) => <NewsCard key={item.id} item={item} compact />)}
              </div>
            ) : (
              <EmptyPanel title="Nenhum campeonato em destaque agora." description="Não vamos inventar eventos: os destaques aparecem quando houver notícias sincronizadas." />
            )}
          </section>

          <section className="games-page__two-columns">
            <div className="games-page__section">
              <div className="games-page__section-title">
                <div>
                  <span><Newspaper size={15} /> Radar gamer</span>
                  <h2>Lançamentos & notícias</h2>
                </div>
              </div>
              {payload.items.length ? (
                <div className="games-page__list">
                  {payload.items.slice(0, 5).map((item) => <NewsCard key={item.id} item={item} compact />)}
                </div>
              ) : (
                <EmptyPanel title="Sem notícias disponíveis." description="Tente atualizar novamente em alguns instantes." />
              )}
            </div>

            <div className="games-page__section">
              <div className="games-page__section-title">
                <div>
                  <span><Gift size={15} /> Gratuitos</span>
                  <h2>Jogos grátis</h2>
                </div>
              </div>
              {payload.free.length ? (
                <div className="games-page__list">
                  {payload.free.slice(0, 5).map((item) => <NewsCard key={item.id} item={item} compact />)}
                </div>
              ) : (
                <EmptyPanel title="Nenhum jogo gratuito detectado agora." description="Novas ofertas e anúncios aparecem aqui quando forem publicados." />
              )}
            </div>
          </section>

          {search || activeFilter !== 'all' ? (
            <section className="games-page__section">
              <div className="games-page__section-title">
                <div>
                  <span><CalendarDays size={15} /> Resultados</span>
                  <h2>Conteúdo filtrado</h2>
                </div>
              </div>
              {filteredItems.length ? (
                <div className="games-page__grid">
                  {filteredItems.map((item) => <NewsCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptyPanel title="Nenhum resultado encontrado." description="Tente outro filtro ou termo de busca." />
              )}
            </section>
          ) : null}
        </>
      )}
    </main>
  )
}
