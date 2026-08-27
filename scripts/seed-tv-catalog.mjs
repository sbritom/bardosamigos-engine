import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { getLocalTVPlatformCatalog } from '../src/modules/tv/data/tvFallbackCatalog.js'

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

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required to seed TV catalog.`)
  return value
}

function clientKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
}

function toCategoryPayload(category) {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    color: category.color,
    display_order: category.displayOrder,
    enabled: true,
  }
}

function toChannelPayload(channel, categoryId) {
  return {
    category_id: categoryId,
    name: channel.name,
    slug: channel.slug,
    description: channel.description,
    logo: channel.logo,
    provider: channel.provider,
    embed_url: channel.embedUrl,
    country: channel.country,
    language: channel.language,
    featured: false,
    verified: channel.verified,
    enabled: true,
    display_order: channel.displayOrder,
  }
}

async function findBySlug(client, table, slug) {
  const { data, error } = await client
    .from(table)
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function upsertBySlug(client, table, payload) {
  const existing = await findBySlug(client, table, payload.slug)
  if (existing?.id) {
    const { data, error } = await client
      .from(table)
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw error
    return { data, action: 'updated' }
  }

  const { data, error } = await client
    .from(table)
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return { data, action: 'created' }
}

async function main() {
  loadEnvLocal()

  const dryRun = process.argv.includes('--dry-run')
  const catalog = getLocalTVPlatformCatalog()
  const report = {
    source: catalog.source,
    mode: dryRun ? 'dry-run' : 'write',
    categoriesPrepared: catalog.categories.length,
    channelsPrepared: catalog.channels.length,
    duplicatesSkipped: catalog.duplicates.length,
    categoriesCreated: 0,
    categoriesUpdated: 0,
    channelsCreated: 0,
    channelsUpdated: 0,
    elapsedMs: 0,
  }

  if (dryRun) {
    report.elapsedMs = Date.now() - startedAt
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const supabaseUrl = requiredEnv('VITE_SUPABASE_URL')
  const supabaseKey = clientKey()
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is required.')
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const categoryIds = new Map()

  for (const category of catalog.categories) {
    const result = await upsertBySlug(client, 'tv_categories', toCategoryPayload(category))
    categoryIds.set(category.slug, result.data.id)
    if (result.action === 'created') report.categoriesCreated += 1
    else report.categoriesUpdated += 1
  }

  for (const channel of catalog.channels) {
    const categoryId = categoryIds.get(channel.category.slug)
    const result = await upsertBySlug(client, 'tv_channels', toChannelPayload(channel, categoryId))
    if (result.action === 'created') report.channelsCreated += 1
    else report.channelsUpdated += 1
  }

  report.elapsedMs = Date.now() - startedAt
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
