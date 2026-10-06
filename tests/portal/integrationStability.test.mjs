import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('Games aplica timeout e retry apenas em falhas transitórias', async () => {
  const code = await source('api/_lib/gamesDataService.js')
  assert.match(code, /PROVIDER_TIMEOUT_MS\s*=\s*6500/)
  assert.match(code, /PROVIDER_MAX_ATTEMPTS\s*=\s*2/)
  assert.match(code, /RETRYABLE_STATUS/)
  assert.match(code, /AbortController/)
  assert.match(code, /429/)
  assert.match(code, /503/)
})

test('PandaScore isola falha parcial entre secoes', async () => {
  const code = await source('api/_lib/gamesDataService.js')
  assert.match(code, /Promise\.allSettled/)
  assert.match(code, /partial:\s*failures\.length\s*>\s*0/)
  assert.match(code, /warnings:\s*failures/)
})

test('Noticias usa timeout e serve cache persistido', async () => {
  const code = await source('api/_lib/newsCacheService.js')
  assert.match(code, /REQUEST_TIMEOUT_MS\s*=\s*8000/)
  assert.match(code, /AbortController/)
  assert.match(code, /listCachedNews/)
  assert.match(code, /supabase-cache/)
})

test('Radio protege chamadas ao provedor com timeout', async () => {
  const code = await source('api/radio/requests.js')
  assert.match(code, /PROVIDER_TIMEOUT_MS\s*=\s*8000/)
  assert.match(code, /AbortController/)
  assert.match(code, /fetchProvider/)
})

test('Presence nao reenvia track em toda navegacao do portal', async () => {
  const code = await source('src/modules/community/presence/CommunityPresenceContext.jsx')
  assert.match(code, /trackedAreaRef/)
  assert.match(code, /trackedAreaRef\.current\s*===\s*nextArea/)
  assert.match(code, /CHANNEL_ERROR/)
  assert.match(code, /TIMED_OUT/)
  assert.match(code, /CLOSED/)
})

test('API publica de Games e Noticias oferece stale-while-revalidate', async () => {
  const code = await source('api/news.js')
  assert.match(code, /stale-while-revalidate/)
  assert.match(code, /s-maxage/)
})

test('TV continua validando fontes e disponibilidade regional', async () => {
  const code = await source('tests/portal/tvRegionalAvailability.test.mjs')
  assert.match(code, /HLS/)
  assert.match(code, /GLOBAL/)
  assert.match(code, /BR_ONLY/)
})


test('Radio limita ranking publico a atividade recente', async () => {
  const code = await source('api/radio/requests.js')
  assert.match(code, /rankingSince/)
  assert.match(code, /30 \* 24 \* 60 \* 60 \* 1000/)
  assert.match(code, /\.gte\('created_at', rankingSince\)/)
  assert.match(code, /rankingPeriodDays:\s*30/)
})

test('Radio trata grade vazia como AutoDJ sem inventar locutor ou horario', async () => {
  const code = await source('src/apps/radio/RadioPage.jsx')
  assert.match(code, /configuredSchedule/)
  assert.match(code, /AutoDJ no ar 24h/)
  assert.match(code, /grade com locutores será exibida aqui/)
  assert.doesNotMatch(code, /Locutor a definir/)
  assert.doesNotMatch(code, /Horário a definir/)
})


test('GNews respeita limite de uma requisicao por segundo e faz retry transitório', async () => {
  const code = await source('api/_lib/newsCacheService.js')
  assert.match(code, /GNEWS_MIN_INTERVAL_MS\s*=\s*1100/)
  assert.match(code, /GNEWS_RETRY_DELAY_MS\s*=\s*1200/)
  assert.match(code, /if \(index > 0\) await wait\(GNEWS_MIN_INTERVAL_MS\)/)
  assert.match(code, /isRetryableTopicError/)
  assert.match(code, /\[429, 500, 503\]/)
})

test('GNews envia chave por header e so marca sucesso completo sem erros de topico', async () => {
  const code = await source('api/_lib/newsCacheService.js')
  assert.match(code, /headers:\s*\{ 'X-Api-Key': apiKey \}/)
  assert.doesNotMatch(code, /searchParams\.set\('apikey'/)
  assert.match(code, /ok:\s*saved\.errors\.length === 0 && errors\.length === 0/)
  assert.match(code, /partial:\s*fetchedRecords\.length > 0/)
})
