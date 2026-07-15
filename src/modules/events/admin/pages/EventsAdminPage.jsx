import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, LogOut, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react'

import {
  ADMIN_AUTH_ERRORS,
  ADMIN_ROLES,
  getAdminAccess,
  signInAdminWithUsername,
  signOutAdmin,
} from '../../../../core/auth/adminAuthService.js'
import { listAdminEvents } from '../services/eventsAdminApi.js'
import './eventsAdmin.css'

const INITIAL_ACCESS = {
  loading: true,
  allowed: false,
  hasSession: false,
  reason: '',
  user: null,
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

function EventsAdminTable({ events, loading }) {
  if (loading) {
    return <p className="events-admin-muted">Carregando eventos...</p>
  }

  if (!events.length) {
    return <p className="events-admin-empty">Nenhum evento cadastrado.</p>
  }

  return (
    <div className="events-admin-table" role="table" aria-label="Eventos cadastrados">
      <div className="events-admin-table__row events-admin-table__row--head" role="row">
        <span>Titulo</span>
        <span>Status</span>
        <span>Tipo</span>
        <span>Recorrencia</span>
        <span>Horario</span>
        <span>Slug</span>
        <span>Acoes</span>
      </div>

      {events.map((event) => (
        <div className="events-admin-table__row" key={event.id || event.slug} role="row">
          <strong>{getEventDisplayValue(event.title)}</strong>
          <span>{getEventStatusLabel(event.status)}</span>
          <span>{getEventDisplayValue(event.typeLabel)}</span>
          <span>{getEventDisplayValue(event.recurrenceLabel)}</span>
          <span>{getEventTimeDisplay(event)}</span>
          <code>{getEventDisplayValue(event.slug)}</code>
          <div className="events-admin-actions">
            <button className="events-admin-icon-button" disabled title="Editar" type="button">
              <Pencil size={15} />
              <span>Editar</span>
            </button>
            <button className="events-admin-icon-button events-admin-icon-button--danger" disabled title="Excluir" type="button">
              <Trash2 size={15} />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      ))}
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
  }, [])

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

            <button className="events-admin-button events-admin-button--primary" disabled type="button">
              <Plus size={16} />
              Novo Evento
            </button>
          </div>

          {eventsError ? <p className="events-admin-error">{eventsError}</p> : null}

          <EventsAdminTable events={events} loading={eventsLoading} />
        </section>
      </section>
    </main>
  )
}
