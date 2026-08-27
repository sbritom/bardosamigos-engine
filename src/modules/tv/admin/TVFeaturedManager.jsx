import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Star, Trash2 } from 'lucide-react'
import {
  ActionButton,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingSkeleton,
  Modal,
  Panel,
  Select,
  StatusBadge,
} from '../../../design-system'
import { TVChannelService, TVFeaturedService } from '../services'
import { TVConfirmDialog } from './TVConfirmDialog'

const emptyForm = { channelId: '', priority: 0, startAt: '', endAt: '' }

function dateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

export function TVFeaturedManager({ notify }) {
  const [featured, setFeatured] = useState([])
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [removing, setRemoving] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [featuredResponse, channelResponse] = await Promise.all([
      TVFeaturedService.listAdmin(),
      TVChannelService.listAdmin({ status: 'active', page: 1, pageSize: 100, sortBy: 'name' }),
    ])
    setFeatured(featuredResponse.data || [])
    setChannels(channelResponse.data || [])
    setError(featuredResponse.error || channelResponse.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const channelOptions = useMemo(() => [
    { value: '', label: 'Selecione um canal' },
    ...channels.map((channel) => ({ value: channel.id, label: channel.name })),
  ], [channels])

  function openForm(item = null) {
    setForm(item ? {
      channelId: item.channelId,
      priority: item.priority || 0,
      startAt: dateInputValue(item.startAt),
      endAt: dateInputValue(item.endAt),
    } : { ...emptyForm, priority: featured.length })
    setFormOpen(true)
  }

  async function save(event) {
    event.preventDefault()
    if (form.startAt && form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      notify('error', 'Periodo invalido.', 'A data final deve ser posterior a data inicial.')
      return
    }
    setSaving(true)
    const response = await TVFeaturedService.setFeatured(form.channelId, {
      priority: Number(form.priority) || 0,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
    })
    setSaving(false)
    if (response.error) notify('error', 'Nao foi possivel salvar.', response.error.message)
    else {
      notify('success', 'Destaque salvo com sucesso.')
      setFormOpen(false)
      await load()
    }
  }

  async function remove() {
    setSaving(true)
    const response = await TVFeaturedService.removeFeatured(removing.channelId)
    setSaving(false)
    if (response.error) notify('error', 'Nao foi possivel remover.', response.error.message)
    else {
      notify('success', 'Canal removido dos destaques.')
      setRemoving(null)
      await load()
    }
  }

  async function reorder(item, direction) {
    const index = featured.findIndex((entry) => entry.id === item.id)
    const target = index + direction
    if (target < 0 || target >= featured.length) return
    const reordered = [...featured]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const response = await TVFeaturedService.reorderFeatured(
      reordered.map((entry, priority) => ({ id: entry.id, order: priority })),
    )
    if (response.error) notify('error', 'Nao foi possivel reordenar.', response.error.message)
    else {
      setFeatured(reordered.map((entry, priority) => ({ ...entry, priority })))
      notify('success', 'Alteracoes publicadas.')
    }
  }

  if (loading) return <LoadingSkeleton rows={6} />
  if (error) return <ErrorState title="Nao foi possivel carregar destaques" description={error.message} actionLabel="Tentar novamente" onAction={load} />

  return (
    <>
      <div className="tv-admin-actions">
        <ActionButton icon={<Plus size={17} />} onClick={() => openForm()}>Adicionar destaque</ActionButton>
      </div>
      {!featured.length ? (
        <EmptyState title="Nenhum canal em destaque" description="Adicione canais ativos para compor o Hero da TV." actionLabel="Adicionar destaque" onAction={() => openForm()} />
      ) : (
        <div className="tv-admin-featured-list">
          {featured.map((item, index) => (
            <Panel key={item.id} className="tv-admin-featured-row">
              <span className="tv-admin-featured-row__rank">{index + 1}</span>
              <div>
                <strong>{item.channel?.name}</strong>
                <span>{item.channel?.category?.name || 'Sem categoria'}</span>
              </div>
              <StatusBadge status="DESTAQUE">DESTAQUE</StatusBadge>
              <span>{item.startAt ? new Date(item.startAt).toLocaleDateString('pt-BR') : 'Inicio imediato'} - {item.endAt ? new Date(item.endAt).toLocaleDateString('pt-BR') : 'Sem fim'}</span>
              <div className="tv-admin-row-actions">
                <IconButton title="Subir" aria-label={`Subir ${item.channel?.name}`} disabled={index === 0} onClick={() => reorder(item, -1)}><ChevronUp size={17} /></IconButton>
                <IconButton title="Descer" aria-label={`Descer ${item.channel?.name}`} disabled={index === featured.length - 1} onClick={() => reorder(item, 1)}><ChevronDown size={17} /></IconButton>
                <ActionButton variant="outline" onClick={() => openForm(item)}>Editar</ActionButton>
                <IconButton title="Remover" aria-label={`Remover ${item.channel?.name}`} onClick={() => setRemoving(item)}><Trash2 size={17} /></IconButton>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={formOpen} title="Configurar destaque" onClose={() => setFormOpen(false)}>
        <form className="tv-admin-form" onSubmit={save}>
          <Select id="tv-featured-channel" label="Canal" value={form.channelId} options={channelOptions} disabled={featured.some((item) => item.channelId === form.channelId)} onChange={(event) => setForm((current) => ({ ...current, channelId: event.target.value }))} required />
          <Input id="tv-featured-priority" label="Prioridade" type="number" min="0" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} />
          <Input id="tv-featured-start" label="Inicio opcional" type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} />
          <Input id="tv-featured-end" label="Fim opcional" type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} />
          <div className="tv-admin-form__actions">
            <ActionButton variant="outline" onClick={() => setFormOpen(false)}>Cancelar</ActionButton>
            <ActionButton type="submit" icon={<Star size={17} />} loading={saving} disabled={!form.channelId}>Salvar destaque</ActionButton>
          </div>
        </form>
      </Modal>

      <TVConfirmDialog open={Boolean(removing)} title="Remover destaque" description={`O canal "${removing?.channel?.name}" deixara de aparecer nos destaques.`} loading={saving} confirmLabel="Remover destaque" onClose={() => setRemoving(null)} onConfirm={remove} />
    </>
  )
}
