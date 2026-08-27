import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Eye,
  Filter,
  Power,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react'
import {
  ActionButton,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingSkeleton,
  Modal,
  Pagination,
  Select,
  StatusBadge,
  Switch,
  Textarea,
} from '../../../design-system'
import { TV_ADMIN_PAGE_SIZE, TV_PROVIDERS } from '../constants'
import { TVCategoryService, TVChannelService, TVFeaturedService } from '../services'
import { slugifyTVValue } from '../utils'
import { TVChannelPreview } from './TVChannelPreview'
import { TVConfirmDialog } from './TVConfirmDialog'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  logo: '',
  provider: 'other',
  embedUrl: '',
  country: 'BR',
  language: 'pt-BR',
  featured: false,
  verified: false,
  enabled: true,
  displayOrder: 0,
}

const emptyFilters = {
  search: '',
  categoryId: '',
  provider: '',
  status: '',
  featured: '',
  verified: '',
  sortBy: 'display_order',
  ascending: true,
}

export function TVChannelManager({ createRequested, notify }) {
  const [channels, setChannels] = useState([])
  const [categories, setCategories] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [slugEdited, setSlugEdited] = useState(false)
  const [preview, setPreview] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [bulkCategory, setBulkCategory] = useState('')
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const loadCategories = useCallback(async () => {
    const response = await TVCategoryService.listAdmin()
    setCategories(response.data || [])
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const response = await TVChannelService.listAdmin({
      ...filters,
      page,
      pageSize: TV_ADMIN_PAGE_SIZE,
    })
    setChannels(response.data || [])
    setCount(response.count || 0)
    setError(response.error)
    setLoading(false)
  }, [filters, page])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const timeout = window.setTimeout(load, filters.search ? 250 : 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  const openForm = useCallback((channel = null) => {
    setEditing(channel)
    setForm(channel ? {
      name: channel.name,
      slug: channel.slug,
      description: channel.description || '',
      categoryId: channel.categoryId || '',
      logo: channel.logo || '',
      provider: channel.provider || 'other',
      embedUrl: channel.embedUrl || '',
      country: channel.country || '',
      language: channel.language || '',
      featured: Boolean(channel.featured),
      verified: Boolean(channel.verified),
      enabled: channel.enabled !== false,
      displayOrder: channel.displayOrder || 0,
    } : { ...emptyForm, displayOrder: count })
    setSlugEdited(Boolean(channel))
    setFormOpen(true)
  }, [count])

  useEffect(() => {
    if (createRequested) openForm()
  }, [createRequested, openForm])

  const categoryOptions = useMemo(() => [
    { value: '', label: 'Selecione uma categoria' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ], [categories])

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'name' && !slugEdited) next.slug = slugifyTVValue(value)
      return next
    })
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    const response = editing
      ? await TVChannelService.updateChannel(editing.id, form)
      : await TVChannelService.createChannel(form)
    if (!response.error && response.data?.id) {
      const featuredResponse = form.featured
        ? await TVFeaturedService.setFeatured(response.data.id, { priority: form.displayOrder })
        : await TVFeaturedService.removeFeatured(response.data.id)
      if (featuredResponse.error) response.error = featuredResponse.error
    }
    setSaving(false)
    if (response.error) {
      notify('error', 'Nao foi possivel salvar.', response.error.message)
      return
    }
    notify('success', editing ? 'Canal salvo com sucesso.' : 'Canal criado com sucesso.')
    setFormOpen(false)
    setEditing(null)
    setForm(emptyForm)
    await load()
  }

  async function quickUpdate(channel, payload, successMessage) {
    const response = await TVChannelService.updateChannelState(channel.id, payload)
    if (!response.error && Object.hasOwn(payload, 'featured')) {
      const featuredResponse = payload.featured
        ? await TVFeaturedService.setFeatured(channel.id, { priority: channel.displayOrder })
        : await TVFeaturedService.removeFeatured(channel.id)
      if (featuredResponse.error) {
        await TVChannelService.updateChannelState(channel.id, { featured: channel.featured })
        response.error = featuredResponse.error
      }
    }
    if (response.error) notify('error', 'Nao foi possivel salvar.', response.error.message)
    else {
      notify('success', successMessage)
      await load()
    }
  }

  async function duplicate(channel) {
    const response = await TVChannelService.duplicateChannel(channel)
    if (response.error) notify('error', 'Nao foi possivel duplicar.', response.error.message)
    else {
      notify('success', 'Canal duplicado como inativo.')
      await load()
    }
  }

  async function confirmDelete() {
    setSaving(true)
    const response = await TVChannelService.deleteChannel(deleting.id)
    setSaving(false)
    if (response.error) notify('error', 'Nao foi possivel excluir.', response.error.message)
    else {
      notify('success', 'Canal excluido.')
      setDeleting(null)
      await load()
    }
  }

  async function reorder(channel, direction) {
    const index = channels.findIndex((item) => item.id === channel.id)
    const target = index + direction
    if (target < 0 || target >= channels.length) return
    const reordered = [...channels]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const response = await TVChannelService.reorderChannels(
      reordered.map((item, offset) => ({
        id: item.id,
        order: (page - 1) * TV_ADMIN_PAGE_SIZE + offset,
      })),
    )
    if (response.error) notify('error', 'Nao foi possivel reordenar.', response.error.message)
    else {
      setChannels(reordered)
      notify('success', 'Alteracoes publicadas.')
    }
  }

  async function applyBulk() {
    if (!selected.length || !bulkAction) return
    if (bulkAction === 'delete') {
      setConfirmBulkDelete(true)
      return
    }
    let payload = {}
    if (bulkAction === 'enable') payload = { enabled: true }
    if (bulkAction === 'disable') payload = { enabled: false }
    if (bulkAction === 'verify') payload = { verified: true }
    if (bulkAction === 'feature') payload = { featured: true }
    if (bulkAction === 'unfeature') payload = { featured: false }
    if (bulkAction === 'move') {
      if (!bulkCategory) {
        notify('warning', 'Selecione uma categoria de destino.')
        return
      }
      payload = { categoryId: bulkCategory }
    }
    setSaving(true)
    const response = await TVChannelService.bulkUpdateChannels(selected, payload)
    if (!response.error && bulkAction === 'feature') {
      await Promise.all(selected.map((id, priority) => TVFeaturedService.setFeatured(id, { priority })))
    }
    if (!response.error && bulkAction === 'unfeature') {
      await Promise.all(selected.map((id) => TVFeaturedService.removeFeatured(id)))
    }
    setSaving(false)
    if (response.error) notify('error', 'Nao foi possivel atualizar os canais.', response.error.message)
    else {
      notify('success', `${selected.length} canal(is) atualizado(s).`)
      setSelected([])
      setBulkAction('')
      await load()
    }
  }

  async function deleteSelected() {
    setSaving(true)
    const responses = await Promise.all(selected.map((id) => TVChannelService.deleteChannel(id)))
    const failure = responses.find((response) => response.error)
    setSaving(false)
    if (failure) notify('error', 'Nao foi possivel excluir todos os canais.', failure.error.message)
    else {
      notify('success', `${selected.length} canal(is) excluido(s).`)
      setSelected([])
      setConfirmBulkDelete(false)
      await load()
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / TV_ADMIN_PAGE_SIZE))
  const allSelected = channels.length > 0 && channels.every((channel) => selected.includes(channel.id))

  return (
    <>
      <div className="tv-admin-actions">
        <ActionButton icon={<Plus size={17} />} onClick={() => openForm()}>Novo canal</ActionButton>
        <ActionButton variant="outline" icon={<Filter size={17} />} onClick={() => setShowFilters((value) => !value)}>
          Filtros
        </ActionButton>
      </div>

      <div className={`tv-admin-filters${showFilters ? ' tv-admin-filters--open' : ''}`}>
        <Input id="tv-channel-search" label="Pesquisa" value={filters.search} placeholder="Nome ou slug" onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, search: event.target.value })) }} />
        <Select id="tv-filter-category" label="Categoria" value={filters.categoryId} options={[{ value: '', label: 'Todas' }, ...categoryOptions.slice(1)]} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, categoryId: event.target.value })) }} />
        <Select id="tv-filter-provider" label="Provedor" value={filters.provider} options={[{ value: '', label: 'Todos' }, ...TV_PROVIDERS]} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, provider: event.target.value })) }} />
        <Select id="tv-filter-status" label="Status" value={filters.status} options={[{ value: '', label: 'Todos' }, { value: 'active', label: 'Ativos' }, { value: 'inactive', label: 'Inativos' }]} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, status: event.target.value })) }} />
        <Select id="tv-filter-featured" label="Destaque" value={filters.featured} options={[{ value: '', label: 'Todos' }, { value: 'true', label: 'Em destaque' }, { value: 'false', label: 'Sem destaque' }]} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, featured: event.target.value })) }} />
        <Select id="tv-filter-verified" label="Verificacao" value={filters.verified} options={[{ value: '', label: 'Todos' }, { value: 'true', label: 'Verificados' }, { value: 'false', label: 'Nao verificados' }]} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, verified: event.target.value })) }} />
        <Select id="tv-filter-sort" label="Ordenar por" value={filters.sortBy} options={[{ value: 'display_order', label: 'Ordem' }, { value: 'name', label: 'Nome' }, { value: 'updated_at', label: 'Atualizacao' }, { value: 'views', label: 'Visualizacoes' }]} onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))} />
      </div>

      {selected.length > 0 && (
        <div className="tv-admin-bulk">
          <strong>{selected.length} selecionado(s)</strong>
          <Select id="tv-bulk-action" value={bulkAction} options={[
            { value: '', label: 'Escolha uma acao' },
            { value: 'enable', label: 'Ativar' },
            { value: 'disable', label: 'Desativar' },
            { value: 'feature', label: 'Marcar como destaque' },
            { value: 'unfeature', label: 'Remover dos destaques' },
            { value: 'verify', label: 'Marcar como verificado' },
            { value: 'move', label: 'Mover para categoria' },
            { value: 'delete', label: 'Excluir' },
          ]} onChange={(event) => setBulkAction(event.target.value)} />
          {bulkAction === 'move' && <Select id="tv-bulk-category" value={bulkCategory} options={categoryOptions} onChange={(event) => setBulkCategory(event.target.value)} />}
          <ActionButton loading={saving} onClick={applyBulk}>Aplicar</ActionButton>
        </div>
      )}

      {loading ? <LoadingSkeleton rows={8} /> : error ? (
        <ErrorState title="Nao foi possivel carregar canais" description={error.message} actionLabel="Tentar novamente" onAction={load} />
      ) : !channels.length ? (
        <EmptyState title="Nenhum canal encontrado" description="Ajuste os filtros ou cadastre o primeiro canal." actionLabel="Novo canal" onAction={() => openForm()} />
      ) : (
        <>
          <div className="tv-admin-table-wrap">
            <table className="tv-admin-table">
              <thead>
                <tr>
                  <th><Checkbox aria-label="Selecionar pagina" checked={allSelected} onChange={(event) => setSelected(event.target.checked ? channels.map((channel) => channel.id) : [])} /></th>
                  <th>Canal</th><th>Categoria</th><th>Provedor</th><th>Status</th><th>Ordem</th><th>Atualizacao</th><th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel, index) => (
                  <tr key={channel.id}>
                    <td data-label="Selecionar"><Checkbox aria-label={`Selecionar ${channel.name}`} checked={selected.includes(channel.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, channel.id] : current.filter((id) => id !== channel.id))} /></td>
                    <td data-label="Canal">
                      <div className="tv-admin-channel">
                        <span className="tv-admin-channel__logo">{channel.logo ? <img src={channel.logo} alt="" /> : channel.name.slice(0, 2).toUpperCase()}</span>
                        <div><strong>{channel.name}</strong><span>/{channel.slug}</span></div>
                      </div>
                    </td>
                    <td data-label="Categoria">{channel.category?.name || 'Sem categoria'}</td>
                    <td data-label="Provedor">{TV_PROVIDERS.find((item) => item.value === channel.provider)?.label || channel.provider}</td>
                    <td data-label="Status"><div className="tv-admin-statuses"><StatusBadge status={channel.enabled ? 'ATIVO' : 'INATIVO'}>{channel.enabled ? 'ATIVO' : 'INATIVO'}</StatusBadge>{channel.featured && <Star size={15} aria-label="Destaque" />}{channel.verified && <CheckCircle2 size={15} aria-label="Verificado" />}</div></td>
                    <td data-label="Ordem">{channel.displayOrder}</td>
                    <td data-label="Atualizacao">{channel.updatedAt ? new Date(channel.updatedAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td data-label="Acoes"><div className="tv-admin-row-actions">
                      <IconButton title="Subir" aria-label={`Subir ${channel.name}`} disabled={index === 0} onClick={() => reorder(channel, -1)}><ChevronUp size={16} /></IconButton>
                      <IconButton title="Descer" aria-label={`Descer ${channel.name}`} disabled={index === channels.length - 1} onClick={() => reorder(channel, 1)}><ChevronDown size={16} /></IconButton>
                      <IconButton title="Visualizar" aria-label={`Visualizar ${channel.name}`} onClick={() => setPreview(channel)}><Eye size={16} /></IconButton>
                      <IconButton title="Editar" aria-label={`Editar ${channel.name}`} onClick={() => openForm(channel)}><Edit3 size={16} /></IconButton>
                      <IconButton title="Duplicar" aria-label={`Duplicar ${channel.name}`} onClick={() => duplicate(channel)}><Copy size={16} /></IconButton>
                      <IconButton title={channel.enabled ? 'Desativar' : 'Ativar'} aria-label={`${channel.enabled ? 'Desativar' : 'Ativar'} ${channel.name}`} onClick={() => quickUpdate(channel, { enabled: !channel.enabled }, channel.enabled ? 'Canal desativado.' : 'Canal ativado.')}><Power size={16} /></IconButton>
                      <IconButton title={channel.featured ? 'Remover destaque' : 'Destacar'} aria-label={`${channel.featured ? 'Remover destaque de' : 'Destacar'} ${channel.name}`} onClick={() => quickUpdate(channel, { featured: !channel.featured }, channel.featured ? 'Canal removido dos destaques.' : 'Canal adicionado aos destaques.')}><Star size={16} fill={channel.featured ? 'currentColor' : 'none'} /></IconButton>
                      <IconButton title={channel.verified ? 'Remover verificacao' : 'Verificar'} aria-label={`${channel.verified ? 'Remover verificacao de' : 'Verificar'} ${channel.name}`} onClick={() => quickUpdate(channel, { verified: !channel.verified }, channel.verified ? 'Verificacao removida.' : 'Canal verificado.')}><ShieldCheck size={16} /></IconButton>
                      <IconButton title="Excluir" aria-label={`Excluir ${channel.name}`} onClick={() => setDeleting(channel)}><Trash2 size={16} /></IconButton>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Editar canal' : 'Novo canal'} onClose={() => setFormOpen(false)} className="tv-admin-form-modal">
        <form className="tv-admin-form tv-admin-form--two" onSubmit={save}>
          <Input id="tv-channel-name" label="Nome" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          <Input id="tv-channel-slug" label="Slug" value={form.slug} onChange={(event) => { setSlugEdited(true); updateField('slug', event.target.value) }} required />
          <div className="tv-admin-form__wide"><Textarea id="tv-channel-description" label="Descricao" value={form.description} onChange={(event) => updateField('description', event.target.value)} /></div>
          <Select id="tv-channel-category" label="Categoria" value={form.categoryId} options={categoryOptions} onChange={(event) => updateField('categoryId', event.target.value)} required />
          <Select id="tv-channel-provider" label="Provedor" value={form.provider} options={TV_PROVIDERS} onChange={(event) => updateField('provider', event.target.value)} />
          <div className="tv-admin-form__wide"><Input id="tv-channel-logo" label="URL da logo" type="url" value={form.logo} onChange={(event) => updateField('logo', event.target.value)} placeholder="https://..." /></div>
          {form.logo && <div className="tv-admin-logo-preview"><img src={form.logo} alt="Pre-visualizacao da logo" /></div>}
          <div className="tv-admin-form__wide"><Input id="tv-channel-embed" label="URL do embed" type="url" value={form.embedUrl} onChange={(event) => updateField('embedUrl', event.target.value)} placeholder="https://..." required /></div>
          <Input id="tv-channel-country" label="Pais" value={form.country} onChange={(event) => updateField('country', event.target.value)} />
          <Input id="tv-channel-language" label="Idioma" value={form.language} onChange={(event) => updateField('language', event.target.value)} />
          <Input id="tv-channel-order" label="Ordem de exibicao" type="number" min="0" value={form.displayOrder} onChange={(event) => updateField('displayOrder', event.target.value)} />
          <div className="tv-admin-switches">
            <Switch label="Ativo" checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} />
            <Switch label="Destaque" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />
            <Switch label="Verificado" checked={form.verified} onChange={(event) => updateField('verified', event.target.checked)} />
          </div>
          <div className="tv-admin-form__actions tv-admin-form__wide">
            <ActionButton variant="outline" onClick={() => setPreview(form)}>Testar canal</ActionButton>
            <ActionButton variant="outline" onClick={() => setFormOpen(false)}>Cancelar</ActionButton>
            <ActionButton type="submit" loading={saving}>Salvar canal</ActionButton>
          </div>
        </form>
      </Modal>

      <TVChannelPreview channel={preview} open={Boolean(preview)} onClose={() => setPreview(null)} />
      <TVConfirmDialog open={Boolean(deleting)} title="Excluir canal" description={`O canal "${deleting?.name}" sera excluido permanentemente.`} loading={saving} confirmLabel="Excluir canal" onClose={() => setDeleting(null)} onConfirm={confirmDelete} />
      <TVConfirmDialog open={confirmBulkDelete} title="Excluir canais selecionados" description={`${selected.length} canal(is) serao excluidos permanentemente.`} loading={saving} confirmLabel={`Excluir ${selected.length} canal(is)`} onClose={() => setConfirmBulkDelete(false)} onConfirm={deleteSelected} />
    </>
  )
}
