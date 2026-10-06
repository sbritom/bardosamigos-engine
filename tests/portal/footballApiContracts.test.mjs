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

test('consulta agregada valida sem partidas continua respondendo como sucesso', async () => {
  const code = await source()

  assert.match(code, /fetchMatchesAcrossCompetitions/)
  assert.match(code, /const matches = await fetchMatchesAcrossCompetitions/)
  assert.match(code, /mode: 'aggregated'/)
  assert.match(code, /response\.status\(200\)\.json/)
  assert.doesNotMatch(code, /status\(matches\.length\s*\?\s*200\s*:\s*502\)/)
})

test('listagem principal evita fan-out e respeita a janela maxima do provedor', async () => {
  const code = await source()

  assert.match(code, /const COMPETITION_IDS = Object\.freeze/)
  assert.match(code, /url\.searchParams\.set\('competitions', competitionIds\.join\(','\)\)/)
  assert.match(code, /const maxRangeMs = 9 \* 24 \* 60 \* 60 \* 1000/)
  assert.match(code, /from\.setDate\(from\.getDate\(\) - 2\)/)
  assert.match(code, /to\.setDate\(to\.getDate\(\) \+ 7\)/)
  assert.doesNotMatch(code, /Promise\.allSettled/)
})

test('falhas reais do fornecedor nao sao cacheadas como resposta publica saudavel', async () => {
  const code = await source()

  assert.match(code, /Cache-Control', 'no-store'/)
  assert.match(code, /error\?\.status === 429 \? 429 : 502/)
  assert.match(code, /Retry-After/)
  assert.match(code, /provider-unavailable/)
})

test('settlement isola falha individual de cada partida', async () => {
  const code = await source()

  assert.match(code, /for \(const match of finished\) \{\s*try \{/)
  assert.match(code, /catch \(error\) \{\s*errors\.push\(`\$\{match\.providerMatchId\}:/)
})
