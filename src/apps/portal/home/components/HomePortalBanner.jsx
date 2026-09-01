import { Gamepad2, MessageCircle, Radio, Trophy, Tv } from 'lucide-react'
import { useEffect, useState } from 'react'
import './homePortalBanner.css'

const SLIDES = [
  {
    id: 'portal',
    eyebrow: 'IMORTAL0800',
    title: 'Tudo acontece aqui.',
    description: 'TV, Xat, futebol, games e música reunidos em um só lugar.',
    actionLabel: 'Assistir TV',
    actionHref: '/tv',
    icon: Tv,
  },
  {
    id: 'chat',
    eyebrow: 'XAT OFICIAL',
    title: 'Entre na resenha.',
    description: 'Acesse o chat oficial do IMORTAL0800 e acompanhe a comunidade em tempo real.',
    actionLabel: 'Abrir Xat',
    actionHref: 'https://xat.com/Imortal0800',
    external: true,
    icon: MessageCircle,
  },
  {
    id: 'football',
    eyebrow: 'FUTEBOL',
    title: 'Jogos, placares e tabelas.',
    description: 'Acompanhe os jogos do dia, resultados, estatísticas, escalações e bolão.',
    actionLabel: 'Ver Futebol',
    actionHref: '/football',
    icon: Trophy,
  },
  {
    id: 'games',
    eyebrow: 'GAMES',
    title: 'Free Fire, Fortnite e esports.',
    description: 'Novidades, campeonatos, lançamentos e jogos gratuitos em destaque.',
    actionLabel: 'Ver Games',
    actionHref: '/games',
    icon: Gamepad2,
  },
]

export function HomePortalBanner() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeSlide = SLIDES[activeIndex]
  const Icon = activeSlide.icon || Radio

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [])

  function openSlide(slide) {
    if (slide.external) {
      window.open(slide.actionHref, '_blank', 'noopener,noreferrer')
      return
    }

    window.location.href = slide.actionHref
  }

  return (
    <section className="imortal-home-banner" aria-label="Destaques do IMORTAL0800">
      <div className="imortal-home-banner__ambient" aria-hidden="true" />

      <div className="imortal-home-banner__content">
        <div className="imortal-home-banner__icon" aria-hidden="true">
          <Icon size={28} />
        </div>

        <div className="imortal-home-banner__copy" key={activeSlide.id}>
          <span className="imortal-home-banner__eyebrow">{activeSlide.eyebrow}</span>
          <h1>{activeSlide.title}</h1>
          <p>{activeSlide.description}</p>
        </div>

        <button
          className="imortal-home-banner__action"
          type="button"
          onClick={() => openSlide(activeSlide)}
        >
          {activeSlide.actionLabel}
        </button>
      </div>

      <div className="imortal-home-banner__dots" aria-label="Selecionar destaque">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            className={index === activeIndex ? 'is-active' : ''}
            type="button"
            aria-label={`Mostrar destaque ${index + 1}: ${slide.eyebrow}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  )
}
