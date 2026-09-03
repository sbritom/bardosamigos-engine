import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Cake,
  CalendarDays,
  MessageCircle,
  Medal,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/AuthContext'
import {
  deleteCommunityWallPost,
  loadCommunityPageData,
  deleteCommunityBirthday,
  submitCommunityBirthday,
  submitCommunityWallPost,
  updateCommunityBirthday,
  updateCommunityWallPost,
} from '../services/communityService'
import { useCommunityPresence } from '../presence/CommunityPresenceContext'
import './communityPage.css'


const RULE_CATEGORIES = [
  {
    id: 'convivencia',
    title: 'Convivência',
    description: 'Respeito e boa convivência entre os participantes.',
    rules: [
      'Respeite todos os participantes.',
      'Ofensas, ameaças, perseguição e discriminação não são permitidas.',
      'Não exponha dados pessoais ou conversas privadas.',
      'Resenha é bem-vinda, desde que não ultrapasse o limite do respeito.',
    ],
  },
  {
    id: 'xat',
    title: 'Xat',
    description: 'Regras da sala oficial e dos Termos do xat.com.',
    rules: [
      'Siga os Termos de Serviço do xat.com.',
      'Sem flood, spam, golpes, phishing ou links maliciosos.',
      'Não use contas alternativas para fugir de punições.',
      'Scripts e automações não autorizadas são proibidos.',
    ],
  },
  {
    id: 'games',
    title: 'Games da Comunidade',
    description: 'Participação justa nos games realizados pelo Xat.',
    rules: [
      'Uma conta por participante.',
      'Sem scripts, automações ou manipulação de resultados.',
      'Bugs ou falhas não podem ser explorados.',
      'Cada Game pode possuir regras próprias.',
    ],
  },
  {
    id: 'eventos',
    title: 'Eventos',
    description: 'Regras gerais para eventos e premiações.',
    rules: [
      'Respeite data, horário e regras específicas de cada evento.',
      'Fraude, contas alternativas ou combinação de resultados geram desclassificação.',
      'Em caso de erro técnico, a rodada poderá ser anulada ou refeita.',
      'Premiações seguem o regulamento divulgado.',
    ],
  },
  {
    id: 'conteudo',
    title: 'Conteúdo',
    description: 'Conteúdo publicado no Xat, mural e portal.',
    rules: [
      'Não publique conteúdo ilegal, ofensivo ou impróprio.',
      'Sem spam, golpes ou divulgação não autorizada.',
      'Não compartilhe dados pessoais de terceiros.',
      'Conteúdos que violem as regras poderão ser removidos.',
    ],
  },
  {
    id: 'moderacao',
    title: 'Moderação',
    description: 'Como funcionam advertências e punições.',
    rules: [
      'A equipe pode advertir, silenciar, remover ou banir conforme a gravidade.',
      'Violações graves podem gerar punição imediata.',
      'Tentar burlar uma punição poderá aumentar a penalidade.',
      'Casos não previstos serão analisados pela equipe.',
    ],
  },
]

function formatBirthdayInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4)
  if (digits.length < 2) return digits
  if (digits.length === 2) return digits + '/'
  return digits.slice(0, 2) + '/' + digits.slice(2)
}

function formatWallDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function CommunitySectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="imortal-community-section-header">
      <div>
        <span>{eyebrow}</span>
        {title ? <h2>{title}</h2> : null}
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

function EmptyState({ children }) {
  return <div className="imortal-community-empty">{children}</div>
}

function formatEvoxNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function getEvoxUserName(item = {}) {
  return item?.user?.displayName
    || item?.user?.regname
    || item?.user?.name
    || item?.displayName
    || item?.regname
    || item?.name
    || 'Imortal'
}

