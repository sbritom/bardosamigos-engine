import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, CalendarDays, LogOut, Pencil, Plus, ShieldAlert, Star } from 'lucide-react'

import {
  ADMIN_AUTH_ERRORS,
  ADMIN_ROLES,
  getAdminAccess,
  signInAdminWithUsername,
  signOutAdmin,
} from '../../../../core/auth/adminAuthService.js'
import { createAdminEvent, listAdminEvents, updateAdminEvent } from '../services/eventsAdminApi.js'
import './eventsAdmin.css'

const INITIAL_ACCESS = {
  loading: true,
  allowed: false,
  hasSession: false,
  reason: '',
  user: null,
}

const EVENT_TYPES = ['Bingo', 'Brincadeira', 'Campeonato', 'Especial', 'Música ao Vivo', 'Promoção', 'Outro']
const RECURRENCE_OPTIONS = ['Toda segunda-feira', 'Toda sexta-feira', 'Todo sábado', 'Mensal', 'Personalizado']

const INITIAL_EVENT_FORM = {
  title: '',
  description: '',
  type: 'Bingo',
  recurring: true,
  recurrence: 'Toda segunda-feira',
  startsAt: '',
  endsAt: '',
  timeMode: 'announced',
  time: '',
  location: 'xat.com/BarDosAmigos',
  participationRule: '',
  featured: false,
  status: 'published',
}

function getEventDisplayValue(value) {
  return value || '-'
}

function getEventStatusLabel(status) {
  const labels = {
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Arquivado',
    cancelled: 'Cancelado',
  }

  return labels[status] || status || '-'
}

function getEventTimeDisplay(event) {
  return event.timeLabel || event.dateLabel || event.startsAt || '-'
}

function slugifyTitle(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function getDateInputValue(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().slice(0, 10)
}

function getTimeInputValue(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(String(value))) return ''
  return value
}

function getFormFromEvent(event = {}) {
  const metadata = event.metadata || {}
  const recurring = Boolean(event.recurring)
  const timeLabel = event.timeLabel || metadata.timeLabel || ''
  const time = getTimeInputValue(timeLabel)

  return {
    title: event.title || '',
    description: event.description || '',
    type: event.typeLabel || metadata.type || INITIAL_EVENT_FORM.type,
    recurring,
    recurrence: event.recurrenceLabel || metadata.recurrence || INITIAL_EVENT_FORM.recurrence,
    startsAt: getDateInputValue(event.startsAt),
    endsAt: getDateInputValue(event.endsAt),
    timeMode: time ? 'specific' : 'announced',
    time,
    location: event.location || INITIAL_EVENT_FORM.location,
    participationRule: event.participationRule || metadata.participationRule || '',
    featured: Boolean(event.featured),
    status: event.status === 'draft' ? 'draft' : 'published',
  }
}

function getEventSummaryCards(events = []) {
  return [
    {
      label: 'Publicados',
      value: events.filter((event) => event.status === 'published').length,
    },
    {
      label: 'Rascunhos',
      value: events.filter((event) => event.status === 'draft').length,
    },
    {
      label: 'Arquivados',
      value: events.filter((event) => event.status === 'archived').length,
    },
    {
      label: 'Destaques',
      value: events.filter((event) => event.featured).length,
    },
  ]
}

function EventsAdminLogin({ error, form, loading, onChange, onSubmit }) {
  return (
    <main className="events-admin-page">
      <section className="events-admin-login">
        <div className="events-admin-login__icon" aria-hidden="true">
          <CalendarDays size={28} />
        </div>
        <h1>PAINEL DE EVENTOS</h1>
        <p>Entre com uma conta administradora para listar os eventos cadastrados.</p>

        <form className="events-admin-login__form" onSubmit={onSubmit}>
          <label>
            <span>Usuario</span>
            <input
              autoComplete="username"
              name="username"
              onChange={onChange}
              placeholder="admin"
              type="text"
              value={form.username}
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              autoComplete="current-password"
              name="password"
              onChange={onChange}
              placeholder="Digite sua senha"
              type="password"
              value={form.password}
            />
          </label>

          {error ? <p className="events-admin-error">{error}</p> : null}

          <button className="events-admin-button events-admin-button--primary" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
      </section>
    </main>
  )
}

