import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, LogOut, Pencil, Plus, ShieldAlert, Star } from 'lucide-react'

import {
  ADMIN_AUTH_ERRORS,
  ADMIN_ROLES,
  getAdminAccess,
  signInAdminWithUsername,
  signOutAdmin,
} from '../../../../core/auth/adminAuthService.js'
import { createAdminEvent, listAdminEvents, updateAdminEvent } from '../services/eventsAdminApi.js'
import './eventsAdmin.css'

const INITIAL_ACCESS = { loading: true, allowed: false, hasSession: false, reason: '', user: null }
const EVENT_TYPES = ['Bingo', 'Game', 'Campeonato', 'Especial', 'Música ao Vivo', 'Promoção', 'Outro']
const RECURRENCE_OPTIONS = ['Toda quinta-feira', 'Toda segunda-feira', 'Toda sexta-feira', 'Todo sábado', 'Mensal', 'Personalizado']
const INITIAL_EVENT_FORM = {
  title: '', description: '', type: 'Bingo', recurring: true, recurrence: 'Toda quinta-feira',
  startsAt: '', endsAt: '', timeMode: 'specific', time: '20:30', location: 'xat.com/Imortal0800',
  participationRule: '', featured: false, status: 'published',
}

function slugifyTitle(value) {
  return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90)
}
function getDateInputValue(value) { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : '' }
function getTimeInputValue(value) { return /^\d{2}:\d{2}$/.test(String(value || '')) ? value : '' }
function getFormFromEvent(event = {}) {
  const metadata = event.metadata || {}
  const time = getTimeInputValue(event.timeLabel || metadata.timeLabel || '')
  return {
    title: event.title || '', description: event.description || '', type: event.typeLabel || metadata.type || 'Bingo',
    recurring: Boolean(event.recurring), recurrence: event.recurrenceLabel || metadata.recurrence || 'Toda quinta-feira',
    startsAt: getDateInputValue(event.startsAt), endsAt: getDateInputValue(event.endsAt),
    timeMode: time ? 'specific' : 'announced', time, location: event.location || 'xat.com/Imortal0800',
    participationRule: event.participationRule || metadata.participationRule || '', featured: Boolean(event.featured),
    status: event.status === 'draft' ? 'draft' : 'published',
  }
}

