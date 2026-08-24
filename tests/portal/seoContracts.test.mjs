import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  SITE_URL,
  getSeoForPath,
  publicSeoPages,
} from '../../src/apps/portal/seo/seoConfig.js'

const EXPECTED_SITE_URL = 'https://www.radiobardosamigos.com.br'

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
}

test('dominio canonico usa o endereco publico de producao', () => {
  assert.equal(SITE_URL, EXPECTED_SITE_URL)

  for (const page of publicSeoPages) {
    const seo = getSeoForPath(page.path)
    const suffix = page.path === '/' ? '' : page.path
    assert.equal(seo.canonical, `${EXPECTED_SITE_URL}${suffix}`)
    assert.equal(seo.robots, 'index,follow')
  }
})

test('sitemap contem somente as paginas SEO publicas e usa o dominio oficial', async () => {
  const sitemap = await source('public/sitemap.xml')
  const locations = sitemapLocations(sitemap)
  const expected = publicSeoPages.map((page) => (
    page.path === '/' ? `${EXPECTED_SITE_URL}/` : `${EXPECTED_SITE_URL}${page.path}`
  ))

  assert.deepEqual(locations.sort(), expected.sort())
  assert.doesNotMatch(sitemap, /bardosamigos\.com\.br(?!\/)/)
  assert.doesNotMatch(sitemap, /\/barcoins|\/brincadeiras|\/games/)
})

test('robots aponta para o sitemap oficial e bloqueia areas internas ou congeladas', async () => {
  const robots = await source('public/robots.txt')

  assert.match(robots, new RegExp(`Sitemap: ${EXPECTED_SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/sitemap\\.xml`))

  for (const path of [
    '/admin',
    '/radio/admin',
    '/events/admin',
    '/profile',
    '/settings',
    '/for-you',
    '/meus-palpites',
    '/palpites',
    '/barcoins',
    '/brincadeiras',
    '/games',
  ]) {
    assert.match(robots, new RegExp(`Disallow: ${path.replace('/', '\\/')}(?:\\n|$)`))
  }
})

test('rotas nao publicadas para SEO continuam noindex no cliente', () => {
  for (const path of ['/admin', '/profile', '/settings', '/barcoins', '/brincadeiras', '/games', '/palpites']) {
    const seo = getSeoForPath(path)
    assert.equal(seo.robots, 'noindex,nofollow')
  }
})

test('html inicial usa dominio correto e card social coerente com favicon quadrado', async () => {
  const html = await source('index.html')

  assert.match(html, new RegExp(`<link rel="canonical" href="${EXPECTED_SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`))
  assert.match(html, new RegExp(`<meta property="og:url" content="${EXPECTED_SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`))
  assert.match(html, /<meta name="twitter:card" content="summary"/)
  assert.match(html, /<meta property="og:image:width" content="256"/)
  assert.match(html, /<meta property="og:image:height" content="256"/)
})

test('paginas indexadas nao promovem modulos congelados no texto SEO', () => {
  for (const page of publicSeoPages) {
    assert.doesNotMatch(`${page.title} ${page.description}`, /BarCoins|Brincadeiras/i)
  }
})
