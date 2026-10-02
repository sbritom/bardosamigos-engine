import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

import {
  DEFAULT_SOCIAL_IMAGE,
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_HEIGHT,
  DEFAULT_SOCIAL_IMAGE_TYPE,
  DEFAULT_SOCIAL_IMAGE_WIDTH,
  SITE_URL,
  getSeoForPath,
  publicSeoPages,
} from '../../src/apps/portal/seo/seoConfig.js'

const EXPECTED_SITE_URL = 'https://imortal0800.vercel.app'
const EXPECTED_SOCIAL_IMAGE = '/banners/imortal0800-portal.webp'

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
}

test('dominio canonico usa o endereco publico atual do IMORTAL0800', () => {
  assert.equal(SITE_URL, EXPECTED_SITE_URL)

  for (const page of publicSeoPages) {
    const seo = getSeoForPath(page.path)
    const suffix = page.path === '/' ? '' : page.path
    assert.equal(seo.canonical, `${EXPECTED_SITE_URL}${suffix}`)
    assert.equal(seo.robots, 'index,follow')
  }
})

test('sitemap contem exatamente as paginas SEO publicas e usa o dominio atual', async () => {
  const sitemap = await source('public/sitemap.xml')
  const locations = sitemapLocations(sitemap)
  const expected = publicSeoPages.map((page) => (
    page.path === '/' ? `${EXPECTED_SITE_URL}/` : `${EXPECTED_SITE_URL}${page.path}`
  ))

  assert.deepEqual(locations.sort(), expected.sort())
  assert.doesNotMatch(sitemap, /radiobardosamigos/i)
  assert.doesNotMatch(sitemap, /\/barcoins|\/brincadeiras|\/tools/)
})

test('robots aponta para o sitemap atual e bloqueia somente areas privadas ou internas', async () => {
  const robots = await source('public/robots.txt')
  const lines = robots.split('\n')

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
    '/radio/xat',
  ]) {
    assert.ok(lines.includes(`Disallow: ${path}`), `${path} deve estar bloqueada no robots.txt`)
  }

  for (const page of publicSeoPages.filter((item) => item.path !== '/')) {
    assert.ok(!lines.includes(`Disallow: ${page.path}`), `${page.path} nao pode ser bloqueada no robots.txt`)
  }
})

test('rotas nao publicadas para SEO continuam noindex no cliente', () => {
  for (const path of ['/admin', '/profile', '/settings', '/barcoins', '/brincadeiras', '/palpites']) {
    const seo = getSeoForPath(path)
    assert.equal(seo.robots, 'noindex,nofollow')
  }
})

test('capa social oficial usa a identidade atual do IMORTAL0800', async () => {
  assert.equal(DEFAULT_SOCIAL_IMAGE, EXPECTED_SOCIAL_IMAGE)
  assert.equal(DEFAULT_SOCIAL_IMAGE_WIDTH, '1180')
  assert.equal(DEFAULT_SOCIAL_IMAGE_HEIGHT, '140')
  assert.equal(DEFAULT_SOCIAL_IMAGE_TYPE, 'image/webp')
  assert.match(DEFAULT_SOCIAL_IMAGE_ALT, /IMORTAL0800/)

  const imageInfo = await stat(new URL('../../public/banners/imortal0800-portal.webp', import.meta.url))
  assert.ok(imageInfo.size > 5_000, 'capa social nao deve ser um placeholder vazio')
})

test('html inicial publica metadados da identidade atual', async () => {
  const html = await source('index.html')
  const imageUrl = `${EXPECTED_SITE_URL}${EXPECTED_SOCIAL_IMAGE}`

  assert.ok(html.includes(`<link rel="canonical" href="${EXPECTED_SITE_URL}"`))
  assert.ok(html.includes(`<meta property="og:url" content="${EXPECTED_SITE_URL}"`))
  assert.ok(html.includes(`<meta property="og:image" content="${imageUrl}"`))
  assert.ok(html.includes(`<meta property="og:image:secure_url" content="${imageUrl}"`))
  assert.ok(html.includes(`<meta property="og:image:type" content="image/webp"`))
  assert.ok(html.includes(`<meta name="twitter:image" content="${imageUrl}"`))
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/)
  assert.match(html, /<meta property="og:image:width" content="1180"/)
  assert.match(html, /<meta property="og:image:height" content="140"/)
  assert.doesNotMatch(html, /radiobardosamigos/i)
})

test('Vercel envia somente as rotas SEO publicas para entrypoints indexaveis', async () => {
  const config = JSON.parse(await source('vercel.json'))
  const rewrites = new Map(config.rewrites.map((item) => [item.source, item.destination]))

  assert.equal(rewrites.get('/'), '/index.html')

  for (const page of publicSeoPages.filter((item) => item.path !== '/')) {
    assert.equal(
      rewrites.get(page.path),
      `${page.path}/index.html`,
      `${page.path} deve apontar para seu entrypoint estatico`,
    )
  }

  assert.equal(rewrites.get('/(.*)'), '/noindex/index.html')
})

test('paginas indexadas nao promovem modulos legados no texto SEO', () => {
  for (const page of publicSeoPages) {
    assert.doesNotMatch(`${page.title} ${page.description}`, /Bar dos Amigos|BarCoins|Brincadeiras/i)
  }
})
