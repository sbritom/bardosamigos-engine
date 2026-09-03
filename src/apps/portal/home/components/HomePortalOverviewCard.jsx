import {
  CalendarDays,
  Gamepad2,
  Headphones,
  Newspaper,
  Radio,
  Trophy,
  Tv,
  UserRound,
  Users,
} from 'lucide-react'
import { FeatureCard } from '../../../../design-system'
import './homePortalOverviewCard.css'

const PORTAL_AREAS = [
  {
    id: 'radio',
    title: 'Rádio',
    description: 'Ouça ao vivo, acompanhe a programação e faça seu pedido musical.',
    path: '/radio',
    icon: Radio,
  },
  {
    id: 'tv',
    title: 'TV',
    description: 'Canais ao vivo organizados em uma central simples e rápida.',
    path: '/tv',
    icon: Tv,
  },
  {
    id: 'football',
    title: 'Futebol',
    description: 'Jogos, resultados, classificação, estatísticas e bolão.',
    path: '/football',
    icon: Trophy,
  },
  {
    id: 'games',
    title: 'Games',
    description: 'Esports, lançamentos, campeonatos e jogos grátis.',
    path: '/games',
    icon: Gamepad2,
  },
  {
    id: 'community',
    title: 'Comunidade',
    description: 'Recados, aniversariantes, regras e novidades da comunidade.',
    path: '/community',
    icon: Users,
  },
  {
    id: 'events',
    title: 'Eventos',
    description: 'Confira a agenda oficial e os próximos eventos do IMORTAL0800.',
    path: '/events',
    icon: CalendarDays,
  },
  {
    id: 'news',
    title: 'Notícias',
    description: 'Destaques e informações reunidos em uma leitura organizada.',
    path: '/news',
    icon: Newspaper,
  },
  {
    id: 'profile',
    title: 'Sua conta',
    description: 'Acesse seu perfil, favoritos e preferências pessoais.',
    path: '/profile',
    icon: UserRound,
  },
]

export function HomePortalOverviewCard() {
  return (
    <FeatureCard
      className="bds-home-card-full imortal-home-overview"
      title="Explore o IMORTAL0800"
      icon={<Headphones size={20} />}
    >
      <div className="imortal-home-overview__intro">
        <span>Um resumo das principais áreas do portal. Escolha onde quer entrar.</span>
      </div>

      <div
        className="imortal-home-overview__grid"
        data-designer-id="portal.overview"
        data-designer-label="Portal / Visão geral"
      >
        {PORTAL_AREAS.map(({ id, title, description, path, icon: Icon }) => (
          <button
            key={id}
            className="imortal-home-overview__item"
            type="button"
            onClick={() => { window.location.href = path }}
          >
            <span className="imortal-home-overview__icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className="imortal-home-overview__copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </div>
    </FeatureCard>
  )
}
