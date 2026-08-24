import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Eye,
  EyeOff,
  MessageCircle,
  Music2,
  Radio,
  RefreshCw,
  Tv,
  UserRound,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  ActionButton,
  HeroCard,
  SectionHeader,
  StatCard,
  StatusBadge,
} from '../../../design-system'
import { useAuth } from '../../auth/AuthContext'
import { loadCommunityPageData } from '../services/communityService'

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR')
}

function CommunityHero({ onChat, onEvents }) {
  return (
    <HeroCard className="bds-community-hero">
      <div className="bds-community-hero__seal" aria-hidden="true">
        <Users size={42} />
      </div>
      <div className="bds-community-hero__content">
        <StatusBadge status="COMUNIDADE">Comunidade aberta</StatusBadge>
        <h1>Comunidade Bar dos Amigos</h1>
        <p>
          Um ponto de encontro do portal para descobrir eventos, acessar o chat e conhecer membros que escolheram aparecer publicamente.
        </p>
        <div className="bds-community-hero__actions">
          <ActionButton icon={<MessageCircle size={18} />} onClick={onChat}>Entrar no Chat Oficial</ActionButton>
          <ActionButton variant="outline" icon={<CalendarDays size={18} />} onClick={onEvents}>Ver eventos</ActionButton>
        </div>
      </div>
    </HeroCard>
  )
}

function EventCard({ event, onOpen }) {
  const dateLabel = event.homeDateLabel || event.dateLabel || 'Programacao'
  const timeLabel = event.homeTimeLabel || event.timeLabel || ''

  return (
    <article className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)]">
          <CalendarDays size={22} />
        </div>
        <StatusBadge status={event.featured ? 'DESTAQUE' : 'EVENTO'}>
          {event.featured ? 'Destaque' : 'Evento'}
        </StatusBadge>
      </div>
      <h3 className="mt-4 text-lg font-black text-[var(--text)]">{event.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
        {event.summary || event.description || 'Confira os detalhes na agenda do Bar dos Amigos.'}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{dateLabel}</span>
        {timeLabel && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{timeLabel}</span>}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-[var(--text)] transition hover:bg-white/10"
      >
        Ver na agenda
      </button>
    </article>
  )
}

function MemberCard({ member }) {
  return (
    <article className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--primary)]/12 text-[var(--primary)]">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={`Foto de ${member.displayName}`} className="h-full w-full object-cover" />
        ) : (
          <UserRound size={26} />
        )}
      </div>
      <div className="min-w-0">
        <strong className="block truncate text-[var(--text)]">{member.displayName}</strong>
        <span className="mt-0.5 block truncate text-sm font-semibold text-[var(--primary)]">
          {member.username ? `@${member.username}` : 'Membro da comunidade'}
        </span>
        {member.bio && (
          <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">{member.bio}</p>
        )}
      </div>
    </article>
  )
}

function ParticipationCard({ isAuthenticated, visible, busy, onLogin, onToggle }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-sm">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">Sua presenca</span>
      <h2 className="mt-1 text-xl font-black text-[var(--text)]">
        {isAuthenticated ? 'Voce decide se quer aparecer' : 'Participe quando quiser'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        {isAuthenticated
          ? 'A lista publica mostra somente nome, @usuario, foto e bio. Seu e-mail e outros dados da conta nunca aparecem aqui.'
          : 'Nao precisa criar conta para acessar a comunidade, eventos ou chat. A conta e usada apenas se voce quiser ter perfil e aparecer na lista de membros.'}
      </p>

      {isAuthenticated ? (
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition disabled:opacity-60 ${visible ? 'border border-white/15 bg-white/5 text-[var(--text)] hover:bg-white/10' : 'bg-[var(--primary)] text-white hover:brightness-110'}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          {busy ? 'Salvando...' : visible ? 'Ocultar meu perfil da comunidade' : 'Aparecer na comunidade'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onLogin}
          className="mt-5 w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-bold text-white transition hover:brightness-110"
        >
          Entrar para configurar meu perfil
        </button>
      )}
    </section>
  )
}

