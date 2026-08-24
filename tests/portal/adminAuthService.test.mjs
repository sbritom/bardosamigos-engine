import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADMIN_ROLES,
  hasAllowedAdminRole,
  normalizeUsername,
  usernameToAuthEmail,
  validateUsername,
} from '../../src/core/auth/adminAuthService.js'

test('normaliza nomes administrativos sem acentos e espacos externos', () => {
  assert.equal(normalizeUsername('  João.Admin  '), 'joao.admin')
})

test('converte usuario administrativo em email interno', () => {
  assert.equal(usernameToAuthEmail('Locutor_01'), 'locutor_01@auth.bardosamigos.local')
})

test('rejeita usuario com email, espacos ou tamanho invalido', () => {
  assert.throws(() => validateUsername('admin@example.com'))
  assert.throws(() => validateUsername('meu admin'))
  assert.throws(() => validateUsername('ab'))
})

test('admin pode acessar qualquer rota administrativa', () => {
  const user = { app_metadata: { role: ADMIN_ROLES.ADMIN } }

  assert.equal(hasAllowedAdminRole(user, [ADMIN_ROLES.ADMIN]), true)
  assert.equal(hasAllowedAdminRole(user, [ADMIN_ROLES.LOCUTOR]), true)
})

test('locutor fica limitado a rotas que aceitam locutor', () => {
  const user = { app_metadata: { role: ADMIN_ROLES.LOCUTOR } }

  assert.equal(hasAllowedAdminRole(user, [ADMIN_ROLES.LOCUTOR]), true)
  assert.equal(hasAllowedAdminRole(user, [ADMIN_ROLES.ADMIN]), false)
})

test('user_metadata nao concede privilegio administrativo por padrao', () => {
  const user = { user_metadata: { role: ADMIN_ROLES.ADMIN, is_admin: true } }

  assert.equal(hasAllowedAdminRole(user, [ADMIN_ROLES.ADMIN]), false)
})
