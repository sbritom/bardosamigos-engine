import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ExternalLink,
  Newspaper,
  Search,
  X,
} from 'lucide-react'

import { WorkspaceEmptyState, WorkspaceSkeleton } from '../../../shared/workspace'
import { listNewsPageContent } from '../../../apps/portal/home/services/homeContentService'
import './newsPage.css'

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
}

function NewsCover({ item, className = '' }) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={`Imagem da notícia: ${item.title}`}
        className={`news-page__cover ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(event) => {
          event.currentTarget.style.display = 'none'
          event.currentTarget.nextElementSibling?.removeAttribute('hidden')
        }}
      />
    )
  }

  return <div className={`news-page__cover news-page__cover--fallback ${className}`}>IMORTAL0800</div>
}

function NewsCoverSafe({ item, className = '' }) {
  if (!item.image) return <NewsCover item={item} className={className} />

  return (
    <span className={`news-page__cover-shell ${className}`}>
      <NewsCover item={item} className="news-page__cover-image" />
      <span className="news-page__cover news-page__cover--fallback news-page__cover-fallback" hidden>
        IMORTAL0800
      </span>
    </span>
  )
}

function getArticleSummary(item) {
  return item.summary || item.description || item.excerpt || item.contentSnippet || ''
}

function getArticleContent(item) {
  return item.content || item.body || item.text || getArticleSummary(item)
}

function getArticleUrl(item) {
  return item.url || item.link || item.originalUrl || item.externalUrl || ''
}

function NewsMeta({ item }) {
  return (
    <div className="news-page__meta-row">
      {item.category ? <strong>{item.category}</strong> : null}
      {item.source ? <span>{item.source}</span> : null}
      {item.date ? <span>{item.date}</span> : null}
    </div>
  )
}

function FeaturedStory({ item, onOpen }) {
  if (!item) return null

  return (
    <button
      type="button"
      className="news-page__featured"
      onClick={() => onOpen(item)}
      aria-label={`Abrir notícia: ${item.title}`}
    >
      <NewsCoverSafe item={item} className="news-page__featured-cover" />
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
    <button
      type="button"
      className="news-page__row"
      onClick={() => onOpen(item)}
      aria-label={`Abrir notícia: ${item.title}`}
    >
      <NewsCoverSafe item={item} className="news-page__row-cover" />
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
    <article className="news-page__reader" aria-labelledby="news-reader-title">
      <div className="news-page__reader-actions">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={15} />
          Voltar
        </button>

        {url ? (
          <button type="button" className="is-primary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink size={15} />
            Abrir fonte
          </button>
        ) : null}
      </div>

      <NewsCoverSafe item={item} className="news-page__reader-cover" />
      <NewsMeta item={item} />
      <h2 id="news-reader-title">{item.title}</h2>
      {content ? <p>{content}</p> : null}
    </article>
  )
}

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState(['Todas'])
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadNews() {
      try {
        const result = await listNewsPageContent()
        if (!active) return

        setNews(Array.isArray(result.data) ? result.data : [])
        setCategories(Array.isArray(result.categories) && result.categories.length ? result.categories : ['Todas'])
        setError(result.error || null)
      } catch (loadError) {
        if (!active) return
        setNews([])
        setCategories(['Todas'])
        setError(loadError)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNews()
    return () => { active = false }
  }, [])

  const filteredNews = useMemo(() => {
    const term = normalizeText(search)

    return news.filter((item) => {
      const matchesCategory = activeCategory === 'Todas' || item.category === activeCategory
      if (!matchesCategory) return false
      if (!term) return true

      return normalizeText([
        item.title,
        item.source,
        item.category,
        getArticleSummary(item),
      ].filter(Boolean).join(' ')).includes(term)
    })
  }, [activeCategory, news, search])

  const featured = filteredNews[0]
  const latest = filteredNews.slice(1)
  const visibleLatest = showAll || search || activeCategory !== 'Todas' ? latest : latest.slice(0, 4)

  function changeCategory(category) {
    setActiveCategory(category)
    setShowAll(false)
    setSelectedArticle(null)
  }

  function clearSearch() {
    setSearch('')
    setShowAll(false)
    setSelectedArticle(null)
  }

  return (
    <main className="news-page" aria-busy={loading}>
      <header className="news-page__header">
        <div className="news-page__header-copy">
          <span>
            <Newspaper size={15} />
            NOTÍCIAS
          </span>
          <p>Informação e destaques em uma leitura simples e organizada.</p>
        </div>

        <label className="news-page__search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Pesquisar notícias..."
            aria-label="Pesquisar notícias"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setShowAll(false)
              setSelectedArticle(null)
            }}
          />
          {search ? (
            <button type="button" aria-label="Limpar pesquisa" onClick={clearSearch}>
              <X size={15} />
            </button>
          ) : null}
        </label>
      </header>

      {!loading && categories.length > 1 ? (
        <nav className="news-page__categories" aria-label="Categorias de notícias">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === activeCategory ? 'is-active' : ''}
              onClick={() => changeCategory(category)}
            >
              {category}
            </button>
          ))}
        </nav>
      ) : null}

      {loading ? <WorkspaceSkeleton rows={4} /> : null}

      {!loading && error ? (
        <div className="news-page__notice" role="status" aria-live="polite">
          {news.length
            ? 'Exibindo as notícias disponíveis enquanto a fonte principal é atualizada.'
            : 'Não foi possível carregar as notícias agora. Tente novamente mais tarde.'}
        </div>
      ) : null}

      {!loading && selectedArticle ? (
        <NewsReader item={selectedArticle} onBack={() => setSelectedArticle(null)} />
      ) : !loading && filteredNews.length ? (
        <section className="news-page__content" aria-label="Lista de notícias">
          <FeaturedStory item={featured} onOpen={setSelectedArticle} />

          <div className="news-page__latest">
            <div className="news-page__section-heading">
              <div>
                <h2>Últimas notícias</h2>
                <span>{filteredNews.length} {filteredNews.length === 1 ? 'matéria disponível' : 'matérias disponíveis'}</span>
              </div>

              {!search && activeCategory === 'Todas' && latest.length > 4 ? (
                <button type="button" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>
                  {showAll ? 'Mostrar menos' : 'Ver todas'}
                </button>
              ) : null}
            </div>

            <div className={`news-page__list ${showAll || search || activeCategory !== 'Todas' ? 'news-page__list--expanded' : ''}`}>
              {visibleLatest.map((item) => (
                <NewsRow key={item.id} item={item} onOpen={setSelectedArticle} />
              ))}
            </div>
          </div>
        </section>
      ) : !loading ? (
        <WorkspaceEmptyState title={search ? 'Nenhuma notícia encontrada.' : 'Nenhuma notícia disponível.'} />
      ) : null}
    </main>
  )
}
