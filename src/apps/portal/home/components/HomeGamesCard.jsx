import { Gamepad2, Newspaper, Sparkles, Swords, Trophy } from 'lucide-react'
import { ActionButton, FeatureCard } from '../../../../design-system'
import './homeGamesCard.css'

const GAME_AREAS = [
  {
    id: 'esports',
    eyebrow: 'Competitivo',
    title: 'Esports',
    description: 'Free Fire, Fortnite e os principais destaques do cenário competitivo.',
    icon: Swords,
    tags: ['Free Fire', 'Fortnite', 'Esports'],
  },
  {
    id: 'news',
    eyebrow: 'Radar gamer',
    title: 'Lançamentos & notícias',
    description: 'Novos jogos, temporadas, atualizações e notícias rápidas em um só lugar.',
    icon: Newspaper,
    tags: ['Lançamentos', 'Atualizações', 'Novidades'],
  },
  {
    id: 'championships',
    eyebrow: 'Em destaque',
    title: 'Campeonatos',
    description: 'Competições em destaque, próximos confrontos, resultados e calendário.',
    icon: Trophy,
    tags: ['Campeonatos', 'Resultados', 'Agenda'],
  },
]

export function HomeGamesCard() {
  return (
    <FeatureCard
      className="bds-home-card-full imortal-home-games"
      title="Games"
      icon={<Gamepad2 size={20} />}
      action={(
        <ActionButton variant="outline" onClick={() => { window.location.href = '/games' }}>
          Ver Games
        </ActionButton>
      )}
    >
      <div className="imortal-home-games__intro">
        <span>Esports, lançamentos, notícias rápidas e campeonatos em destaque.</span>
      </div>

      <div className="imortal-home-games__grid" data-designer-id="games.cards" data-designer-label="Games / Destaques">
        {GAME_AREAS.map(({ id, eyebrow, title, description, icon: Icon, tags }) => (
          <button
            key={id}
            className="imortal-home-games__item"
            type="button"
            onClick={() => { window.location.href = '/games' }}
          >
            <div className="imortal-home-games__item-top">
              <div className="imortal-home-games__icon" aria-hidden="true">
                <Icon size={20} />
              </div>
              <span>{eyebrow}</span>
            </div>

            <strong>{title}</strong>
            <p>{description}</p>

            <div className="imortal-home-games__tags" aria-hidden="true">
              {tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </button>
        ))}
      </div>

      <button className="imortal-home-games__cta" type="button" onClick={() => { window.location.href = '/games' }}>
        <Sparkles size={16} />
        <span>Explorar a central de Games</span>
      </button>
    </FeatureCard>
  )
}
