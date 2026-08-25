import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repairMigrationUrl = new URL(
  '../../supabase/migrations/20260825120402_repair_tv_platform_schema.sql',
  import.meta.url,
)
const optimizeMigrationUrl = new URL(
  '../../supabase/migrations/20260825121029_optimize_tv_platform_policies.sql',
  import.meta.url,
)
const overviewUrl = new URL('../../api/community/overview.js', import.meta.url)

async function source(url) {
  return readFile(url, 'utf8')
}

test('schema moderno da TV cria tabelas usadas pelo repository', async () => {
  const sql = await source(repairMigrationUrl)

  for (const table of ['tv_categories', 'tv_featured', 'tv_favorites', 'tv_recent']) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, 'i'))
  }

  for (const column of ['category_id', 'name', 'slug', 'embed_url', 'enabled', 'display_order', 'updated_at']) {
    assert.match(sql, new RegExp(`tv_channels add column if not exists ${column}`, 'i'))
  }
})

test('RLS da TV usa bda_is_admin e auth uid otimizado', async () => {
  const sql = await source(repairMigrationUrl)

  assert.match(sql, /public\.bda_is_admin\(\)/i)
  assert.doesNotMatch(sql, /public\.is_admin\(\)/i)
  assert.match(sql, /\(select auth\.uid\(\)\)/i)
})

test('policies e FKs da TV sao consolidadas para o runtime ativo', async () => {
  const sql = await source(optimizeMigrationUrl)

  assert.match(sql, /drop policy if exists "Admins can manage tv_channels"/i)
  assert.match(sql, /tv_featured_channel_id_idx/i)
  assert.match(sql, /tv_favorites_channel_id_idx/i)
  assert.match(sql, /tv_recent_channel_id_idx/i)
})

test('Community conta canais pela coluna moderna enabled', async () => {
  const overview = await source(overviewUrl)

  assert.match(overview, /from\('tv_channels'\)[\s\S]*?eq\('enabled', true\)/i)
  assert.doesNotMatch(overview, /from\('tv_channels'\)[\s\S]*?eq\('ativo', true\)/i)
})
