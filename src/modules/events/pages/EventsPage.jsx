import { CalendarDays, Flame, Gift, Mic2, PartyPopper, Trophy } from 'lucide-react'
import { ActionButton, FeatureCard, HeroCard, SectionHeader, StatusBadge } from '../../../design-system'

const events = [
  ['Noite do Karaoke', 'Musica e resenha no xat oficial.', Mic2, 'Hoje'],
  ['Quiz dos Amigos', 'Perguntas rapidas e ranking social.', Flame, 'Semana'],
  ['Futebol no Bar', 'Resenha dos jogos principais.', Trophy, 'Ao vivo'],
  ['Sao Joao', 'Evento tematico da comunidade.', PartyPopper, 'Temporada'],
  ['Natal dos Amigos', 'Comemoracao especial de fim de ano.', Gift, 'Futuro'],
]

export default function EventsPage() {
  return (
    <main className="bds-release-page">
      <HeroCard className="bds-release-hero" eyebrow="Eventos" title="Calendario da comunidade" subtitle="Eventos existem para movimentar o portal e levar os amigos para o xat oficial." action={<ActionButton icon={<CalendarDays size={18} />}>Ver calendario</ActionButton>} />
      <section className="bds-release-section">
        <SectionHeader eyebrow="Programacao" title="Eventos ativos e futuros" />
        <div className="bds-release-grid bds-release-grid--three">
          {events.map(([title, description, Icon, status]) => <FeatureCard key={title} icon={<Icon size={20} />} eyebrow={status} title={title} description={description} action={<StatusBadge status={status}>{status}</StatusBadge>}><ActionButton variant="outline">Participar</ActionButton></FeatureCard>)}
        </div>
      </section>
    </main>
  )
}
