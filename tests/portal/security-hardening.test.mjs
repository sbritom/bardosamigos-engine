import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

function read(path) {
  return fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('production headers enforce a CSP and clickjacking protection', () => {
  const vercel = JSON.parse(read('vercel.json'))
  const globalHeaders = vercel.headers.find((entry) => entry.source === '/(.*)')?.headers || []
  const asMap = new Map(globalHeaders.map((header) => [header.key, header.value]))

  assert.match(asMap.get('Content-Security-Policy') || '', /default-src 'self'/)
  assert.match(asMap.get('Content-Security-Policy') || '', /object-src 'none'/)
  assert.equal(asMap.get('X-Frame-Options'), 'DENY')
  assert.equal(asMap.get('X-Content-Type-Options'), 'nosniff')
})

test('cron endpoint fails closed and requires CRON_SECRET', () => {
  const source = read('api/cron/sync-news.js')
  assert.match(source, /CRON_SECRET/)
  assert.match(source, /timingSafeEqualText/)
  assert.doesNotMatch(source, /vercel-cron\/1\.0/)
})

test('radio engine private endpoints require an admin token', () => {
  const source = read('server/src/api/ApiEngine.js')
  assert.match(source, /RADIO_ENGINE_ADMIN_TOKEN/)
  assert.match(source, /requiresEngineAuth/)
  assert.match(source, /getEngineAccess/)
  assert.doesNotMatch(source, /"Access-Control-Allow-Origin": "\*"/)
})

test('radio engine binds to localhost by default', () => {
  const config = read('server/src/config/config.js')
  assert.match(config, /RADIO_HOST \|\| "127\.0\.0\.1"/)
})

test('known insecure radio defaults are not versioned', () => {
  const files = [
    read('docker-compose.yml'),
    read('config/icecast.json'),
    read('config/stream.json'),
    read('server/config/icecast.xml'),
  ].join('\n')

  assert.doesNotMatch(files, /BarDosAmigos2026!/)
  assert.doesNotMatch(files, /<source-password>hackme<\/source-password>/)
  assert.doesNotMatch(files, /<admin-password>admin<\/admin-password>/)
})


test('events admin keeps its server-side Supabase client', () => {
  const source = read('api/events/admin.js')
  assert.match(source, /function getSupabaseAdmin\(\)/)
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(source, /requireAdminUser/)
})


test('sensitive admin APIs disable response caching', () => {
  const events = read('api/events/admin.js')
  const requests = read('api/radio/requests.js')
  assert.match(events, /private, no-store, max-age=0/)
  assert.match(requests, /private, no-store, max-age=0/)
})

test('football API only accepts the configured public competition allowlist', () => {
  const source = read('api/football/matches.js')
  assert.match(source, /ALLOWED_COMPETITIONS/)
  assert.match(source, /ALLOWED_COMPETITIONS\.has\(item\)/)
})
