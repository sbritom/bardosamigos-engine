import assert from 'node:assert/strict'
import {
  hasDisplayableMatchTeams,
  isHomeFootballMatchToday,
  selectHomeFootballMatchesByPriority,
} from '../src/apps/portal/home/services/homeFootballSelection.js'

const NOW = '2026-07-18T15:00:00-03:00'

function match(id, overrides = {}) {
  return {
    id,
    homeTeam: `Casa ${id}`,
    awayTeam: `Fora ${id}`,
    homeCrest: '',
    awayCrest: '',
    startsAt: '2026-07-18T18:00:00-03:00',
    standardStatus: 'AGENDADO',
    status: 'AGENDADO',
    homeScore: null,
    awayScore: null,
    ...overrides,
  }
}

function ids(items) {
  return items.map((item) => item.id)
}

{
  const result = selectHomeFootballMatchesByPriority([
    match('future', { startsAt: '2026-07-20T18:00:00-03:00' }),
    match('finished-today', { startsAt: '2026-07-18T12:00:00-03:00', standardStatus: 'FINALIZADO', status: 'FINALIZADO', homeScore: 2, awayScore: 1 }),
    match('live', { startsAt: '2026-07-18T14:00:00-03:00', standardStatus: 'AO_VIVO', status: 'AO_VIVO', homeScore: 1, awayScore: 1 }),
  ], NOW, 3)
  assert.deepEqual(ids(result), ['live', 'finished-today', 'future'])
}

{
  const result = selectHomeFootballMatchesByPriority([
    match('scheduled-today', { startsAt: '2026-07-18T22:00:00-03:00' }),
    match('finished-late', { startsAt: '2026-07-18T16:00:00-03:00', standardStatus: 'FINALIZADO', status: 'FINALIZADO' }),
    match('finished-early', { startsAt: '2026-07-18T10:00:00-03:00', standardStatus: 'FINALIZADO', status: 'FINALIZADO' }),
  ], NOW, 3)
  assert.deepEqual(ids(result), ['finished-late', 'finished-early', 'scheduled-today'])
}

{
  const result = selectHomeFootballMatchesByPriority([
    match('future-2', { startsAt: '2026-07-20T18:00:00-03:00' }),
    match('future-1', { startsAt: '2026-07-19T18:00:00-03:00' }),
  ], NOW, 3)
  assert.deepEqual(ids(result), ['future-1', 'future-2'])
}

{
  const result = selectHomeFootballMatchesByPriority([
    match('invalid-bda', { homeTeam: 'BDA', awayTeam: 'Visitante' }),
    match('valid', { startsAt: '2026-07-18T20:00:00-03:00' }),
  ], NOW, 3)
  assert.deepEqual(ids(result), ['valid'])
}

{
  const validWithoutCrest = match('valid-without-crest', {
    homeTeam: 'Brasil',
    awayTeam: 'Argentina',
    homeCrest: '',
    awayCrest: '',
  })
  assert.equal(hasDisplayableMatchTeams(validWithoutCrest), true)
  assert.deepEqual(ids(selectHomeFootballMatchesByPriority([validWithoutCrest], NOW, 3)), ['valid-without-crest'])
}

{
  const nearMidnightUtc = match('near-midnight-utc', {
    startsAt: '2026-07-18T02:30:00Z',
  })
  assert.equal(isHomeFootballMatchToday(nearMidnightUtc, '2026-07-18T02:45:00Z'), true)
}

console.log('Home football selection validation passed.')
