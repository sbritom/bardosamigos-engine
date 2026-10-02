import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const footballApiUrl = new URL('../../api/football/matches.js', import.meta.url)

async function source() {
  return readFile(footballApiUrl, 'utf8')
}

test('leitura publica do Futebol nao executa settlement sem CRON_SECRET valido', async () => {
  const code = await source()

  assert.match(code, /isAuthorizedSettlementRequest/)
  assert.match(code, /CRON_SECRET/)
  assert.match(code, /getBearerToken/)
  assert.match(code, /timingSafeEqualText/)
  assert.match(code, /const maySettle = isAuthorizedSettlementRequest\(request\)/)
  assert.match(code, /maySettle\s*\?\s*await settleFinishedMatches/)
})

test('consulta valida sem partidas nao vira 502 por tamanho do array', async () => {
  const code = await source()

  assert.doesNotMatch(code, /status\(matches\.length\s*\?\s*200\s*:\s*502\)/)
  assert.doesNotMatch(code, /status\(worldCupMatches\.length\s*\?\s*200\s*:\s*502\)/)
  assert.match(code, /const fulfilled = results\.filter\(\(item\) => item\.status === 'fulfilled'\)/)
  assert.match(code, /if \(!fulfilled\.length\)/)
})

test('catalogo de competicoes e best-effort e possui cache em memoria', async () => {
  const code = await source()

  assert.match(code, /COMPETITION_CATALOG_TTL_MS/)
  assert.match(code, /competitionCatalogCache/)
  assert.match(code, /fetchCompetitionsCached/)
  assert.match(code, /providerErrors\.push\(`competition catalog:/)
})

test('falhas reais do fornecedor nao sao cacheadas como resposta publica saudavel', async () => {
  const code = await source()

  assert.match(code, /Cache-Control', 'no-store'/)
  assert.match(code, /status\(502\)/)
  assert.match(code, /provider-unavailable/)
})

test('settlement isola falha individual de cada partida', async () => {
  const code = await source()

  assert.match(code, /for \(const match of finished\) \{\s*try \{/)
  assert.match(code, /catch \(error\) \{\s*errors\.push\(`\$\{match\.providerMatchId\}:/)
})
