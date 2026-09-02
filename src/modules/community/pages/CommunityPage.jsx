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
  loadCommunityPageData,
  submitCommunityWallPost,
} from '../services/communityService'
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
    description: 'Regras gerais de respeito e convivência entre os participantes.',
  },
  {
    id: 'xat',
    title: 'Xat',
    description: 'Orientações específicas para participação na sala oficial.',
  },
  {
    id: 'games',
    title: 'Games da Comunidade',
    description: 'Regras das atividades, resultados e participação nos games do Xat.',
  },
  {
    id: 'eventos',
    title: 'Eventos',
    description: 'Critérios de participação, horários e regulamentos dos eventos.',
  },
  {
    id: 'conteudo',
    title: 'Conteúdo',
    description: 'Orientações para mensagens, recados, links e outros conteúdos.',
  },
  {
    id: 'moderacao',
    title: 'Moderação',
    description: 'Como funcionam advertências, decisões e ações da equipe.',
  },
]

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

function WallCard({ post }) {
  return (
    <article className="imortal-community-wall-post">
      <div className="imortal-community-wall-post__meta">
        <strong>{post.authorName || 'Imortal'}</strong>
        <span>{post.source === 'xat' ? 'Xat' : formatWallDate(post.createdAt)}</span>
      </div>
      <p>{post.body}</p>
      {post.source === 'xat' && post.createdAt ? (
        <small>{formatWallDate(post.createdAt)}</small>
      ) : null}
    </article>
  )
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const { isAuthenticated, openAuth } = useAuth()
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
  const [wallText, setWallText] = useState('')
  const [wallBusy, setWallBusy] = useState(false)
  const [wallFeedback, setWallFeedback] = useState('')

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

  const onlineLabel = useMemo(() => {
    if (data.xat?.connected && Number.isFinite(Number(data.xat?.onlineCount))) {
      return String(Number(data.xat.onlineCount))
    }
    return '—'
  }, [data.xat])

  async function handleWallSubmit(event) {
    event.preventDefault()

    if (!isAuthenticated) {
      openAuth('Entre para publicar um recado no mural.', 'login')
      return
    }

    setWallBusy(true)
    setWallFeedback('')

    try {
      await submitCommunityWallPost({ body: wallText })
      setWallText('')
      setWallFeedback('Recado publicado.')
      await load()
    } catch (error) {
      setWallFeedback(error.message || 'Não foi possível publicar o recado agora.')
    } finally {
      setWallBusy(false)
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
            {data.xat?.connected
              ? 'Agora no Xat'
              : 'Contagem será sincronizada diretamente com o Xat'}
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

      <section className="imortal-community-section">
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
            <textarea
              rows={3}
              minLength={2}
              maxLength={280}
              value={wallText}
              onChange={(event) => setWallText(event.target.value)}
              placeholder={isAuthenticated ? 'Escreva um recado...' : 'Entre para publicar um recado'}
              disabled={wallBusy || !isAuthenticated}
            />
            <div>
              <small>{wallText.length}/280</small>
              <button
                type="submit"
                disabled={wallBusy || (isAuthenticated && wallText.trim().length < 2)}
              >
                <Send size={15} />
                {wallBusy ? 'Publicando...' : isAuthenticated ? 'Publicar' : 'Entrar para publicar'}
              </button>
            </div>
          </form>

          {wallFeedback ? <p className="imortal-community-feedback">{wallFeedback}</p> : null}

          <div className="imortal-community-wall-list">
            {data.wall?.length ? (
              data.wall.slice(0, 8).map((post) => <WallCard key={post.id} post={post} />)
            ) : (
              <EmptyState>O mural ainda não tem recados.</EmptyState>
            )}
          </div>
        </div>

        <div className="imortal-community-panel">
          <CommunitySectionHeader
            eyebrow="Calendário"
            title="Aniversariantes do mês"
            description="Apenas participantes que autorizaram a exibição aparecem aqui."
          />

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
                O regulamento desta categoria será publicado pela equipe do IMORTAL0800.
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