export default function CommunityPage() {
  const navigate = useNavigate()
  const {
    isAuthenticated,
    preferences,
    openAuth,
    updatePreferences,
  } = useAuth()
  const [data, setData] = useState({ stats: {}, members: [], events: [], errors: [] })
  const [loading, setLoading] = useState(true)
  const [visibilityBusy, setVisibilityBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  const communityVisible = preferences?.community?.visible === true

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await loadCommunityPageData()
      setData(next)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleVisibility() {
    setVisibilityBusy(true)
    setFeedback('')
    try {
      await updatePreferences({
        community: {
          ...(preferences?.community || {}),
          visible: !communityVisible,
        },
      })
      setFeedback(communityVisible
        ? 'Seu perfil nao aparecera mais na lista publica.'
        : 'Seu perfil agora pode aparecer na comunidade.')
      await load()
    } catch (error) {
      setFeedback(error.message || 'Nao foi possivel alterar sua visibilidade agora.')
    } finally {
      setVisibilityBusy(false)
    }
  }

  const stats = useMemo(() => ([
    { label: 'Membros cadastrados', value: formatNumber(data.stats.members), hint: 'contas ativas no portal', icon: <Users size={18} /> },
    { label: 'Eventos publicados', value: formatNumber(data.stats.publishedEvents), hint: 'agenda oficial', icon: <CalendarDays size={18} /> },
    { label: 'Canais de TV', value: formatNumber(data.stats.tvChannels), hint: 'disponiveis no portal', icon: <Tv size={18} /> },
    { label: 'Pedidos em 7 dias', value: formatNumber(data.stats.musicRequests7d), hint: 'participacao na radio', icon: <Music2 size={18} /> },
  ]), [data.stats])

  return (
    <main className="bds-community-page">
      <CommunityHero onChat={() => navigate('/chat')} onEvents={() => navigate('/events')} />

      <section className="bds-community-section">
        <SectionHeader
          eyebrow="Dados reais do portal"
          title="Comunidade em numeros"
          subtitle="Sem estimativas de usuarios online ou mensagens do Xat: mostramos apenas o que o nosso sistema consegue medir de verdade."
          action={(
            <ActionButton variant="outline" icon={<RefreshCw size={16} />} onClick={load} disabled={loading}>
              Atualizar
            </ActionButton>
          )}
        />
        <div className="bds-community-stats-grid">
          {stats.map((item) => <StatCard key={item.label} {...item} />)}
        </div>
      </section>

      <section className="bds-community-section">
        <SectionHeader
          eyebrow="Agenda oficial"
          title="Proximos eventos"
          subtitle="Eventos publicados no mesmo banco usado pela pagina de Eventos."
          action={<ActionButton onClick={() => navigate('/events')}>Ver agenda completa</ActionButton>}
        />
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 text-sm text-[var(--text-secondary)]">Carregando eventos...</div>
        ) : data.events.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.events.map((event) => (
              <EventCard key={event.id} event={event} onOpen={() => navigate('/events')} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-[var(--surface)] p-6">
            <p className="font-bold text-[var(--text)]">Nenhum evento publicado agora.</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Quando a equipe publicar um evento, ele aparecera aqui automaticamente.</p>
          </div>
        )}
      </section>

      <section className="bds-community-section">
        <SectionHeader
          eyebrow="Membros"
          title="Quem escolheu aparecer"
          subtitle="Participacao publica e opcional. Perfis privados nunca sao listados."
        />
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
            {loading ? (
              <p className="text-sm text-[var(--text-secondary)]">Carregando membros...</p>
            ) : data.members.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {data.members.map((member) => <MemberCard key={member.id} member={member} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5">
                <p className="font-bold text-[var(--text)]">Ainda nao ha perfis publicos.</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">A lista cresce somente quando cada pessoa escolhe aparecer.</p>
              </div>
            )}
          </div>

          <ParticipationCard
            isAuthenticated={isAuthenticated}
            visible={communityVisible}
            busy={visibilityBusy}
            onLogin={() => openAuth('Entre para escolher se seu perfil deve aparecer na comunidade.', 'login')}
            onToggle={toggleVisibility}
          />
        </div>
        {feedback && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--text)]">{feedback}</p>
        )}
      </section>

      <section className="bds-community-section">
        <SectionHeader
          eyebrow="Participe"
          title="Onde a comunidade acontece"
          subtitle="O portal organiza os acessos; a conversa continua no Chat Oficial e as atividades nas areas correspondentes."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={() => navigate('/chat')} className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 text-left transition hover:border-[var(--primary)]/40">
            <MessageCircle size={22} className="text-[var(--primary)]" />
            <strong className="mt-4 block text-[var(--text)]">Chat Oficial</strong>
            <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">Entre na sala oficial sem sair do portal.</span>
          </button>
          <button type="button" onClick={() => navigate('/events')} className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 text-left transition hover:border-[var(--primary)]/40">
            <CalendarDays size={22} className="text-[var(--primary)]" />
            <strong className="mt-4 block text-[var(--text)]">Eventos</strong>
            <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">Confira a programacao oficial e as proximas atividades.</span>
          </button>
          <button type="button" onClick={() => navigate('/radio')} className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 text-left transition hover:border-[var(--primary)]/40">
            <Radio size={22} className="text-[var(--primary)]" />
            <strong className="mt-4 block text-[var(--text)]">Radio</strong>
            <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">Ouça a radio e envie pedidos de musica, inclusive como visitante.</span>
          </button>
          <button type="button" onClick={() => navigate('/profile')} className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 text-left transition hover:border-[var(--primary)]/40">
            <UserRound size={22} className="text-[var(--primary)]" />
            <strong className="mt-4 block text-[var(--text)]">Meu Perfil</strong>
            <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">Edite seu nome, @usuario, foto, bio e preferencias.</span>
          </button>
        </div>
      </section>

      {data.errors.length > 0 && (
        <p className="bds-community-section rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Parte dos dados da comunidade nao pode ser atualizada agora. O chat e as demais areas continuam disponiveis.
        </p>
      )}
    </main>
  )
}
