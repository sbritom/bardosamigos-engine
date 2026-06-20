import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, EmptyState, Input, Loading, Modal, Pagination, Select } from '../../../../design-system'
import { CompetitionDataTable } from './CompetitionDataTable'
import { CompetitionEntityForm } from './CompetitionEntityForm'
import {
  createCompetitionAdminRecord,
  deleteCompetitionAdminRecord,
  listCompetitionAdminRecords,
  updateCompetitionAdminRecord,
} from '../services/competitionAdminService'

const pageSize = 10

function createInitialForm(fields) {
  return fields.reduce((acc, field) => {
    if (field.type === 'select') acc[field.key] = field.options?.[0] || ''
    else if (field.type === 'number') acc[field.key] = 0
    else acc[field.key] = ''
    return acc
  }, {})
}

export function CompetitionCrudPage({ entity }) {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState(() => createInitialForm(entity.fields))
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const filters = useMemo(() => {
    const firstFilter = entity.filters?.[0]
    return firstFilter && filter ? { [firstFilter.key]: filter } : {}
  }, [entity.filters, filter])

  async function loadRecords() {
    setLoading(true)
    setError('')
    const result = await listCompetitionAdminRecords({
      table: entity.table,
      search,
      searchFields: entity.searchFields,
      filters,
      page,
      pageSize,
    })

    if (result.error) {
      setError(result.error.message)
    }

    setRows(result.data)
    setCount(result.count)
    setLoading(false)
  }

  useEffect(() => {
    loadRecords()
  }, [entity.table, page, search, filter])

  function openCreate() {
    setEditing({ id: null })
    setForm(createInitialForm(entity.fields))
  }

  function openEdit(row) {
    setEditing(row)
    setForm({ ...createInitialForm(entity.fields), ...row })
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const result = editing?.id
      ? await updateCompetitionAdminRecord(entity.table, editing.id, form)
      : await createCompetitionAdminRecord(entity.table, form)

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setEditing(null)
    setSuccess(editing?.id ? 'Registro atualizado com sucesso.' : 'Registro criado com sucesso.')
    loadRecords()
  }

  async function confirmDelete() {
    const result = await deleteCompetitionAdminRecord(entity.table, deleting.id)

    if (result.error) {
      setError(result.error.message)
    } else {
      setSuccess('Registro excluido com sucesso.')
      loadRecords()
    }

    setDeleting(null)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-black text-[var(--gold)]">{entity.title}</h1>
          <p className="mt-1 text-[var(--secondary)]">{entity.description}</p>
        </div>
        <Button onClick={openCreate}>Novo registro</Button>
      </div>

      <Card className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <Input label="Pesquisar" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} />
          {entity.filters?.[0] && (
            <Select
              label={entity.filters[0].label}
              value={filter}
              options={[{ label: 'Todos', value: '' }, ...entity.filters[0].options.map((option) => ({ label: option, value: option }))]}
              onChange={(event) => { setPage(1); setFilter(event.target.value) }}
            />
          )}
        </div>
      </Card>

      {error && <Alert status="danger" title="Erro">{error}</Alert>}
      {success && <Alert status="success" title="Sucesso">{success}</Alert>}

      {loading ? (
        <Loading label="Carregando registros" />
      ) : rows.length === 0 ? (
        <EmptyState title="Nenhum registro encontrado" description="Ajuste a pesquisa ou cadastre um novo registro." actionLabel="Cadastrar" onAction={openCreate} />
      ) : (
        <CompetitionDataTable columns={entity.columns} rows={rows} onEdit={openEdit} onDelete={setDeleting} />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={Boolean(editing)} title={editing?.id ? 'Editar registro' : 'Cadastrar registro'} onClose={() => setEditing(null)}>
        <CompetitionEntityForm
          fields={entity.fields}
          value={form}
          onChange={setForm}
          onSubmit={submitForm}
          onCancel={() => setEditing(null)}
          submitting={saving}
        />
      </Modal>

      <Modal open={Boolean(deleting)} title="Confirmar exclusao" onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <p>Tem certeza que deseja excluir este registro? A exclusao sera feita por soft delete.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
