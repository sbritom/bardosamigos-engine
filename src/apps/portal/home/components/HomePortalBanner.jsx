import { useEffect, useState } from 'react'
import './homePortalBanner.css'

const SLIDES = [
  {
    id: 'portal',
    image: '/banners/imortal0800-portal.webp',
    eyebrow: 'IMORTAL0800',
    title: 'Tudo acontece aqui.',
    subtitle: 'TV, Xat, futebol, games e rádio em um só lugar.',
    alt: 'IMORTAL0800 — Tudo acontece aqui.',
    fallbackTitle: 'IMORTAL0800',
    actionLabel: 'Conhecer o portal',
    actionHref: '/tv',
  },
  {
    id: 'chat',
    image: '/banners/imortal0800-xat.webp',
    eyebrow: 'XAT OFICIAL',
    title: 'Entre na resenha.',
    subtitle: 'Comunidade em tempo real.',
    alt: 'Xat Oficial IMORTAL0800 — Entre na resenha.',
    fallbackTitle: 'XAT OFICIAL',
    actionLabel: 'Abrir Xat',
    actionHref: 'https://xat.com/Imortal0800',
    external: true,
  },
  {
    id: 'football',
    image: '/banners/imortal0800-football.webp',
    eyebrow: 'FUTEBOL',
    title: 'Jogos, placares e tabelas.',
    subtitle: 'Resultados, estatísticas, escalações e muito mais.',
    alt: 'Futebol — Jogos, placares e tabelas.',
    fallbackTitle: 'FUTEBOL',
    actionLabel: 'Ver Futebol',
    actionHref: '/football',
  },
  {
    id: 'games',
    image: '/banners/imortal0800-games.webp',
    eyebrow: 'GAMES',
    title: 'Free Fire, Fortnite e esports.',
    subtitle: 'Novidades, campeonatos e lançamentos.',
    alt: 'Games — Free Fire, Fortnite e esports.',
    fallbackTitle: 'GAMES',
    actionLabel: 'Ver Games',
    actionHref: '/games',
  },
]

export function HomePortalBanner() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState({})
  const activeSlide = SLIDES[activeIndex]
  const imageFailed = Boolean(failedImages[activeSlide.id])

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
    <section className="imortal-home-banner" data-slide={activeSlide.id} aria-label="Destaques do IMORTAL0800">
      {!imageFailed && (
        <img
          key={activeSlide.id}
          className="imortal-home-banner__image"
          src={activeSlide.image}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={() => setFailedImages((current) => ({ ...current, [activeSlide.id]: true }))}
        />
      )}

      <div className="imortal-home-banner__shade" aria-hidden="true" />

      <div className="imortal-home-banner__content">
        <span>{activeSlide.eyebrow}</span>
        <strong>{activeSlide.title}</strong>
        <small>{activeSlide.subtitle}</small>
      </div>

      {imageFailed && (
        <div className="imortal-home-banner__fallback" role="img" aria-label={activeSlide.alt}>
          <strong>{activeSlide.fallbackTitle}</strong>
        </div>
      )}

      <button
        className="imortal-home-banner__action-hotspot"
        type="button"
        aria-label={activeSlide.actionLabel}
        onClick={() => openSlide(activeSlide)}
      />

      <div className="imortal-home-banner__dot-hotspots" aria-label="Selecionar destaque">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`Mostrar destaque ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  )
}
