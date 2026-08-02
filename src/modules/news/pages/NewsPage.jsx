import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Flame, Globe2, Laptop, Music, Newspaper, Play, Trophy } from 'lucide-react'
import { Button, EmptyState } from '../../../design-system'
import { PortalWorkspace, WorkspaceEmptyState, WorkspaceSearch, WorkspaceSkeleton } from '../../../shared/workspace'
import { StatusPill } from '../../../apps/portal/home/components/StatusPill'
import { listNewsPageContent } from '../../../apps/portal/home/services/homeContentService'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function NewsCover({ item, className = 'h-40' }) {
  if (item.image) {
    return <img src={item.image} alt={`Imagem da noticia: ${item.title}`} className={`${className} w-full rounded-[var(--bds-radius-md)] object-cover`} loading="lazy" />
  }

  return (
    <div className={`${className} flex w-full items-center justify-center rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] text-2xl font-black text-[var(--bds-color-primary-hover)]`}>
      Bar dos Amigos
    </div>
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

function NewsListItem({ item, onOpen, featured = false }) {
  const summary = getArticleSummary(item)

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`grid w-full gap-[var(--bds-space-12)] rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-[var(--bds-space-12)] text-left transition hover:border-[var(--bds-color-primary-hover)] hover:bg-[var(--bds-color-background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bds-color-primary-hover)] ${featured ? 'md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]' : 'sm:grid-cols-[9rem_minmax(0,1fr)]'}`}
    >
      <NewsCover item={item} className={featured ? 'h-56' : 'h-28'} />
      <span className="grid min-w-0 content-start gap-[var(--bds-space-8)]">
        <span className="flex flex-wrap items-center gap-[var(--bds-space-8)]">
          {item.category ? <StatusPill>{item.category}</StatusPill> : null}
          {item.source ? <span className="text-xs font-bold text-[var(--bds-color-text-secondary)]">{item.source}</span> : null}
          {item.date ? <span className="text-xs text-[var(--bds-color-text-secondary)]">{item.date}</span> : null}
        </span>
        <strong className={`${featured ? 'text-2xl' : 'text-base'} line-clamp-2 font-black leading-tight text-[var(--bds-color-text)]`}>
          {item.title}
        </strong>
        {summary ? <span className="line-clamp-3 text-sm leading-relaxed text-[var(--bds-color-text-secondary)]">{summary}</span> : null}
      </span>
    </button>
  )
}

function NewsList({ items, onOpen, emptyTitle }) {
  if (!items.length) return <WorkspaceEmptyState title={emptyTitle} />

  return (
    <div className="grid gap-[var(--bds-space-12)]">
      {items.map((item) => <NewsListItem key={item.id} item={item} onOpen={onOpen} />)}
    </div>
  )
}

function FeaturedNews({ items, onOpen }) {
  const [main, ...rest] = items

  if (!main) return <WorkspaceEmptyState title="Nenhuma noticia em destaque." />

  return (
    <div className="grid gap-[var(--bds-space-14)]">
      <NewsListItem item={main} onOpen={onOpen} featured />
      {rest.length ? (
        <div className="grid gap-[var(--bds-space-12)] md:grid-cols-2">
          {rest.slice(0, 4).map((item) => <NewsListItem key={item.id} item={item} onOpen={onOpen} />)}
        </div>
      ) : null}
    </div>
  )
}

function NewsReader({ item, onBack }) {
  const content = getArticleContent(item)
  const url = getArticleUrl(item)

  return (
    <article className="grid gap-[var(--bds-space-16)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--bds-space-10)]">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        {url ? (
          <Button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            Abrir original
          </Button>
        ) : null}
      </div>
      <NewsCover item={item} className="h-72" />
      <header className="grid gap-[var(--bds-space-8)]">
        <div className="flex flex-wrap items-center gap-[var(--bds-space-8)]">
          {item.category ? <StatusPill>{item.category}</StatusPill> : null}
          {item.source ? <span className="text-sm font-bold text-[var(--bds-color-text-secondary)]">{item.source}</span> : null}
          {item.date ? <span className="text-sm text-[var(--bds-color-text-secondary)]">{item.date}</span> : null}
        </div>
        <h2 className="m-0 text-3xl font-black leading-tight text-[var(--bds-color-text)]">{item.title}</h2>
      </header>
      {content ? <p className="m-0 whitespace-pre-line text-base leading-relaxed text-[var(--bds-color-text-secondary)]">{content}</p> : null}
    </article>
  )
}

