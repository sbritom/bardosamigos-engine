import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { createGNewsService } from '../src/core/sync/providers/gnews/gnewsService.js'
import { GNEWS_CATEGORIES } from '../src/core/sync/providers/gnews/gnewsConstants.js'

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

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required to run GNews sync.`)
  }
  return value
}

async function main() {
  const supabaseUrl = requiredEnv('VITE_SUPABASE_URL')
  const supabaseAnonKey = requiredEnv('VITE_SUPABASE_ANON_KEY')
  const gnewsApiKey = requiredEnv('VITE_GNEWS_API_KEY')
  const client = createClient(supabaseUrl, supabaseAnonKey)
  const service = createGNewsService({ client, apiKey: gnewsApiKey })
  const result = await service.sync({
    params: {
      categories: Object.values(GNEWS_CATEGORIES),
      max: Number(process.env.GNEWS_MAX || 10),
    },
  })
  const report = {
    news: result.records,
    elapsedMs: Date.now() - startedAt,
    error: result.error?.message || null,
    metadata: result.metadata,
  }

  console.log(JSON.stringify(report, null, 2))

  if (result.error) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
