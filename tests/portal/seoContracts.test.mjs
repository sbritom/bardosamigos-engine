import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

import {
  DEFAULT_SOCIAL_IMAGE,
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  SITE_URL,
  getSeoForPath,
  publicSeoPages,
} from '../../src/apps/portal/seo/seoConfig.js'

const EXPECTED_SITE_URL = 'https://www.radiobardosamigos.com.br'
const EXPECTED_SOCIAL_IMAGE = '/social/bar-dos-amigos-social.jpg'

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
  assert.doesNotMatch(sitemap, /https:\/\/bardosamigos\.com\.br/)
  assert.doesNotMatch(sitemap, /\/barcoins|\/brincadeiras|\/games/)
})

test('robots aponta para o sitemap oficial e bloqueia areas internas ou congeladas', async () => {
  const robots = await source('public/robots.txt')

  assert.ok(robots.includes(`Sitemap: ${EXPECTED_SITE_URL}/sitemap.xml`))

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
    assert.ok(robots.split('\n').includes(`Disallow: ${path}`), `${path} deve estar bloqueada no robots.txt`)
  }
})

test('rotas nao publicadas para SEO continuam noindex no cliente', () => {
  for (const path of ['/admin', '/profile', '/settings', '/barcoins', '/brincadeiras', '/games', '/palpites']) {
    const seo = getSeoForPath(path)
    assert.equal(seo.robots, 'noindex,nofollow')
  }
})

test('capa social oficial usa formato horizontal para card grande', async () => {
  assert.equal(DEFAULT_SOCIAL_IMAGE, EXPECTED_SOCIAL_IMAGE)
  assert.equal(DEFAULT_SOCIAL_IMAGE_WIDTH, '600')
  assert.equal(DEFAULT_SOCIAL_IMAGE_HEIGHT, '315')
  assert.match(DEFAULT_SOCIAL_IMAGE_ALT, /Bar dos Amigos/)

  const imageInfo = await stat(new URL('../../public/social/bar-dos-amigos-social.jpg', import.meta.url))
  assert.ok(imageInfo.size > 5_000, 'capa social nao deve ser um placeholder vazio')
  assert.ok(imageInfo.size < 100_000, 'capa social deve permanecer leve para compartilhamento')
})

test('html inicial publica card social grande com a nova capa', async () => {
  const html = await source('index.html')
  const imageUrl = `${EXPECTED_SITE_URL}${EXPECTED_SOCIAL_IMAGE}`

  assert.ok(html.includes(`<link rel="canonical" href="${EXPECTED_SITE_URL}"`))
  assert.ok(html.includes(`<meta property="og:url" content="${EXPECTED_SITE_URL}"`))
  assert.ok(html.includes(`<meta property="og:image" content="${imageUrl}"`))
  assert.ok(html.includes(`<meta name="twitter:image" content="${imageUrl}"`))
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/)
  assert.match(html, /<meta property="og:image:width" content="600"/)
  assert.match(html, /<meta property="og:image:height" content="315"/)
})

test('paginas indexadas nao promovem modulos congelados no texto SEO', () => {
  for (const page of publicSeoPages) {
    assert.doesNotMatch(`${page.title} ${page.description}`, /BarCoins|Brincadeiras/i)
  }
})
