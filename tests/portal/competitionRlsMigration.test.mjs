import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../../supabase/migrations/20260824000300_align_competition_rls_with_production.sql',
  import.meta.url,
)

async function migrationSource() {
  return readFile(migrationUrl, 'utf8')
}

test('RLS de competicoes usa somente claims administrativas confiaveis', async () => {
  const sql = await migrationSource()

  assert.match(sql, /create or replace function public\.bda_is_admin\(\)/i)
  assert.match(sql, /app_metadata/i)
  assert.match(sql, /'admin', 'super_admin'/i)
  assert.doesNotMatch(sql, /user_metadata/i)
})

test('leitura publica de competitions exige published e registro ativo', async () => {
  const sql = await migrationSource()

  assert.match(
    sql,
    /create policy "Public can read competitions"[\s\S]*status = 'published'[\s\S]*deleted_at is null/i,
  )
})

test('tabelas auxiliares e partidas nao usam leitura publica irrestrita', async () => {
  const sql = await migrationSource()

  for (const table of [
    'competition_seasons',
    'competition_stages',
    'competition_rounds',
    'competition_teams',
    'competition_matches',
  ]) {
    const escaped = table.replaceAll('_', '\\_')
    const policyPattern = new RegExp(
      `create policy "Public can read ${escaped}"[\\s\\S]*?using \\(deleted_at is null or public\\.bda_is_admin\\(\\)\\)`,
      'i',
    )
    assert.match(sql, policyPattern)
  }

  assert.doesNotMatch(sql, /create policy "Public can read [^"]+"[\s\S]{0,160}using \(true\)/i)
})

test('migration remove policies legadas que poderiam manter permissoes duplicadas', async () => {
  const sql = await migrationSource()

  for (const legacyPolicy of [
    'competitions admin write',
    'published competitions readable',
    'competition seasons public read',
    'competition seasons admin write',
    'competition stages public read',
    'competition stages admin write',
    'competition rounds public read',
    'competition rounds admin write',
    'competition teams public read',
    'competition teams admin write',
    'matches public read',
    'matches admin write',
    'matches admin result update',
  ]) {
    assert.ok(sql.includes(`drop policy if exists "${legacyPolicy}"`))
  }
})
