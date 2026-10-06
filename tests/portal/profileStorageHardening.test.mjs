import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL('../../supabase/migrations/20261006142543_profile_storage_hardening.sql', import.meta.url)
const profileServiceUrl = new URL('../../src/modules/auth/profileService.js', import.meta.url)

test('avatars usa bucket dedicado e pasta do proprio usuario', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  const profileService = await readFile(profileServiceUrl, 'utf8')

  assert.match(profileService, /const AVATAR_BUCKET = 'avatars'/)
  assert.match(profileService, /\`\$\{user\.id\}\/avatar-\$\{Date\.now\(\)\}/)
  assert.match(migration, /'avatars',\s*'avatars',\s*true,\s*5242880/s)
  assert.match(migration, /image\/png/)
  assert.match(migration, /image\/jpeg/)
  assert.match(migration, /image\/webp/)
  assert.match(migration, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)::text\)/)
})

test('perfil bloqueia campos administrados pelo servidor', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  assert.match(migration, /protect_profile_managed_fields/)
  assert.match(migration, /new\.role is distinct from old\.role/)
  assert.match(migration, /new\.status is distinct from old\.status/)
  assert.match(migration, /new\.metadata is distinct from old\.metadata/)
  assert.match(migration, /new\.deleted_at is distinct from old\.deleted_at/)
  assert.match(migration, /app_metadata/)
  assert.doesNotMatch(migration, /user_metadata/)
})

test('policies legadas de Storage sao removidas sem apagar objetos', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  assert.match(migration, /drop policy if exists "BarStudio upload 1ps738_0"/)
  assert.match(migration, /drop policy if exists "Permitir leitura publica no barstudio"/)
  assert.match(migration, /drop policy if exists "Permitir upload publico no barstudio"/)
  assert.doesNotMatch(migration, /delete\s+from\s+storage\.objects/i)
})
