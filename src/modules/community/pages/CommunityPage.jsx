import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Cake,
  CalendarDays,
  Gamepad2,
  MessageCircle,
  Medal,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/AuthContext'
import {
  deleteCommunityWallPost,
  loadCommunityPageData,
  submitCommunityBirthday,
  submitCommunityWallPost,
  updateCommunityWallPost,
} from '../services/communityService'
import { useCommunityPresence } from '../presence/CommunityPresenceContext'
import './communityPage.css'

const COMMUNITY_GAMES = [
  {
    id: 'quiz',
    title: 'Quiz',
    description: 'Perguntas e respostas iniciadas e respondidas diretamente no Xat.',
  },
  {
    id: 'dice',
    title: 'Dice',
    description: 'Rodadas rápidas com resultado registrado a partir das atividades do Xat.',
  },
  {
    id: 'music',
    title: 'Adivinhe a música',
    description: 'Desafios musicais para os participantes da sala.',
  },
  {
    id: 'lucky',
    title: 'Número da sorte',
    description: 'Participação e resultado centralizados no Xat.',
  },
]

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

function EventCard({ event, onOpen }) {
  const date = event.homeDateLabel || event.dateLabel || 'Data a definir'
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
    ranking: null,
    achievements: [],
    wall: [],
    xat: { connected: false, onlineCount: null },
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
      setBirthdayFeedback('Aniversário cadastrado.')
      await load()
    } catch (error) {
      setBirthdayFeedback(error.message || 'Não foi possível cadastrar o aniversário agora.')
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

        <div className="imortal-community-active-widget" aria-label="Imortais ativos">
          <div className="imortal-community-active-widget__icon">
            <Activity size={22} />
          </div>
          <span>Imortais ativos</span>
          <strong>{onlineLabel}</strong>
          <small>
            {presenceConnected ? 'Conectados ao portal agora' : 'Sincronizando presença'}
          </small>
        </div>
      </header>

      <section className="imortal-community-section imortal-community-section--games">
        <CommunitySectionHeader
          eyebrow="Games da Comunidade"
          title=""
        />

        <div className="imortal-community-games-grid">
          {COMMUNITY_GAMES.map((game) => (
            <article key={game.id} className="imortal-community-game-card">
              <div className="imortal-community-game-card__icon">
                <Gamepad2 size={20} />
              </div>
              <span>Via Xat</span>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <small>Integração em preparação</small>
            </article>
          ))}
        </div>
      </section>

      <section className="imortal-community-grid-section">
        <div className="imortal-community-panel">
          <CommunitySectionHeader
            eyebrow="Competição"
            title="Ranking de Imortais"
            description="Resultados dos Games da Comunidade sincronizados com o Xat."
          />

          {data.ranking?.entries?.length ? (
            <div className="imortal-community-ranking">
              {data.ranking.entries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="imortal-community-ranking__row">
                  <strong>{entry.position || '—'}</strong>
                  <span>{entry.displayName || entry.username || 'Imortal'}</span>
                  <b>{entry.score}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>
              O ranking aparecerá quando os resultados dos Games da Comunidade começarem a ser enviados pelo Xat.
            </EmptyState>
          )}
        </div>

        <div className="imortal-community-panel">
          <CommunitySectionHeader
            eyebrow="Participação"
            title="Conquistas"
            description="Selos conquistados nas atividades da comunidade."
          />

          {data.achievements?.length ? (
            <div className="imortal-community-achievements">
              {data.achievements.slice(0, 6).map((achievement) => (
                <div key={achievement.id}>
                  <Medal size={18} />
                  <span>
                    <strong>{achievement.name}</strong>
                    <small>{achievement.description || 'Conquista da comunidade'}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>
              As conquistas serão liberadas conforme os Games e eventos do Xat forem integrados.
            </EmptyState>
          )}
        </div>
      </section>

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
            description="Recados curtos da comunidade, sem transformar a página em uma rede social."
          />

          <form className="imortal-community-wall-form" onSubmit={handleWallSubmit}>
            <input
              type="text"
              minLength={2}
              maxLength={50}
              value={wallName}
              onChange={(event) => setWallName(event.target.value)}
              placeholder="Seu nome"
              aria-label="Seu nome"
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
              <small>Identificação obrigatória • {wallText.length}/280</small>
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
                  <p>{person.displayName || person.username || 'Imortal'}</p>
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
