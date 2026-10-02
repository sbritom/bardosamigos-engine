import { readFile, readdir, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import process from 'node:process'

const DIST_DIR = path.resolve('dist')
const LIMITS = Object.freeze({
  js: 400 * 1024,
  css: 230 * 1024,
  image: 2_300_000,
  initialGzip: 270 * 1024,
})

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath))
      continue
    }

    if (entry.isFile()) files.push(fullPath)
  }

  return files
}

function classify(filePath) {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.js') return 'js'
  if (extension === '.css') return 'css'
  if (IMAGE_EXTENSIONS.has(extension)) return 'image'
  return null
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function extractInitialAssetPaths(html) {
  const paths = new Set()
  const pattern = /(?:src|href)=["'](\/assets\/[^"']+\.(?:js|css))["']/gi
  let match

  while ((match = pattern.exec(html)) !== null) {
    paths.add(match[1].replace(/^\//, ''))
  }

  return [...paths]
}

async function measureInitialGzip() {
  const html = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8')
  const assetPaths = extractInitialAssetPaths(html)
  let total = 0
  const assets = []

  for (const assetPath of assetPaths) {
    const filePath = path.join(DIST_DIR, assetPath)
    const content = await readFile(filePath)
    const gzipSize = gzipSync(content, { level: 9 }).length
    total += gzipSize
    assets.push({ file: assetPath, gzipSize })
  }

  return { total, assets }
}

async function main() {
  let files
  try {
    files = await walk(DIST_DIR)
  } catch {
    console.error('[portal-budget] dist/ nao encontrado. Execute npm run build primeiro.')
    process.exit(1)
  }

  const measured = []
  for (const filePath of files) {
    const type = classify(filePath)
    if (!type) continue
    const info = await stat(filePath)
    measured.push({
      type,
      size: info.size,
      file: path.relative(DIST_DIR, filePath),
    })
  }

  const violations = measured.filter((asset) => asset.size > LIMITS[asset.type])

  for (const type of ['js', 'css', 'image']) {
    const largest = measured
      .filter((asset) => asset.type === type)
      .sort((a, b) => b.size - a.size)[0]

    if (largest) {
      console.log(`[portal-budget] maior ${type}: ${largest.file} (${formatBytes(largest.size)}) / limite ${formatBytes(LIMITS[type])}`)
    }
  }

  const initial = await measureInitialGzip()
  console.log(`[portal-budget] carga inicial gzip: ${formatBytes(initial.total)} / limite ${formatBytes(LIMITS.initialGzip)}`)
  initial.assets
    .sort((a, b) => b.gzipSize - a.gzipSize)
    .forEach((asset) => {
      console.log(`[portal-budget]   ${asset.file}: ${formatBytes(asset.gzipSize)} gzip`)
    })

  if (initial.total > LIMITS.initialGzip) {
    console.error(`\n[portal-budget] carga inicial gzip excedida: ${formatBytes(initial.total)} > ${formatBytes(LIMITS.initialGzip)}`)
    process.exit(1)
  }

  if (violations.length) {
    console.error('\n[portal-budget] limite excedido:')
    violations
      .sort((a, b) => b.size - a.size)
      .forEach((asset) => {
        console.error(`- ${asset.file}: ${formatBytes(asset.size)} > ${formatBytes(LIMITS[asset.type])}`)
      })
    process.exit(1)
  }

  console.log('[portal-budget] assets e carga inicial dentro dos limites definidos.')
}

await main()