function EventsAdminUnauthorized({ reason, onLogout }) {
  return (
    <main className="events-admin-page">
      <section className="events-admin-state">
        <ShieldAlert size={32} />
        <h1>Acesso nao autorizado</h1>
        <p>{reason || ADMIN_AUTH_ERRORS.NOT_ALLOWED}</p>
        <button className="events-admin-button" onClick={onLogout} type="button">
          Sair da conta
        </button>
      </section>
    </main>
  )
}

function EventsAdminSummary({ events }) {
  const cards = getEventSummaryCards(events)

  return (
    <div className="events-admin-summary" aria-label="Resumo dos eventos">
      {cards.map((card) => (
        <article className="events-admin-summary-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  )
}

function EventsAdminEventList({ events, loading, onEdit }) {
  if (loading) {
    return <p className="events-admin-muted">Carregando eventos...</p>
  }

  if (!events.length) {
    return (
      <div className="events-admin-empty">
        <CalendarDays size={34} />
        <strong>Nenhum evento cadastrado.</strong>
        <span>Quando o CRUD for habilitado, os eventos criados aparecerao aqui.</span>
      </div>
    )
  }

  return (
    <div className="events-admin-event-grid" aria-label="Eventos cadastrados">
      {events.map((event) => (
        <article className="events-admin-event-card" key={event.id || event.slug}>
          <div className="events-admin-event-card__top">
            <span className="events-admin-status">{getEventStatusLabel(event.status)}</span>
            {event.featured ? (
              <span className="events-admin-featured">
                <Star size={14} />
                Destaque
              </span>
            ) : null}
          </div>

          <h3>{getEventDisplayValue(event.title)}</h3>

          <dl className="events-admin-event-meta">
            <div>
              <dt>Tipo</dt>
              <dd>{getEventDisplayValue(event.typeLabel)}</dd>
            </div>
            <div>
              <dt>Recorrencia</dt>
              <dd>{getEventDisplayValue(event.recurrenceLabel)}</dd>
            </div>
            <div>
              <dt>Horario</dt>
              <dd>{getEventTimeDisplay(event)}</dd>
            </div>
            <div>
              <dt>Slug</dt>
              <dd>
                <code>{getEventDisplayValue(event.slug)}</code>
              </dd>
            </div>
          </dl>

          <div className="events-admin-actions">
            <button className="events-admin-icon-button" onClick={() => onEdit(event)} title="Editar" type="button">
              <Pencil size={15} />
              <span>Editar</span>
            </button>
            <button className="events-admin-icon-button events-admin-icon-button--danger" disabled title="Arquivar" type="button">
              <Archive size={15} />
              <span>Arquivar</span>
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function EventsAdminEventModal({ error, form, loading, mode, onChange, onClose, onSubmit, success }) {
  const slug = slugifyTitle(form.title)
  const isEditMode = mode === 'edit'

  return (
    <div className="events-admin-modal" role="dialog" aria-modal="true" aria-labelledby="events-admin-form-title">
      <div className="events-admin-modal__panel">
        <div className="events-admin-modal__header">
          <div>
            <span className="events-admin-eyebrow">{isEditMode ? 'Editar evento' : 'Novo evento'}</span>
            <h2 id="events-admin-form-title">{isEditMode ? 'EDITAR EVENTO' : 'Criar evento'}</h2>
          </div>
          <button className="events-admin-button" disabled={loading} onClick={onClose} type="button">
            Fechar
          </button>
        </div>

        <form className="events-admin-form" onSubmit={onSubmit}>
          <fieldset>
            <legend>Informacoes basicas</legend>
            <label>
              <span>Titulo</span>
              <input name="title" onChange={onChange} type="text" value={form.title} />
            </label>
            <label>
              <span>Slug</span>
              <input readOnly type="text" value={slug} />
            </label>
            <label className="events-admin-form__wide">
              <span>Descricao</span>
              <textarea name="description" onChange={onChange} rows="4" value={form.description} />
            </label>
          </fieldset>

          <fieldset>
            <legend>Tipo</legend>
            <label>
              <span>Tipo de evento</span>
              <select name="type" onChange={onChange} value={form.type}>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Evento recorrente</legend>
            <label className="events-admin-check">
              <input checked={form.recurring} name="recurring" onChange={onChange} type="checkbox" />
              <span>Evento recorrente</span>
            </label>

            {form.recurring ? (
              <label>
                <span>Frequencia</span>
                <select name="recurrence" onChange={onChange} value={form.recurrence}>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>
                  <span>Data inicial</span>
                  <input name="startsAt" onChange={onChange} type="date" value={form.startsAt} />
                </label>
                <label>
                  <span>Data final</span>
                  <input name="endsAt" onChange={onChange} type="date" value={form.endsAt} />
                </label>
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>Horario</legend>
            <label className="events-admin-radio">
              <input checked={form.timeMode === 'announced'} name="timeMode" onChange={onChange} type="radio" value="announced" />
              <span>Horario divulgado no dia</span>
            </label>
            <label className="events-admin-radio">
              <input checked={form.timeMode === 'specific'} name="timeMode" onChange={onChange} type="radio" value="specific" />
              <span>Horario especifico</span>
            </label>
            {form.timeMode === 'specific' ? (
              <label>
                <span>Hora</span>
                <input name="time" onChange={onChange} type="time" value={form.time} />
              </label>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>Detalhes</legend>
            <label>
              <span>Local</span>
              <input name="location" onChange={onChange} type="text" value={form.location} />
            </label>
            <label className="events-admin-form__wide">
              <span>Regra de participacao</span>
              <textarea name="participationRule" onChange={onChange} rows="3" value={form.participationRule} />
            </label>
            <label className="events-admin-check">
              <input checked={form.featured} name="featured" onChange={onChange} type="checkbox" />
              <span>Evento em destaque</span>
            </label>
          </fieldset>

          <fieldset>
            <legend>Status</legend>
            <label className="events-admin-radio">
              <input checked={form.status === 'published'} name="status" onChange={onChange} type="radio" value="published" />
              <span>Publicado</span>
            </label>
            <label className="events-admin-radio">
              <input checked={form.status === 'draft'} name="status" onChange={onChange} type="radio" value="draft" />
              <span>Rascunho</span>
            </label>
          </fieldset>

          {error ? <p className="events-admin-error">{error}</p> : null}
          {success ? <p className="events-admin-success">{success}</p> : null}

          <div className="events-admin-form__actions">
            <button className="events-admin-button" disabled={loading} onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="events-admin-button events-admin-button--primary" disabled={loading} type="submit">
              {loading ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Criar evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EventsAdminPage() {
  const [access, setAccess] = useState(INITIAL_ACCESS)
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(INITIAL_EVENT_FORM)
  const [editingEvent, setEditingEvent] = useState(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  const eventCountLabel = useMemo(() => {
    if (events.length === 1) return '1 evento cadastrado'
    return `${events.length} eventos cadastrados`
  }, [events.length])

  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError('')

    try {
      const data = await listAdminEvents()
      setEvents(data)
    } catch (error) {
      setEventsError(error?.message || 'Nao foi possivel carregar os eventos.')
    } finally {
      setEventsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function verifyAccess() {
      const currentAccess = await getAdminAccess({
        allowedRoles: [ADMIN_ROLES.ADMIN],
        noSessionReason: 'Entre para acessar o painel de eventos.',
      })

      if (!active) return

      setAccess({ ...currentAccess, loading: false })

      if (currentAccess.allowed) {
        await loadEvents()
      }
    }

    verifyAccess()

    return () => {
      active = false
    }
  }, [loadEvents])

  const handleLoginChange = useCallback((event) => {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
  }, [])

  const handleLogin = useCallback(async (event) => {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const result = await signInAdminWithUsername({
        username: loginForm.username,
        password: loginForm.password,
        allowedRoles: [ADMIN_ROLES.ADMIN],
      })

      setAccess({ ...result, loading: false })

      if (!result.allowed) {
        setLoginError(result.reason || ADMIN_AUTH_ERRORS.NOT_ALLOWED)
        return
      }

      await loadEvents()
    } catch (error) {
      setLoginError(error?.message || ADMIN_AUTH_ERRORS.INVALID_LOGIN)
    } finally {
      setLoginLoading(false)
    }
  }, [loadEvents, loginForm.password, loginForm.username])

  const handleLogout = useCallback(async () => {
    await signOutAdmin()
    setAccess({ ...INITIAL_ACCESS, loading: false })
    setEvents([])
    setLoginForm({ username: '', password: '' })
    setLoginError('')
    setEventsError('')
    setCreateOpen(false)
    setCreateForm(INITIAL_EVENT_FORM)
    setEditingEvent(null)
    setCreateError('')
    setCreateSuccess('')
  }, [])

  const handleCreateOpen = useCallback(() => {
    setCreateForm(INITIAL_EVENT_FORM)
    setEditingEvent(null)
    setCreateError('')
    setCreateSuccess('')
    setCreateOpen(true)
  }, [])

  const handleCreateClose = useCallback(() => {
    if (createLoading) return

    setCreateOpen(false)
    setEditingEvent(null)
    setCreateError('')
  }, [createLoading])

  const handleEditOpen = useCallback((event) => {
    setEditingEvent(event)
    setCreateForm(getFormFromEvent(event))
    setCreateError('')
    setCreateSuccess('')
    setCreateOpen(true)
  }, [])

  const handleCreateChange = useCallback((event) => {
    const { checked, name, type, value } = event.target

    setCreateForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }, [])

  const handleCreateSubmit = useCallback(async (event) => {
    event.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      if (editingEvent?.id) {
        await updateAdminEvent({ id: editingEvent.id, ...createForm })
        setCreateSuccess('Evento atualizado com sucesso.')
      } else {
        await createAdminEvent(createForm)
        setCreateSuccess('Evento criado com sucesso.')
      }

      setCreateOpen(false)
      setEditingEvent(null)
      setCreateForm(INITIAL_EVENT_FORM)
      await loadEvents()
    } catch (error) {
      setCreateError(error?.message || 'Nao foi possivel criar o evento.')
    } finally {
      setCreateLoading(false)
    }
  }, [createForm, editingEvent, loadEvents])

  if (access.loading) {
    return (
      <main className="events-admin-page">
        <section className="events-admin-state">
          <CalendarDays size={32} />
          <p>Verificando sessao administrativa...</p>
        </section>
      </main>
    )
  }

  if (!access.hasSession) {
    return (
      <EventsAdminLogin
        error={loginError}
        form={loginForm}
        loading={loginLoading}
        onChange={handleLoginChange}
        onSubmit={handleLogin}
      />
    )
  }

  if (!access.allowed) {
    return <EventsAdminUnauthorized onLogout={handleLogout} reason={access.reason} />
  }

  return (
    <main className="events-admin-page">
      <section className="events-admin-shell">
        <header className="events-admin-header">
          <div>
            <span className="events-admin-eyebrow">Administracao</span>
            <h1>PAINEL DE EVENTOS</h1>
            <p>{eventCountLabel}</p>
          </div>

          <button className="events-admin-button" onClick={handleLogout} type="button">
            <LogOut size={16} />
            Sair
          </button>
        </header>

        <section className="events-admin-card">
          <div className="events-admin-card__header">
            <div>
              <h2>Eventos cadastrados</h2>
              <p>Lista de eventos reais registrados em public.events.</p>
            </div>

            <button className="events-admin-button events-admin-button--primary" onClick={handleCreateOpen} type="button">
              <Plus size={16} />
              NOVO EVENTO
            </button>
          </div>

          {eventsError ? <p className="events-admin-error">{eventsError}</p> : null}
          {createSuccess ? <p className="events-admin-success">{createSuccess}</p> : null}

          <EventsAdminSummary events={events} />
          <EventsAdminEventList events={events} loading={eventsLoading} onEdit={handleEditOpen} />
        </section>
      </section>

      {createOpen ? (
        <EventsAdminEventModal
          error={createError}
          form={createForm}
          loading={createLoading}
          mode={editingEvent ? 'edit' : 'create'}
          onChange={handleCreateChange}
          onClose={handleCreateClose}
          onSubmit={handleCreateSubmit}
          success=""
        />
      ) : null}
    </main>
  )
}
