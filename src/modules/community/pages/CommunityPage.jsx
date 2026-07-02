import {
  Award,
  BadgeCheck,
  CalendarDays,
  Crown,
  Flame,
  Gift,
  MessageCircle,
  Mic2,
  Music2,
  PartyPopper,
  Radio,
  Sparkles,
  Star,
  Trophy,
  Tv,
  Users,
} from 'lucide-react'
import {
  ActionButton,
  FeatureCard,
  HeroCard,
  SectionHeader,
  StatCard,
  StatusBadge,
} from '../../../design-system'
import { XAT_CHAT_PUBLIC_URL } from '../../chat/constants'

const communityStats = [
  { label: 'Usuarios online', value: '128', hint: 'na sala oficial', icon: <Users size={18} /> },
  { label: 'Mensagens hoje', value: '47.320', hint: 'movimento do xat', icon: <MessageCircle size={18} /> },
  { label: 'Eventos ativos', value: '7', hint: 'programacao da semana', icon: <CalendarDays size={18} /> },
  { label: 'Brincadeiras', value: '12', hint: 'quiz, bolao e resenha', icon: <PartyPopper size={18} /> },
  { label: 'BarCoins', value: '84.500', hint: 'distribuidas na comunidade', icon: <Gift size={18} /> },
]

const events = [
  ['Noite do Karaoke', 'Microfone aberto para a comunidade soltar a voz.', Mic2, 'Hoje'],
  ['Quiz dos Amigos', 'Perguntas rapidas, ranking e muita provocacao saudavel.', Sparkles, 'Ao vivo'],
  ['Futebol no Bar', 'Resenha antes, durante e depois dos grandes jogos.', Trophy, 'Especial'],
  ['Sao Joao', 'Festa junina, brincadeiras e premios sociais.', PartyPopper, 'Temporada'],
  ['Halloween', 'Noite tematica com desafios e surpresas.', Flame, 'Em breve'],
  ['Natal dos Amigos', 'Evento especial de fim de ano da comunidade.', Gift, 'Em breve'],
]

const achievements = [
  ['Primeira visita', 'Entrou pela primeira vez no Bar.', BadgeCheck],
  ['100 mensagens', 'Participacao constante no xat.', MessageCircle],
  ['1 ano no Bar', 'Presenca de longa data.', Star],
  ['Top 10', 'Entre os mais ativos da comunidade.', Crown],
  ['Campeao do Bolao', 'Venceu uma competicao oficial.', Trophy],
  ['Rei do Quiz', 'Mandou bem nas perguntas.', Sparkles],
  ['Veterano', 'Historia viva do Bar dos Amigos.', Award],
  ['Apoiador', 'Ajuda a comunidade a crescer.', Gift],
  ['Administrador', 'Cuida da ordem da sala.', BadgeCheck],
]

const rankings = [
  ['Top BarCoins', 'Ranking social preparado para recompensas.', '84.500 pts'],
  ['Top Participacao', 'Movimento no portal e presenca no xat.', '12.840 pts'],
  ['Top Quiz', 'Pontuacao dos desafios da comunidade.', '2.180 pts'],
  ['Top Bolao', 'Desempenho nas competicoes esportivas.', '1.720 pts'],
]

const missions = [
  ['Entrar no portal', 'Acesse o Bar dos Amigos diariamente.', Users, '+10 XP'],
  ['Participar do Quiz', 'Entre na brincadeira quando o quiz iniciar.', Sparkles, '+25 XP'],
  ['Ouvir Radio', 'Acompanhe a programacao do Bar.', Radio, '+15 XP'],
  ['Assistir TV', 'Participe dos eventos transmitidos.', Tv, '+15 XP'],
  ['Participar do Bolao', 'Faca seu palpite nas partidas.', Trophy, '+30 XP'],
  ['Entrar no xat', 'Volte para a sala oficial da comunidade.', MessageCircle, '+20 XP'],
]

const activities = [
  ['Novo evento disponivel', 'Quiz dos Amigos entra na programacao da semana.'],
  ['Novo campeao do bolao', 'Resultado oficial atualizado no Bar Competition.'],
  ['Nova musica adicionada', 'Radio pronta para animar a comunidade.'],
  ['Novo torneio', 'Futebol no Bar preparado para a proxima rodada.'],
]

const birthdays = [
  ['Hoje', 'Agenda privada preparada para aniversariantes do dia.'],
  ['Esta semana', 'Celebracoes da comunidade aparecem aqui.'],
  ['Proximos', 'Lembretes futuros sem expor usuarios publicamente.'],
]

function openXat() {
  window.open(XAT_CHAT_PUBLIC_URL, '_blank', 'noopener,noreferrer')
}

