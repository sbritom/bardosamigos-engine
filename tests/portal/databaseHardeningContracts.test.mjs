import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const predictionServicePath = new URL('../../src/modules/competition/services/competitionPredictionService.js', import.meta.url)
const rankingApiPath = new URL('../../api/competition/ranking.js', import.meta.url)

test('ranking publico nao chama SECURITY DEFINER diretamente do navegador', async () => {
  const source = await readFile(predictionServicePath, 'utf8')
  assert.doesNotMatch(source, /\.rpc\(['"]imortal_get_latest_prediction_ranking['"]/) 
  assert.match(source, /\/api\/competition\/ranking/)
})

test('ranking server-side usa service role e valida escopo publico', async () => {
  const source = await readFile(rankingApiPath, 'utf8')
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(source, /ALLOWED_SCOPES/)
  assert.match(source, /general/)
  assert.match(source, /competition/)
  assert.match(source, /season/)
  assert.match(source, /imortal_get_latest_prediction_ranking/)
  assert.match(source, /stale-while-revalidate/)
})
