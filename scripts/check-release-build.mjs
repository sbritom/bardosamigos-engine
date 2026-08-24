import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { SITE_URL, publicSeoPages } from '../src/apps/portal/seo/seoConfig.js'

const DIST_DIR = path.resolve('dist')

function fail(message) {
  console.error(`[release-smoke] ${message}`)
  process.exitCode = 1
}

function canonicalFor(page) {
  return `${SITE_URL}${page.path === '/' ? '' : page.path}`
}

for (const page of publicSeoPages) {
  const file = page.path === '/'
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, page.path.replace(/^\//, ''), 'index.html')

  let html = ''
  try {
    html = await readFile(file, 'utf8')
  } catch {
    fail(`entrypoint ausente para ${page.path}: ${path.relative(DIST_DIR, file)}`)
    continue
  }

  const canonical = canonicalFor(page)
  const checks = [
    [`<title>${page.title}</title>`, 'title'],
    [`href="${canonical}"`, 'canonical'],
    [`property="og:url" content="${canonical}"`, 'og:url'],
    [`name="description" content="${page.description}"`, 'description'],
    ['name="robots" content="index,follow"', 'robots'],
  ]

  for (const [needle, label] of checks) {
    if (!html.includes(needle)) fail(`${page.path}: ${label} incorreto`)
  }
}

try {
  const robots = await readFile(path.join(DIST_DIR, 'robots.txt'), 'utf8')
  const sitemap = await readFile(path.join(DIST_DIR, 'sitemap.xml'), 'utf8')
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) fail('robots.txt nao aponta para o sitemap oficial')
  if (!sitemap.includes(`${SITE_URL}/`)) fail('sitemap.xml nao usa o dominio oficial')
} catch {
  fail('robots.txt ou sitemap.xml ausente no dist')
}

if (!process.exitCode) console.log(`[release-smoke] ${publicSeoPages.length} rotas publicas validadas com sucesso.`)