function CommunityHero() {
  return (
    <HeroCard className="bds-community-hero">
      <div className="bds-community-hero__seal" aria-hidden="true">
        <Crown size={42} />
      </div>
      <div className="bds-community-hero__content">
        <StatusBadge status="ONLINE">128 usuarios online</StatusBadge>
        <h1>Comunidade Bar dos Amigos</h1>
        <p>
          A extensao oficial do xat Bar dos Amigos. Eventos, missoes, conquistas e ranking existem para
          trazer todo mundo de volta para a sala oficial.
        </p>
        <div className="bds-community-hero__actions">
          <ActionButton icon={<MessageCircle size={18} />} onClick={openXat}>Entrar no Chat Oficial</ActionButton>
          <ActionButton variant="outline" icon={<CalendarDays size={18} />}>Ver eventos</ActionButton>
        </div>
      </div>
    </HeroCard>
  )
}

function EventCard({ event }) {
  const [title, description, Icon, status] = event

  return (
    <article className="bds-community-event-card">
      <div className="bds-community-event-card__media">
        <Icon size={34} />
      </div>
      <div>
        <StatusBadge status={status}>{status}</StatusBadge>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ActionButton variant="outline" onClick={openXat}>Participar</ActionButton>
    </article>
  )
}

function AchievementBadge({ item }) {
  const [title, description, Icon] = item

  return (
    <article className="bds-community-achievement">
      <div className="bds-community-achievement__icon"><Icon size={22} /></div>
      <strong>{title}</strong>
      <span>{description}</span>
    </article>
  )
}

function MissionCard({ mission }) {
  const [title, description, Icon, reward] = mission

  return (
    <article className="bds-community-mission">
      <div className="bds-community-mission__icon"><Icon size={20} /></div>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <StatusBadge status={reward}>{reward}</StatusBadge>
    </article>
  )
}

export default function CommunityPage() {
  return (
    <main className="bds-community-page">
      <CommunityHero />

      <section className="bds-community-section">
        <SectionHeader eyebrow="Comunidade em numeros" title="Estatisticas" subtitle="Dados agregados, sem listar nomes, nicks ou avatares." />
        <div className="bds-community-stats-grid">
          {communityStats.map((item) => <StatCard key={item.label} {...item} />)}
        </div>
      </section>

      <section className="bds-community-section">
        <SectionHeader eyebrow="Programacao" title="Eventos" subtitle="Tudo aponta para participacao na sala oficial do xat." action={<ActionButton onClick={openXat}>Entrar no xat</ActionButton>} />
        <div className="bds-community-events-grid">
          {events.map((event) => <EventCard key={event[0]} event={event} />)}
        </div>
      </section>

      <section className="bds-community-section">
        <SectionHeader eyebrow="Badges" title="Conquistas" subtitle="Sistema visual preparado para integrar perfil, bolao e BarCoins." />
        <div className="bds-community-achievements-grid">
          {achievements.map((item) => <AchievementBadge key={item[0]} item={item} />)}
        </div>
      </section>

      <div className="bds-community-columns">
        <FeatureCard icon={<Crown size={20} />} eyebrow="Preparado para dados reais" title="Ranking" description="Rankings sociais agregados, sem substituir o xat.">
          <div className="bds-community-list">
            {rankings.map(([title, description, score]) => (
              <article key={title} className="bds-community-ranking-row">
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <StatusBadge status={score}>{score}</StatusBadge>
              </article>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard icon={<Sparkles size={20} />} eyebrow="BarCoins futuro" title="Missoes" description="Acoes simples para movimentar a comunidade.">
          <div className="bds-community-list">
            {missions.map((mission) => <MissionCard key={mission[0]} mission={mission} />)}
          </div>
        </FeatureCard>
      </div>

      <div className="bds-community-columns bds-community-columns--bottom">
        <FeatureCard icon={<Flame size={20} />} eyebrow="Portal" title="Atividade recente" description="Somente atividades do portal, nunca feed social.">
          <div className="bds-community-list">
            {activities.map(([title, description]) => (
              <article key={title} className="bds-community-activity">
                <span />
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard icon={<Gift size={20} />} eyebrow="Agenda" title="Aniversariantes" description="Card elegante preparado para dados privados.">
          <div className="bds-community-birthdays">
            {birthdays.map(([label, description]) => (
              <article key={label}>
                <strong>{label}</strong>
                <span>{description}</span>
              </article>
            ))}
          </div>
          <div className="bds-community-xat-callout">
            <Music2 size={20} />
            <span>As comemoracoes acontecem na sala oficial.</span>
            <ActionButton variant="secondary" onClick={openXat}>Entrar no Chat Oficial</ActionButton>
          </div>
        </FeatureCard>
      </div>
    </main>
  )
}