const sidebarTemplate = [
  { id: 'featured', name: 'Destaques', icon: Flame },
  { id: 'latest', name: 'Ultimas Noticias', icon: Newspaper },
  { id: 'football', name: 'Futebol', icon: Trophy, aliases: ['futebol', 'football', 'esporte', 'sports'] },
  { id: 'brasil', name: 'Brasil', icon: CalendarDays, aliases: ['brasil', 'brazil'] },
  { id: 'mundo', name: 'Mundo', icon: Globe2, aliases: ['mundo', 'world', 'internacional'] },
  { id: 'tecnologia', name: 'Tecnologia', icon: Laptop, aliases: ['tecnologia', 'technology', 'tech'] },
  { id: 'entretenimento', name: 'Entretenimento', icon: Play, aliases: ['entretenimento', 'entertainment', 'cultura'] },
  { id: 'musica', name: 'Musica', icon: Music, aliases: ['musica', 'music'] },
]

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState(['Todas'])
  const [activeView, setActiveView] = useState('featured')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    async function loadNews() {
      const result = await listNewsPageContent()
      if (!active) return

      setNews(result.data)
      setCategories(result.categories)
      setError(result.error)
      setLoading(false)
    }

    loadNews()

    return () => {
      active = false
    }
  }, [])

  const existingCategoryKeys = useMemo(() => new Set(categories.map(normalizeText)), [categories])
  const sidebarItems = useMemo(() => sidebarTemplate.map((item) => {
    if (item.id === 'featured' || item.id === 'latest') return { ...item, badge: news.length || undefined }

    const aliases = item.aliases || [item.name]
    const count = news.filter((article) => aliases.some((alias) => normalizeText(article.category).includes(normalizeText(alias)))).length
    const exists = aliases.some((alias) => existingCategoryKeys.has(normalizeText(alias)))
    return { ...item, badge: count || undefined, status: exists ? undefined : 'Vazio' }
  }), [existingCategoryKeys, news])

  const searchedNews = useMemo(() => {
    const term = normalizeText(search)
    if (!term) return news
    return news.filter((item) => normalizeText([item.title, item.source, item.category, getArticleSummary(item)].filter(Boolean).join(' ')).includes(term))
  }, [news, search])

  const viewNews = useMemo(() => {
    if (activeView === 'featured') return searchedNews.slice(0, 5)
    if (activeView === 'latest') return searchedNews

    const view = sidebarTemplate.find((item) => item.id === activeView)
    const aliases = view?.aliases || []
    return searchedNews.filter((item) => aliases.some((alias) => normalizeText(item.category).includes(normalizeText(alias))))
  }, [activeView, searchedNews])

  const activeSidebarItem = sidebarTemplate.find((item) => item.id === activeView)
  const activeTitle = selectedArticle ? 'Leitura' : activeSidebarItem?.name || 'Noticias'
  const activeDescription = selectedArticle ? 'Noticia aberta dentro do workspace.' : 'Conteudo carregado pela fonte atual de noticias.'

  function openArticle(item) {
    setSelectedArticle(item)
  }

  function selectView(item) {
    setActiveView(item.id)
    setSelectedArticle(null)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 pb-6">
        <WorkspaceSkeleton rows={6} />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-6">
      <PortalWorkspace
        hero={{
          eyebrow: 'Conteudo oficial',
          title: 'Noticias',
          subtitle: 'Acompanhe os principais destaques publicados para a comunidade.',
          action: <Button onClick={() => { window.location.href = '/' }}>Voltar para Home</Button>,
        }}
        header={{
          eyebrow: 'Notícias',
          title: activeTitle,
          description: activeDescription,
          search: (
            <WorkspaceSearch
              label="Pesquisar noticias"
              onChange={(event) => {
                setSearch(event.target.value)
                setSelectedArticle(null)
              }}
              placeholder="Buscar noticias"
              value={search}
            />
          ),
        }}
        sidebar={{
          title: 'Noticias',
          items: sidebarItems,
          selectedId: activeView,
          onSelect: selectView,
        }}
        content={{ title: activeTitle, description: activeDescription }}
      >
        {error ? (
          <div className="rounded-[var(--bds-radius-md)] border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-[var(--bds-space-12)] text-sm text-[var(--bds-color-text-secondary)]">
            Exibindo conteudo local enquanto a fonte principal fica indisponivel.
          </div>
        ) : null}

        {selectedArticle ? (
          <NewsReader item={selectedArticle} onBack={() => setSelectedArticle(null)} />
        ) : activeView === 'featured' ? (
          <FeaturedNews items={viewNews} onOpen={openArticle} />
        ) : (
          <NewsList items={viewNews} onOpen={openArticle} emptyTitle={search ? 'Nenhuma noticia encontrada.' : 'Nenhuma noticia nesta categoria.'} />
        )}

        {!news.length ? <EmptyState title="Nenhuma noticia disponivel" /> : null}
      </PortalWorkspace>
    </main>
  )
}
