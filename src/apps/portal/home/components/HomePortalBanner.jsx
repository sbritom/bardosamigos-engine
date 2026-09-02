import { useEffect, useState } from 'react'
import './homePortalBanner.css'

const SLIDES = [
  {
    id: 'portal',
    image: '/banners/imortal-simple-portal.svg',
    alt: 'IMORTAL0800',
    href: '/',
  },
  {
    id: 'chat',
    image: '/banners/imortal-simple-xat.svg',
    alt: 'Xat Oficial IMORTAL0800',
    href: 'https://xat.com/Imortal0800',
    external: true,
  },
  {
    id: 'football',
    image: '/banners/imortal-simple-football.svg',
    alt: 'Futebol IMORTAL0800',
    href: '/football',
  },
  {
    id: 'games',
    image: '/banners/imortal-simple-games.svg',
    alt: 'Games IMORTAL0800',
    href: '/games',
  },
]

export function HomePortalBanner() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeSlide = SLIDES[activeIndex]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [])

  function openSlide(slide) {
    if (slide.external) {
      window.open(slide.href, '_blank', 'noopener,noreferrer')
      return
    }

    window.location.href = slide.href
  }

  return (
    <section className="imortal-home-banner" aria-label="Destaques do IMORTAL0800">
      <img
        key={activeSlide.id}
        className="imortal-home-banner__image"
        src={activeSlide.image}
        alt={activeSlide.alt}
        loading="eager"
        decoding="async"
      />

      <button
        className="imortal-home-banner__action"
        type="button"
        aria-label={activeSlide.alt}
        onClick={() => openSlide(activeSlide)}
      />

      <div className="imortal-home-banner__indicators" aria-label="Selecionar banner">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === activeIndex ? 'is-active' : ''}
            aria-label={`Mostrar banner ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  )
}
