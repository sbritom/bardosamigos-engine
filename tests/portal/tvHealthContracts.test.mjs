import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(relativePath) {
  return readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
}

test('TV usa allowlist segura mesmo sem variavel de ambiente', async () => {
  const code = await source('src/modules/tv/utils/tvEmbedPolicy.js')

  assert.match(code, /DEFAULT_EMBED_HOSTS/)
  assert.match(code, /embedcanaisdetv\.xyz/)
  assert.match(code, /www\.youtube-nocookie\.com/)
  assert.match(code, /configured\.length \? configured : DEFAULT_EMBED_HOSTS/)
})

test('TV health-check usa tabela isolada, RLS e cron autenticado', async () => {
  const sql = await source('supabase/migrations/20261006101500_create_tv_channel_health.sql')

  assert.match(sql, /create table if not exists public\.tv_channel_health/)
  assert.match(sql, /alter table public\.tv_channel_health enable row level security/)
  assert.match(sql, /revoke all on public\.tv_channel_health from anon/)
  assert.match(sql, /tv_health_cron_token/)
  assert.match(sql, /tv-channel-health-every-6h/)
  assert.match(sql, /17 \*\/6 \* \* \*/)
})

test('TV health-check bloqueia hosts arbitrarios e valida manifests HLS', async () => {
  const code = await source('supabase/functions/tv-health/index.ts')

  assert.match(code, /PROVIDER_HOSTS/)
  assert.match(code, /host-not-approved/)
  assert.match(code, /REQUEST_TIMEOUT_MS = 6500/)
  assert.match(code, /MAX_CONCURRENCY = 6/)
  assert.match(code, /x-tv-health-token/)
  assert.match(code, /constantTimeEqual/)
  assert.match(code, /text\.includes\("#EXTM3U"\)/)
})

test('TV Manager exibe health e permite filtrar canais sem logo', async () => {
  const repository = await source('src/modules/tv/repository/TVRepository.js')
  const manager = await source('src/modules/tv/admin/TVChannelManager.jsx')
  const dashboard = await source('src/modules/tv/admin/TVDashboard.jsx')

  assert.match(repository, /health:tv_channel_health\(\*\)/)
  assert.match(repository, /logo === 'missing'/)
  assert.match(repository, /healthyChannels/)
  assert.match(manager, /tv-filter-logo/)
  assert.match(manager, /SAUDAVEL/)
  assert.match(manager, /FORA DO AR/)
  assert.match(dashboard, /Com alerta/)
  assert.match(dashboard, /Sem teste/)
})
