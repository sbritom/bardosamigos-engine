import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import {
  DEFAULT_SOCIAL_IMAGE,
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  SITE_NAME,
  SITE_URL,
  THEME_COLOR,
  getSeoForPath,
} from './seoConfig'

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export default function PortalSeo() {
  const location = useLocation()

  useEffect(() => {
    const seo = getSeoForPath(location.pathname)
    const imageUrl = new URL(DEFAULT_SOCIAL_IMAGE, SITE_URL).toString()

    document.documentElement.lang = 'pt-BR'
    document.title = seo.title

    upsertMeta('meta[name="description"]', { name: 'description', content: seo.description })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: seo.robots })
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: THEME_COLOR })
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'pt_BR' })
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: seo.canonical })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: imageUrl })
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: DEFAULT_SOCIAL_IMAGE_WIDTH })
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: DEFAULT_SOCIAL_IMAGE_HEIGHT })
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: DEFAULT_SOCIAL_IMAGE_ALT })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: imageUrl })
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt', content: DEFAULT_SOCIAL_IMAGE_ALT })
    upsertLink('canonical', seo.canonical)
  }, [location.pathname])

  return null
}
