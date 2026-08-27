import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Edit3, FolderPlus, Trash2 } from 'lucide-react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingSkeleton,
  Modal,
  Panel,
  StatusBadge,
  Switch,
  Textarea,
} from '../../../design-system'
import { TVCategoryService } from '../services'
import { slugifyTVValue } from '../utils'
import { TVConfirmDialog } from './TVConfirmDialog'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  color: '#38bdf8',
  displayOrder: 0,
  enabled: true,
}

export function TVCategoryManager({ createRequested, notify }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [slugEdited, setSlugEdited] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [moveTarget, setMoveTarget] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const response = await TVCategoryService.listAdmin()
    setCategories(response.data || [])
    setError(response.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openForm = useCallback((category = null) => {
    setEditing(category)
    setForm(category ? {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#38bdf8',
      displayOrder: category.displayOrder || 0,
      enabled: category.enabled,
    } : { ...emptyForm, displayOrder: categories.length })
    setSlugEdited(Boolean(category))
    setFormOpen(true)
  }, [categories.length])

  useEffect(() => {
    if (createRequested) openForm()
  }, [createRequested, openForm])

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
      ? await TVCategoryService.updateCategory(editing.id, form)
      : await TVCategoryService.createCategory(form)
    setSaving(false)
    if (response.error) {
      notify('error', 'Nao foi possivel salvar.', response.error.message)
      return
    }
    notify('success', editing ? 'Categoria atualizada.' : 'Categoria criada com sucesso.')
    setEditing(null)
    setFormOpen(false)
    setForm(emptyForm)
    await load()
  }

  async function toggle(category) {
    const response = await TVCategoryService.updateCategory(category.id, { ...category, enabled: !category.enabled })
    if (response.error) notify('error', 'Nao foi possivel salvar.', response.error.message)
    else {
      notify('success', category.enabled ? 'Categoria desativada.' : 'Categoria ativada.')
      await load()
    }
  }

  async function move(category, direction) {
    const index = categories.findIndex((item) => item.id === category.id)
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const reordered = [...categories]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const response = await TVCategoryService.reorderCategories(
      reordered.map((item, order) => ({ id: item.id, order })),
    )
    if (response.error) notify('error', 'Nao foi possivel reordenar.', response.error.message)
    else {
      setCategories(reordered.map((item, order) => ({ ...item, displayOrder: order })))
      notify('success', 'Alteracoes publicadas.')
    }
  }

  async function confirmDelete() {
    setSaving(true)
    const response = await TVCategoryService.deleteCategory(deleting.id, deleting.channelCount ? moveTarget : null)
    setSaving(false)
    if (response.error) {
      notify('error', 'Nao foi possivel excluir.', response.error.message)
      return
    }
    notify('success', 'Categoria excluida.')
    setDeleting(null)
    setMoveTarget('')
    await load()
  }

  if (loading) return <LoadingSkeleton rows={6} />
  if (error) return <ErrorState title="Nao foi possivel carregar categorias" description={error.message} actionLabel="Tentar novamente" onAction={load} />

  return (
    <>
      <div className="tv-admin-actions">
        <ActionButton icon={<FolderPlus size={17} />} onClick={() => openForm()}>Nova categoria</ActionButton>
      </div>
      {!categories.length ? (
        <EmptyState title="Nenhuma categoria cadastrada" description="Crie a primeira categoria para organizar os canais." actionLabel="Criar categoria" onAction={() => openForm()} />
      ) : (
        <div className="tv-admin-category-list">
          {categories.map((category, index) => (
            <Panel key={category.id} className="tv-admin-category-row">
              <span className="tv-admin-color" style={{ backgroundColor: category.color || '#38bdf8' }} />
              <div>
                <strong>{category.name}</strong>
                <span>/{category.slug} · {category.channelCount} canal(is)</span>
              </div>
              <StatusBadge status={category.enabled ? 'ATIVA' : 'INATIVA'}>{category.enabled ? 'ATIVA' : 'INATIVA'}</StatusBadge>
              <div className="tv-admin-row-actions">
                <IconButton title="Subir" aria-label={`Subir ${category.name}`} disabled={index === 0} onClick={() => move(category, -1)}><ChevronUp size={17} /></IconButton>
                <IconButton title="Descer" aria-label={`Descer ${category.name}`} disabled={index === categories.length - 1} onClick={() => move(category, 1)}><ChevronDown size={17} /></IconButton>
                <ActionButton variant="outline" onClick={() => toggle(category)}>{category.enabled ? 'Desativar' : 'Ativar'}</ActionButton>
                <IconButton title="Editar" aria-label={`Editar ${category.name}`} onClick={() => openForm(category)}><Edit3 size={17} /></IconButton>
                <IconButton title="Excluir" aria-label={`Excluir ${category.name}`} onClick={() => setDeleting(category)}><Trash2 size={17} /></IconButton>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={formOpen} title={editing ? 'Editar categoria' : 'Nova categoria'} onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm) }}>
        <form className="tv-admin-form" onSubmit={save}>
          <Input id="tv-category-name" label="Nome" value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          <Input id="tv-category-slug" label="Slug" value={form.slug} onChange={(event) => { setSlugEdited(true); updateField('slug', event.target.value) }} required />
          <Textarea id="tv-category-description" label="Descricao" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          <Input id="tv-category-icon" label="Icone" value={form.icon} onChange={(event) => updateField('icon', event.target.value)} placeholder="Nome do icone" />
          <Input id="tv-category-color" label="Cor" type="color" value={form.color} onChange={(event) => updateField('color', event.target.value)} />
          <Input id="tv-category-order" label="Ordem de exibicao" type="number" min="0" value={form.displayOrder} onChange={(event) => updateField('displayOrder', event.target.value)} />
          <Switch label="Categoria ativa" checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} />
          <div className="tv-admin-form__actions">
            <ActionButton variant="outline" onClick={() => { setFormOpen(false); setEditing(null); setForm(emptyForm) }}>Cancelar</ActionButton>
            <ActionButton type="submit" loading={saving}>Salvar categoria</ActionButton>
          </div>
        </form>
      </Modal>

      <TVConfirmDialog
        open={Boolean(deleting)}
        title="Excluir categoria"
        description={deleting?.channelCount
          ? `Esta categoria possui ${deleting.channelCount} canal(is). Escolha para onde move-los antes de excluir.`
          : 'A categoria sera excluida permanentemente.'}
        options={deleting?.channelCount ? [
          { value: '', label: 'Selecione uma categoria' },
          ...categories.filter((item) => item.id !== deleting.id).map((item) => ({ value: item.id, label: item.name })),
        ] : null}
        optionValue={moveTarget}
        onOptionChange={setMoveTarget}
        loading={saving}
        confirmLabel="Excluir categoria"
        onClose={() => { setDeleting(null); setMoveTarget('') }}
        onConfirm={confirmDelete}
      />
    </>
  )
}