function EvoxCommunitySection({ evox = {}, loading, onRefresh }) {
  const ranking = Array.isArray(evox.top10) ? evox.top10 : []
  const topActive = Array.isArray(evox.topActive) ? evox.topActive : []
  const hasOnline = evox.onlineNow !== null
    && evox.onlineNow !== undefined
    && Number.isFinite(Number(evox.onlineNow))

  return (
    <section className="imortal-community-section">
      <div className="mb-3 flex justify-end">
        <button
          className="imortal-community-inline-action"
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Atualizar dados da comunidade"
        >
          <RefreshCw size={14} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <article className="rounded-2xl border border-[rgba(42,143,255,0.12)] bg-[rgba(7,17,30,0.58)] p-4 lg:col-span-3">
          <div className="flex items-center gap-2 text-[#5fc7ff]">
            <Activity size={18} />
            <strong className="text-xs uppercase tracking-[0.08em]">Usuários online agora</strong>
          </div>
          <div className="mt-4 text-3xl font-black text-white">
            {hasOnline ? formatEvoxNumber(evox.onlineNow) : '—'}
          </div>
          {!hasOnline ? (
            <p className="mt-2 text-xs text-[#7186a4]">Sem dados no momento.</p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[rgba(42,143,255,0.12)] bg-[rgba(7,17,30,0.58)] p-4 lg:col-span-4">
          <div className="flex items-center gap-2 text-[#5fc7ff]">
            <Users size={18} />
            <strong className="text-xs uppercase tracking-[0.08em]">Top 10 mais ativos</strong>
          </div>

          {topActive.length ? (
            <ol className="mt-3 grid gap-1.5">
              {topActive.slice(0, 10).map((item, index) => (
                <li
                  key={item.id || item.user?.id || `active-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2"
                >
                  <span className="min-w-0 truncate text-xs font-bold text-[#dce7f7]">
                    {index + 1}. {getEvoxUserName(item)}
                  </span>
                  {item.activity !== undefined && item.activity !== null ? (
                    <small className="shrink-0 text-[0.65rem] font-bold text-[#7890ae]">
                      {formatEvoxNumber(item.activity)}
                    </small>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs leading-5 text-[#7186a4]">
              Sem dados no momento.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-[rgba(42,143,255,0.12)] bg-[rgba(7,17,30,0.58)] p-4 lg:col-span-5">
          <div className="flex items-center gap-2 text-[#5fc7ff]">
            <Trophy size={18} />
            <strong className="text-xs uppercase tracking-[0.08em]">Ranking de Pontos</strong>
          </div>

          {ranking.length ? (
            <ol className="mt-3 grid gap-1.5">
              {ranking.map((item, index) => {
                const position = Number(item.position || index + 1)
                const xatId = item?.user?.xatId

                return (
                  <li
                    key={item.id || item.user?.id || `ranking-${index}`}
                    className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0b78ff]/10 text-xs font-black text-[#5fc7ff]">
                      {position <= 3 ? <Medal size={15} /> : position}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-xs text-[#dce7f7]">{getEvoxUserName(item)}</strong>
                      {xatId ? <small className="block text-[0.6rem] text-[#647a99]">ID {xatId}</small> : null}
                    </span>
                    <strong className="text-xs font-black text-[#8cc8ff]">
                      {formatEvoxNumber(item.points)} pts
                    </strong>
                  </li>
                )
              })}
            </ol>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs leading-5 text-[#7186a4]">
              Sem dados no momento.
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

function getNextBingoLabel() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Maceio',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const currentWeekday = weekdayMap[values.weekday] ?? 0
  const currentMinutes = Number(values.hour) * 60 + Number(values.minute)
  let daysUntil = (4 - currentWeekday + 7) % 7

  if (daysUntil === 0 && currentMinutes >= (20 * 60 + 30)) daysUntil = 7

  const target = new Date(Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + daysUntil,
  ))

  const date = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
  }).format(target)

  return 'Próximo: ' + date
}

function EventCard({ event, onOpen }) {
  const date = event.slug === 'bingo-imortal0800'
    ? getNextBingoLabel()
    : (event.homeDateLabel || event.dateLabel || 'Data a definir')
  const time = event.homeTimeLabel || event.timeLabel || ''

  return (
    <article className="imortal-community-event-card">
      <div className="imortal-community-event-card__top">
        <span><CalendarDays size={15} /> Evento</span>
        {event.featured ? <strong>Destaque</strong> : null}
      </div>
      <h3>{event.title}</h3>
      <p>{event.summary || event.description || 'Confira os detalhes na agenda oficial.'}</p>
      <div className="imortal-community-event-card__meta">
        <span>{date}</span>
        {time ? <span>{time}</span> : null}
      </div>
      <button type="button" onClick={onOpen}>Ver evento</button>
    </article>
  )
}

function WallCard({
  post,
  editing,
  editText,
  busy,
  onEditText,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}) {
  return (
    <article className="imortal-community-wall-post">
      <div className="imortal-community-wall-post__meta">
        <strong>{post.authorName || 'Imortal'}</strong>
        <span>{post.source === 'xat' ? 'Xat' : formatWallDate(post.createdAt)}</span>
      </div>

      {editing ? (
        <textarea
          className="imortal-community-wall-post__edit"
          rows={3}
          minLength={2}
          maxLength={280}
          value={editText}
          onChange={(event) => onEditText(event.target.value)}
          disabled={busy}
        />
      ) : (
        <p>{post.body}</p>
      )}

      {post.updatedAt && post.createdAt && post.updatedAt !== post.createdAt ? (
        <small>Editado</small>
      ) : null}

      {post.canEdit ? (
        <div className="imortal-community-wall-post__actions">
          {editing ? (
            <>
              <button type="button" onClick={onSaveEdit} disabled={busy || editText.trim().length < 2}>Salvar</button>
              <button type="button" onClick={onCancelEdit} disabled={busy}>Cancelar</button>
            </>
          ) : (
            <>
              <button type="button" onClick={onStartEdit} disabled={busy}>Editar</button>
              <button type="button" className="is-danger" onClick={onDelete} disabled={busy}>
                {post.canModerate ? 'Remover' : 'Excluir'}
              </button>
            </>
          )}
        </div>
      ) : null}
    </article>
  )
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const { isAuthenticated, displayName } = useAuth()
  const { connected: presenceConnected, onlineCount } = useCommunityPresence()
  const [data, setData] = useState({
    events: [],
    birthdays: [],
    birthdaysUpcoming: [],
    ranking: null,
    achievements: [],
    wall: [],
    xat: { connected: false, onlineCount: null },
    evox: {
      configured: false,
      ranking: [],
      top10: [],
      onlineNow: null,
      topActive: [],
      analyticsAvailable: false,
      error: '',
    },
    errors: [],
  })
  const [loading, setLoading] = useState(true)
  const [wallName, setWallName] = useState('')
  const [wallText, setWallText] = useState('')
  const [wallBusy, setWallBusy] = useState(false)
  const [wallFeedback, setWallFeedback] = useState('')
  const [editingWallId, setEditingWallId] = useState('')
  const [editingWallText, setEditingWallText] = useState('')
  const [birthdayOpen, setBirthdayOpen] = useState(false)
  const [birthdayName, setBirthdayName] = useState('')
  const [birthdayDate, setBirthdayDate] = useState('')
  const [birthdayBusy, setBirthdayBusy] = useState(false)
  const [birthdayFeedback, setBirthdayFeedback] = useState('')
  const [editingBirthdayId, setEditingBirthdayId] = useState('')
  const [editingBirthdayName, setEditingBirthdayName] = useState('')
  const [editingBirthdayDate, setEditingBirthdayDate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await loadCommunityPageData())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (isAuthenticated && displayName && !wallName.trim()) {
      setWallName(displayName)
    }
  }, [displayName, isAuthenticated, wallName])

  const onlineLabel = useMemo(() => {
    if (presenceConnected && Number.isFinite(Number(onlineCount))) {
      return String(Number(onlineCount))
    }
    return '—'
  }, [presenceConnected, onlineCount])

  async function handleWallSubmit(event) {
    event.preventDefault()
    setWallBusy(true)
    setWallFeedback('')

    try {
      await submitCommunityWallPost({ body: wallText, authorName: wallName })
      setWallText('')
      setWallFeedback('Recado publicado.')
      await load()
    } catch (error) {
      setWallFeedback(error.message || 'Não foi possível publicar o recado agora.')
    } finally {
      setWallBusy(false)
    }
  }

  function startWallEdit(post) {
    setEditingWallId(post.id)
    setEditingWallText(post.body)
    setWallFeedback('')
  }

  async function saveWallEdit() {
    if (!editingWallId) return
    setWallBusy(true)
    setWallFeedback('')

    try {
      await updateCommunityWallPost({ id: editingWallId, body: editingWallText })
      setEditingWallId('')
      setEditingWallText('')
      setWallFeedback('Recado atualizado.')
      await load()
    } catch (error) {
      setWallFeedback(error.message || 'Não foi possível editar o recado agora.')
    } finally {
      setWallBusy(false)
    }
  }

  async function removeWallPost(post) {
    if (typeof window !== 'undefined' && !window.confirm('Excluir este recado?')) return
    setWallBusy(true)
    setWallFeedback('')

    try {
      await deleteCommunityWallPost(post.id)
      if (editingWallId === post.id) {
        setEditingWallId('')
        setEditingWallText('')
      }
      setWallFeedback(post.canModerate ? 'Recado removido pela moderação.' : 'Recado excluído.')
      await load()
    } catch (error) {
      setWallFeedback(error.message || 'Não foi possível excluir o recado agora.')
    } finally {
      setWallBusy(false)
    }
  }

  async function handleBirthdaySubmit(event) {
    event.preventDefault()
    const match = birthdayDate.trim().match(/^(\d{1,2})\/(\d{1,2})$/)

    if (!match) {
      setBirthdayFeedback('Use o formato DD/MM.')
      return
    }

    setBirthdayBusy(true)
    setBirthdayFeedback('')

    try {
      await submitCommunityBirthday({
        displayName: birthdayName,
        day: Number(match[1]),
        month: Number(match[2]),
      })
      setBirthdayName('')
      setBirthdayDate('')
      setBirthdayOpen(false)
      setBirthdayFeedback('Cadastro enviado para aprovação da equipe.')
      await load()
    } catch (error) {
      setBirthdayFeedback(error.message || 'Não foi possível cadastrar o aniversário agora.')
    } finally {
      setBirthdayBusy(false)
    }
  }

  function startBirthdayEdit(person) {
    setEditingBirthdayId(person.id)
    setEditingBirthdayName(person.displayName || '')
    setEditingBirthdayDate(
      String(person.day).padStart(2, '0') + '/' + String(person.month).padStart(2, '0'),
    )
    setBirthdayFeedback('')
  }

  async function saveBirthdayEdit() {
    const match = editingBirthdayDate.trim().match(/^(\d{1,2})\/(\d{1,2})$/)
    if (!match || !editingBirthdayId) {
      setBirthdayFeedback('Use o formato DD/MM.')
      return
    }

    setBirthdayBusy(true)
    setBirthdayFeedback('')
    try {
      await updateCommunityBirthday({
        id: editingBirthdayId,
        displayName: editingBirthdayName,
        day: Number(match[1]),
        month: Number(match[2]),
      })
      setEditingBirthdayId('')
      setBirthdayFeedback('Alteração enviada para nova aprovação.')
      await load()
    } catch (error) {
      setBirthdayFeedback(error.message || 'Não foi possível atualizar o aniversário.')
    } finally {
      setBirthdayBusy(false)
    }
  }

  async function removeBirthday(person) {
    if (typeof window !== 'undefined' && !window.confirm('Excluir seu aniversário?')) return

    setBirthdayBusy(true)
    setBirthdayFeedback('')
    try {
      await deleteCommunityBirthday(person.id)
      setEditingBirthdayId('')
      setBirthdayFeedback('Aniversário excluído.')
      await load()
    } catch (error) {
      setBirthdayFeedback(error.message || 'Não foi possível excluir o aniversário.')
    } finally {
      setBirthdayBusy(false)
    }
  }

  return (
    <main className="imortal-community-page" aria-busy={loading}>
      <header className="imortal-community-hero">
        <div className="imortal-community-hero__content">
          <span className="imortal-community-eyebrow">
            <MessageCircle size={15} />
            COMUNIDADE IMORTAL0800
          </span>
        </div>

        <div className="imortal-community-active-widget" aria-label="Imortais no portal">
          <div className="imortal-community-active-widget__icon">
            <Activity size={22} />
          </div>
          <span>No portal agora</span>
          <strong>{onlineLabel}</strong>
          <small>
            {presenceConnected ? 'Visitantes conectados ao portal' : 'Sincronizando presença'}
          </small>
        </div>
      </header>

      <EvoxCommunitySection
        evox={data.evox}
        loading={loading}
        onRefresh={load}
      />

      <section className="imortal-community-section imortal-community-section--events">
        <CommunitySectionHeader
          eyebrow="Eventos do IMORTAL0800"
          title=""
          description="Os próximos eventos publicados no portal."
          action={(
            <button className="imortal-community-inline-action" type="button" onClick={() => navigate('/events')}>
              Ver agenda
            </button>
          )}
        />

        {loading ? (
          <EmptyState>Carregando eventos...</EmptyState>
        ) : data.events?.length ? (
          <div className="imortal-community-events-grid">
            {data.events.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} onOpen={() => navigate('/events')} />
            ))}
          </div>
        ) : (
          <EmptyState>Nenhum evento publicado no momento.</EmptyState>
        )}
      </section>

      <section className="imortal-community-grid-section imortal-community-grid-section--social">
        <div className="imortal-community-panel">
          <CommunitySectionHeader
            eyebrow="Comunidade"
            title="Mural de Recados"
            description="Deixe seu recado usando o mesmo nome/nick que aparece no Xat."
          />

          <form className="imortal-community-wall-form" onSubmit={handleWallSubmit}>
            <input
              type="text"
              minLength={2}
              maxLength={50}
              value={wallName}
              onChange={(event) => setWallName(event.target.value)}
              placeholder="Nome/Nick no Xat"
              aria-label="Nome ou nick usado no Xat"
              required
              disabled={wallBusy}
            />
            <textarea
              rows={3}
              minLength={2}
              maxLength={280}
              value={wallText}
              onChange={(event) => setWallText(event.target.value)}
              placeholder="Escreva um recado..."
              disabled={wallBusy}
            />
            <div>
              <small>Use o mesmo nick do Xat • {wallText.length}/280</small>
              <button
                type="submit"
                disabled={wallBusy || wallName.trim().length < 2 || wallText.trim().length < 2}
              >
                <Send size={15} />
                {wallBusy ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>

          {wallFeedback ? <p className="imortal-community-feedback">{wallFeedback}</p> : null}

          <div className="imortal-community-wall-list">
            {data.wall?.length ? (
              data.wall.slice(0, 8).map((post) => (
                <WallCard
                  key={post.id}
                  post={post}
                  editing={editingWallId === post.id}
                  editText={editingWallText}
                  busy={wallBusy}
                  onEditText={setEditingWallText}
                  onStartEdit={() => startWallEdit(post)}
                  onCancelEdit={() => {
                    setEditingWallId('')
                    setEditingWallText('')
                  }}
                  onSaveEdit={saveWallEdit}
                  onDelete={() => removeWallPost(post)}
                />
              ))
            ) : (
              <EmptyState>O mural ainda não tem recados.</EmptyState>
            )}
          </div>
        </div>

        <div className="imortal-community-panel">
          <CommunitySectionHeader
            eyebrow="Calendário"
            title="Aniversariantes do mês"
            description="Cadastre seu nome como aparece no Xat e sua data de aniversário."
            action={(
              <button
                className="imortal-community-inline-action"
                type="button"
                onClick={() => {
                  setBirthdayOpen((current) => !current)
                  setBirthdayFeedback('')
                }}
              >
                {birthdayOpen ? 'Fechar' : 'Cadastrar aniversário'}
              </button>
            )}
          />

          {data.birthdaysUpcoming?.length ? (
            <div className="imortal-community-birthday-highlights">
              {data.birthdaysUpcoming.slice(0, 3).map((person) => (
                <div key={'upcoming-' + person.id}>
                  <Cake size={15} />
                  <span>
                    <strong>{person.distance === 0 ? 'Hoje' : person.distance === 1 ? 'Amanhã' : 'Em ' + person.distance + ' dias'}</strong>
                    <small>{person.displayName}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {birthdayOpen ? (
            <form className="imortal-community-birthday-form" onSubmit={handleBirthdaySubmit}>
              <input
                type="text"
                minLength={2}
                maxLength={50}
                value={birthdayName}
                onChange={(event) => setBirthdayName(event.target.value)}
                placeholder="Nome/Nick no Xat"
                aria-label="Nome ou nick usado no Xat"
                required
                disabled={birthdayBusy}
              />
              <input
                type="text"
                inputMode="numeric"
                value={birthdayDate}
                onChange={(event) => setBirthdayDate(formatBirthdayInput(event.target.value))}
                placeholder="DD/MM"
                maxLength={5}
                required
                disabled={birthdayBusy}
              />
              <button type="submit" disabled={birthdayBusy || birthdayName.trim().length < 2}>
                {birthdayBusy ? 'Enviando...' : 'Cadastrar'}
              </button>
              <small>Use exatamente o nome/nick que aparece no Xat. Informe apenas dia e mês.</small>
            </form>
          ) : null}

          {birthdayFeedback ? <p className="imortal-community-feedback">{birthdayFeedback}</p> : null}

          {data.birthdays?.length ? (
            <div className="imortal-community-birthdays">
              {data.birthdays.map((person) => (
                <div key={person.id}>
                  <span><Cake size={17} /></span>
                  <strong>{String(person.day).padStart(2, '0')}</strong>
                  <p>{person.displayName || 'Imortal'}</p>

                  {person.canEdit ? (
                    editingBirthdayId === person.id ? (
                      <div className="imortal-community-birthday-editor">
                        <input
                          type="text"
                          maxLength={50}
                          value={editingBirthdayName}
                          onChange={(event) => setEditingBirthdayName(event.target.value)}
                          placeholder="Nome/Nick no Xat"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={editingBirthdayDate}
                          onChange={(event) => setEditingBirthdayDate(formatBirthdayInput(event.target.value))}
                          placeholder="DD/MM"
                        />
                        <button type="button" onClick={saveBirthdayEdit} disabled={birthdayBusy}>Salvar</button>
                        <button type="button" onClick={() => setEditingBirthdayId('')} disabled={birthdayBusy}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="imortal-community-birthday-actions">
                        <button type="button" onClick={() => startBirthdayEdit(person)}>Editar</button>
                        <button type="button" className="is-danger" onClick={() => removeBirthday(person)}>Excluir</button>
                      </div>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Nenhum aniversário público neste mês.</EmptyState>
          )}
        </div>
      </section>

      <section className="imortal-community-section">
        <CommunitySectionHeader
          eyebrow="REGRAS"
          title=""
        />

        <div className="imortal-community-rules">
          {RULE_CATEGORIES.map((category) => (
            <details key={category.id}>
              <summary>
                <span className="imortal-community-rules__icon">
                  <ShieldCheck size={18} />
                </span>
                <span>
                  <strong>{category.title}</strong>
                  <small>{category.description}</small>
                </span>
                <Sparkles size={15} className="imortal-community-rules__marker" />
              </summary>
              <div>
                <ul className="imortal-community-rules__list">
                  {category.rules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="imortal-community-xat-cta">
        <div>
          <span>XAT OFICIAL</span>
          <strong>A resenha continua por lá.</strong>
          <p>Entre na sala para participar dos Games, eventos e atividades da comunidade.</p>
        </div>
        <button type="button" onClick={() => navigate('/chat')}>
          <MessageCircle size={18} />
          Entrar no Xat
        </button>
      </section>

      {data.errors?.length ? (
        <p className="imortal-community-page-error">
          Parte dos dados não pôde ser atualizada agora. As demais áreas continuam disponíveis.
        </p>
      ) : null}
    </main>
  )
}
