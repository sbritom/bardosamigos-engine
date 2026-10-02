import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const ROOT = process.cwd()
const ACTIVE_DIRS = ['src', 'api', 'server', 'scripts', 'public']
const ACTIVE_FILES = ['.env.example', 'README.md', 'RADIO.md', 'DEPLOY.md', 'API.md', 'INSTALL.md', 'SECURITY.md', 'CHANGELOG.md', 'ROADMAP.md', 'XAT.md', 'vercel.json', 'package.json']
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.txt', '.xml', '.yml', '.yaml', '.env'])
const FORBIDDEN = [
  /bar\s+dos\s+amigos/i,
  /rádio\s+bar\s+dos\s+amigos/i,
  /radio\s+bar\s+dos\s+amigos/i,
  /radiobardosamigos/i,
  /bardosamigos/i,
  /barstudio/i,
  /barcoins?/i,
  /barai/i,
  /\/ft\/bda/i,
  /\/barstudio\/designer/i,
]

async function listTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listTextFiles(fullPath))
      continue
    }
    if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(fullPath)
  }

  return files
}

test('codigo ativo nao contem identidade ou rotas do Bar dos Amigos', async () => {
  const files = []
  for (const directory of ACTIVE_DIRS) files.push(...await listTextFiles(path.join(ROOT, directory)))
  for (const filename of ACTIVE_FILES) files.push(path.join(ROOT, filename))

  const violations = []
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    for (const pattern of FORBIDDEN) {
      if (pattern.test(source)) {
        violations.push(`${path.relative(ROOT, file)} -> ${pattern}`)
      }
    }
  }

  assert.deepEqual(violations, [], `Referências legadas encontradas:\n${violations.join('\n')}`)
})

test('rotas e namespace públicos usam somente IMORTAL0800', async () => {
  const storageConstants = await readFile(path.join(ROOT, 'src/modules/imortal-tools/storage/storageConstants.js'), 'utf8')
  const storageProvider = await readFile(path.join(ROOT, 'src/modules/imortal-tools/storage/providers/SupabaseStorageProvider.js'), 'utf8')
  const registry = await readFile(path.join(ROOT, 'src/core/registry/plugins.jsx'), 'utf8')
  const vercel = await readFile(path.join(ROOT, 'vercel.json'), 'utf8')

  assert.match(storageConstants, /STORAGE_PREFIX\s*=\s*['"]imortal0800['"]/) 
  assert.match(storageProvider, /https:\/\/imortal0800\.vercel\.app/)
  assert.match(storageProvider, /\/media\/imortal\//)
  assert.match(registry, /\/tools\/designer/)
  assert.match(registry, /modules\/imortal-tools\/designer/)
  assert.match(vercel, /\/media\/imortal\/:filename/)
})
