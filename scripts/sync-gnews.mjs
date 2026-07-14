import { existsSync, readFileSync } from 'node:fs'
import { syncGNewsToSupabase } from '../api/_lib/newsCacheService.js'

const startedAt = Date.now()

function loadEnvLocal() {
  if (!existsSync('.env.local')) return

  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) return

      const [, key, rawValue] = match
      if (!process.env[key]) {
        process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '').trim()
      }
    })
}

loadEnvLocal()

async function main() {
  const result = await syncGNewsToSupabase()
  const report = {
    ...result,
    elapsedMs: Date.now() - startedAt,
  }

  console.log(JSON.stringify(report, null, 2))

  if (!result.ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
