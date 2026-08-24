import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { SITE_URL, publicSeoPages } from '../src/apps/portal/seo/seoConfig.js'

const DIST_DIR = path.resolve('dist')
const ROOT_INDEX = path.join(DIST_DIR, 'index.html')

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`[seo-entrypoints] marcador ausente: ${label}`)
  }
  return html.replace(pattern, replacement)
}

function applySeo(template, page) {
  const canonical = `${SITE_URL}${page.path === '/' ? '' : page.path}`
  const title = escapeHtml(page.title)
  const description = escapeHtml(page.description)
  const canonicalAttr = escapeHtml(canonical)

  let html = template
  html = replaceRequired(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, 'title')
  html = replaceRequired(html, /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>(?![\s\S]*<link\s+rel="canonical")/, `<link rel="canonical" href="${canonicalAttr}" />`, 'canonical')
  html = replaceRequired(html, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="description")/, `<meta name="description" content="${description}" />`, 'description')
  html = replaceRequired(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="robots")/, '<meta name="robots" content="index,follow" />', 'robots')
  html = replaceRequired(html, /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+property="og:title")/, `<meta property="og:title" content="${title}" />`, 'og:title')
  html = replaceRequired(html, /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+property="og:description")/, `<meta property="og:description" content="${description}" />`, 'og:description')
  html = replaceRequired(html, /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+property="og:url")/, `<meta property="og:url" content="${canonicalAttr}" />`, 'og:url')
  html = replaceRequired(html, /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="twitter:title")/, `<meta name="twitter:title" content="${title}" />`, 'twitter:title')
  html = replaceRequired(html, /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="twitter:description")/, `<meta name="twitter:description" content="${description}" />`, 'twitter:description')
  return html
}

const template = await readFile(ROOT_INDEX, 'utf8')

for (const page of publicSeoPages) {
  const html = applySeo(template, page)
  const destination = page.path === '/'
    ? ROOT_INDEX
    : path.join(DIST_DIR, page.path.replace(/^\//, ''), 'index.html')

  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, html, 'utf8')
  console.log(`[seo-entrypoints] ${page.path} -> ${path.relative(DIST_DIR, destination)}`)
}
