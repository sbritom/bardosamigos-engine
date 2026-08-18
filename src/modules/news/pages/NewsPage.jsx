import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../../../design-system'
import { WorkspaceEmptyState, WorkspaceSkeleton } from '../../../shared/workspace'
import { StatusPill } from '../../../apps/portal/home/components/StatusPill'
import { listNewsPageContent } from '../../../apps/portal/home/services/homeContentService'
import './newsPage.css'

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

function NewsCover({ item, className = '' }) {
  if (item.image) return <img src={item.image} alt={`Imagem da notícia: ${item.title}`} className={`news-page__cover ${className}`} loading="lazy" />
  return <div className={`news-page__cover news-page__cover--fallback ${className}`}>Bar dos Amigos</div>
}

function getArticleSummary(item) { return item.summary || item.description || item.excerpt || item.contentSnippet || '' }
function getArticleContent(item) { return item.content || item.body || item.text || getArticleSummary(item) }
function getArticleUrl(item) { return item.url || item.link || item.originalUrl || item.externalUrl || '' }

function NewsMeta({ item }) {
  return (
    <div className="news-page__meta-row">
      {item.category ? <StatusPill>{item.category}</StatusPill> : null}
      {item.source ? <span>{item.source}</span> : null}
      {item.date ? <span>{item.date}</span> : null}
    </div>
  )
}

function FeaturedStory({ item, onOpen }) {
  if (!item) return null
  return (
    <button type="button" className="news-page__featured" onClick={() => onOpen(item)}>
      <NewsCover item={item} className="news-page__featured-cover" />
      <span className="news-page__featured-copy">
        <NewsMeta item={item} />
        <strong>{item.title}</strong>
        {getArticleSummary(item) ? <span>{getArticleSummary(item)}</span> : null}
      </span>
    </button>
  )
}

function NewsRow({ item, onOpen }) {
  return (
    <button type="button" className="news-page__row" onClick={() => onOpen(item)}>
      <NewsCover item={item} className="news-page__row-cover" />
      <span className="news-page__row-copy">
        <NewsMeta item={item} />
        <strong>{item.title}</strong>
      </span>
    </button>
  )
}

function NewsReader({ item, onBack }) {
  const content = getArticleContent(item)
  const url = getArticleUrl(item)
  return (
    <article className="news-page__reader">
      <div className="news-page__reader-actions">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        {url ? <Button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>Abrir original</Button> : null}
      </div>
      <NewsCover item={item} className="news-page__reader-cover" />
      <NewsMeta item={item} />
      <h2>{item.title}</h2>
      {content ? <p>{content}</p> : null}
    </article>
  )
}

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    async function loadNews() {
      const result = await listNewsPageContent()
      if (!active) return
      setNews(result.data || [])
      setError(result.error)
      setLoading(false)
    }
    loadNews()
    return () => { active = false }
  }, [])

  const filteredNews = useMemo(() => {
    const term = normalizeText(search)
    if (!term) return news
    return news.filter((item) => normalizeText([
      item.title,
      item.source,
      item.category,
      getArticleSummary(item),
    ].filter(Boolean).join(' ')).includes(term))
  }, [news, search])

  const featured = filteredNews[0]
  const latest = filteredNews.slice(1)
  const visibleLatest = showAll || search ? latest : latest.slice(0, 4)

  return (
    <main className="news-page">
      <header className="news-page__header">
        <div>
          <span>Informação</span>
          <h1>Notícias</h1>
          <p>Principais destaques em uma leitura simples e organizada.</p>
        </div>
        <label className="news-page__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Pesquisar notícias..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setShowAll(false)
              setSelectedArticle(null)
            }}
          />
        </label>
      </header>

      {loading ? <WorkspaceSkeleton rows={4} /> : null}
      {!loading && error ? <div className="news-page__notice">Exibindo conteúdo local enquanto a fonte principal fica indisponível.</div> : null}

      {!loading && selectedArticle ? (
        <NewsReader item={selectedArticle} onBack={() => setSelectedArticle(null)} />
      ) : !loading && filteredNews.length ? (
        <section className="news-page__content">
          <FeaturedStory item={featured} onOpen={setSelectedArticle} />
          <div className="news-page__latest">
            <div className="news-page__section-heading">
              <div>
                <h2>Últimas notícias</h2>
                <span>{filteredNews.length} matérias disponíveis</span>
              </div>
              {!search && latest.length > 4 ? (
                <Button variant="secondary" onClick={() => setShowAll((value) => !value)}>
                  {showAll ? 'Mostrar menos' : 'Ver todas'}
                </Button>
              ) : null}
            </div>
            <div className={`news-page__list ${showAll || search ? 'news-page__list--expanded' : ''}`}>
              {visibleLatest.map((item) => <NewsRow key={item.id} item={item} onOpen={setSelectedArticle} />)}
            </div>
          </div>
        </section>
      ) : !loading ? (
        <WorkspaceEmptyState title={search ? 'Nenhuma notícia encontrada.' : 'Nenhuma notícia disponível.'} />
      ) : null}
    </main>
  )
}