export default function EventsAdminPage() {
  const [access, setAccess] = useState(INITIAL_ACCESS)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(INITIAL_EVENT_FORM)

  const eventCountLabel = useMemo(() => `${events.length} ${events.length === 1 ? 'evento cadastrado' : 'eventos cadastrados'}`, [events.length])
  const loadEvents = useCallback(async () => {
    setLoading(true); setError('')
    try { setEvents(await listAdminEvents()) } catch (err) { setError(err?.message || 'Não foi possível carregar os eventos.') } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    getAdminAccess({ allowedRoles: [ADMIN_ROLES.ADMIN], noSessionReason: 'Entre para acessar o painel de eventos.' }).then(async (result) => {
      if (!active) return
      setAccess({ ...result, loading: false })
      if (result.allowed) await loadEvents()
    })
    return () => { active = false }
  }, [loadEvents])

  async function handleLogin(event) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const result = await signInAdminWithUsername({ ...loginForm, allowedRoles: [ADMIN_ROLES.ADMIN] })
      setAccess({ ...result, loading: false }); await loadEvents()
    } catch (err) { setError(err?.message || ADMIN_AUTH_ERRORS.INVALID_LOGIN) } finally { setLoading(false) }
  }
  async function handleLogout() { await signOutAdmin(); setAccess({ ...INITIAL_ACCESS, loading: false }); setEvents([]) }
  function openCreate() { setEditing(null); setForm(INITIAL_EVENT_FORM); setError(''); setFormOpen(true) }
  function openEdit(event) { setEditing(event); setForm(getFormFromEvent(event)); setError(''); setFormOpen(true) }
  function handleChange(event) { const { name, value, checked, type } = event.target; setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })) }
  async function handleSubmit(event) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      if (editing?.id) await updateAdminEvent({ id: editing.id, ...form })
      else await createAdminEvent(form)
      setFormOpen(false); setEditing(null); setForm(INITIAL_EVENT_FORM); await loadEvents()
    } catch (err) { setError(err?.message || 'Não foi possível salvar o evento.') } finally { setLoading(false) }
  }

  if (access.loading) return <main className="events-admin-page"><section className="events-admin-state"><CalendarDays size={32} /><p>Verificando sessão administrativa...</p></section></main>
  if (!access.hasSession) return (
    <main className="events-admin-page"><section className="events-admin-login"><CalendarDays size={28} /><h1>PAINEL DE EVENTOS</h1><p>IMORTAL0800</p>
      <form className="events-admin-login__form" onSubmit={handleLogin}>
        <label><span>Usuário</span><input name="username" value={loginForm.username} onChange={(e) => setLoginForm((c) => ({ ...c, username: e.target.value }))} /></label>
        <label><span>Senha</span><input name="password" type="password" value={loginForm.password} onChange={(e) => setLoginForm((c) => ({ ...c, password: e.target.value }))} /></label>
        {error ? <p className="events-admin-error">{error}</p> : null}<button className="events-admin-button events-admin-button--primary" disabled={loading}>ENTRAR</button>
      </form></section></main>
  )
  if (!access.allowed) return <main className="events-admin-page"><section className="events-admin-state"><ShieldAlert size={32} /><h1>Acesso não autorizado</h1><button className="events-admin-button" onClick={handleLogout}>Sair</button></section></main>

  return (
    <main className="events-admin-page"><section className="events-admin-shell">
      <header className="events-admin-header"><div><span className="events-admin-eyebrow">IMORTAL0800</span><h1>PAINEL DE EVENTOS</h1><p>{eventCountLabel}</p></div><button className="events-admin-button" onClick={handleLogout}><LogOut size={16} /> Sair</button></header>
      <section className="events-admin-card"><div className="events-admin-card__header"><div><h2>Eventos cadastrados</h2><p>Agenda oficial do IMORTAL0800.</p></div><button className="events-admin-button events-admin-button--primary" onClick={openCreate}><Plus size={16} /> NOVO EVENTO</button></div>
        {error ? <p className="events-admin-error">{error}</p> : null}
        <div className="events-admin-event-grid">{events.map((event) => <article className="events-admin-event-card" key={event.id || event.slug}><div className="events-admin-event-card__top"><span className="events-admin-status">{event.status || 'Publicado'}</span>{event.featured ? <span className="events-admin-featured"><Star size={14} /> Destaque</span> : null}</div><h3>{event.title}</h3><dl className="events-admin-event-meta"><div><dt>Tipo</dt><dd>{event.typeLabel || '-'}</dd></div><div><dt>Recorrência</dt><dd>{event.recurrenceLabel || '-'}</dd></div><div><dt>Horário</dt><dd>{event.timeLabel || event.dateLabel || '-'}</dd></div></dl><div className="events-admin-actions"><button className="events-admin-icon-button" onClick={() => openEdit(event)}><Pencil size={15} /> Editar</button></div></article>)}</div>
      </section></section>
      {formOpen ? <div className="events-admin-modal" role="dialog" aria-modal="true"><div className="events-admin-modal__panel"><div className="events-admin-modal__header"><div><span className="events-admin-eyebrow">{editing ? 'Editar evento' : 'Novo evento'}</span><h2>{editing ? 'EDITAR EVENTO' : 'CRIAR EVENTO'}</h2></div><button className="events-admin-button" onClick={() => setFormOpen(false)}>Fechar</button></div>
        <form className="events-admin-form" onSubmit={handleSubmit}><fieldset><legend>Informações básicas</legend><label><span>Título</span><input name="title" value={form.title} onChange={handleChange} required /></label><label><span>Slug</span><input readOnly value={slugifyTitle(form.title)} /></label><label className="events-admin-form__wide"><span>Descrição</span><textarea name="description" rows="3" value={form.description} onChange={handleChange} /></label></fieldset>
        <fieldset><legend>Evento</legend><label><span>Tipo</span><select name="type" value={form.type} onChange={handleChange}>{EVENT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label><label className="events-admin-check"><input name="recurring" type="checkbox" checked={form.recurring} onChange={handleChange} /><span>Recorrente</span></label>{form.recurring ? <label><span>Frequência</span><select name="recurrence" value={form.recurrence} onChange={handleChange}>{RECURRENCE_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></label> : <><label><span>Início</span><input name="startsAt" type="date" value={form.startsAt} onChange={handleChange} /></label><label><span>Fim</span><input name="endsAt" type="date" value={form.endsAt} onChange={handleChange} /></label></>}</fieldset>
        <fieldset><legend>Detalhes</legend><label><span>Horário</span><input name="time" type="time" value={form.time} onChange={handleChange} /></label><label><span>Local</span><input name="location" value={form.location} onChange={handleChange} /></label><label className="events-admin-form__wide"><span>Regra de participação</span><textarea name="participationRule" rows="2" value={form.participationRule} onChange={handleChange} /></label><label className="events-admin-check"><input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} /><span>Destaque</span></label></fieldset>
        <div className="events-admin-form__actions"><button type="button" className="events-admin-button" onClick={() => setFormOpen(false)}>Cancelar</button><button className="events-admin-button events-admin-button--primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button></div></form>
      </div></div> : null}
    </main>
  )
}
