import { useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, Input, Loading, Select } from '../../../design-system'
import { DashboardCard } from '../../../apps/portal/home/components/DashboardCard'
import { StatusPill } from '../../../apps/portal/home/components/StatusPill'
import { listNewsPageContent } from '../../../apps/portal/home/services/homeContentService'

const PAGE_SIZE = 6

function NewsCover({ item }) {
  if (item.image) {
    return <img src={item.image} alt="" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
  }

  return (
    <div className="flex h-40 w-full items-center justify-center rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] text-2xl font-black text-[var(--bds-color-primary-hover)]">
      Bar dos Amigos
    </div>
  )
}

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [categories, setCategories] = useState(['Todas'])
  const [category, setCategory] = useState('Todas')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
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

  const filteredNews = useMemo(() => {
    const term = search.trim().toLowerCase()

    return news.filter((item) => {
      const matchesCategory = category === 'Todas' || item.category === category
      const matchesSearch = !term || item.title.toLowerCase().includes(term)
      return matchesCategory && matchesSearch
    })
  }, [category, news, search])
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / PAGE_SIZE))
  const paginatedNews = filteredNews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function updateSearch(value) {
    setSearch(value)
    setPage(1)
  }

  function updateCategory(value) {
    setCategory(value)
    setPage(1)
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-6">
      <DashboardCard
        title="Noticias"
        eyebrow="Conteudo oficial"
        action={<Button onClick={() => { window.location.href = '/' }}>Voltar para Home</Button>}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <Input
            id="news-search"
            label="Pesquisar"
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Buscar noticias"
            value={search}
          />
          <Select
            id="news-category"
            label="Categoria"
            onChange={(event) => updateCategory(event.target.value)}
            options={categories.map((item) => ({ label: item, value: item }))}
            value={category}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-3 text-sm text-[var(--bds-color-text-secondary)]">
            Exibindo conteudo local enquanto a fonte principal fica indisponivel.
          </div>
        )}

        {loading ? (
          <div className="mt-6">
            <Loading label="Carregando noticias" />
          </div>
        ) : filteredNews.length ? (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedNews.map((item) => (
                <article key={item.id} className="rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-3">
                  <NewsCover item={item} />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill>{item.category}</StatusPill>
                    <span className="text-xs text-[var(--bds-color-text-secondary)]">{item.date}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-black">{item.title}</h2>
                </article>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--bds-color-border)] bg-[var(--bds-color-surface)] p-3 text-sm">
              <span className="font-bold text-[var(--bds-color-text-secondary)]">
                Pagina {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button disabled={page <= 1} variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Anterior
                </Button>
                <Button disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Proxima
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <EmptyState title="Nenhuma noticia encontrada" description="Ajuste os filtros para ver outros conteudos." />
          </div>
        )}
      </DashboardCard>
    </main>
  )
}
