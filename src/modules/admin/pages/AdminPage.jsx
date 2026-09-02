import { CalendarDays, Radio, Shield, Tv, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ActionButton, FeatureCard, HeroCard, SectionHeader, StatusBadge } from '../../../design-system'

const modules = [
  {
    title: 'Competition Admin',
    description: 'Campeonatos, temporadas, rodadas, times, jogos e resultados.',
    icon: Shield,
    path: '/admin/competition/campeonatos',
  },
  {
    title: 'TV Admin',
    description: 'Canais, categorias, destaques e configurações da TV do IMORTAL0800.',
    icon: Tv,
    path: '/admin/tv',
  },
  {
    title: 'Comunidade Admin',
    description: 'Moderação de recados, aniversariantes e acesso rápido aos eventos.',
    icon: Users,
    path: '/admin/community',
  },
  {
    title: 'Eventos Admin',
    description: 'Agenda, publicacao, destaques e edicao dos eventos do portal.',
    icon: CalendarDays,
    path: '/events/admin',
  },
  {
    title: 'Radio Admin',
    description: 'Pedidos de musica e operacao do painel do locutor.',
    icon: Radio,
    path: '/radio/admin',
  },
]

export default function AdminPage() {
  const navigate = useNavigate()

  return (
    <main className="bds-release-page">
      <HeroCard
        className="bds-release-hero"
        eyebrow="Acesso administrativo"
        title="Administracao do portal"
        subtitle="Os modulos abaixo usam rotas protegidas por cargo e continuam sujeitos as validacoes de API e RLS antes de qualquer alteracao de dados."
      />

      <section className="bds-release-section">
        <SectionHeader
          eyebrow="Modulos ativos"
          title="Areas administrativas"
          subtitle="Somente os modulos em manutencao nesta fase aparecem aqui."
        />
        <div className="bds-release-grid bds-release-grid--three">
          {modules.map(({ title, description, icon: Icon, path }) => (
            <FeatureCard
              key={title}
              icon={<Icon size={20} />}
              title={title}
              description={description}
              action={<StatusBadge status="PROTEGIDO">PROTEGIDO</StatusBadge>}
            >
              <ActionButton variant="outline" onClick={() => navigate(path)}>
                Abrir painel
              </ActionButton>
            </FeatureCard>
          ))}
        </div>
      </section>
    </main>
  )
}
