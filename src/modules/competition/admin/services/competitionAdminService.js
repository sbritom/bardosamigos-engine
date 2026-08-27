import { getSupabaseClient } from '../../../../core/database'
import { toCamelCase, toSnakeCase } from '../../../../core/database/mappers'
import { nowUtcIso } from '../../../../core/time'

function getClient() {
  return getSupabaseClient()
}

function notConfigured() {
  return {
    data: null,
    error: new Error('Supabase nao esta configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'),
  }
}

export async function listCompetitionAdminRecords({ table, search = '', searchFields = [], filters = {}, page = 1, pageSize = 10 }) {
  const client = getClient()
  if (!client) return { data: [], count: 0, error: notConfigured().error }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let query = client.from(table).select('*', { count: 'exact' }).is('deleted_at', null)

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query = query.eq(key, value)
    }
  })

  if (search && searchFields.length > 0) {
    query = query.or(searchFields.map((field) => `${field}.ilike.%${search}%`).join(','))
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
  return { data: toCamelCase(data || []), count: count || 0, error }
}

export async function createCompetitionAdminRecord(table, payload) {
  const client = getClient()
  if (!client) return notConfigured()

  const { data, error } = await client.from(table).insert(toSnakeCase(payload)).select('*').single()
  return { data: data ? toCamelCase(data) : null, error }
}

export async function updateCompetitionAdminRecord(table, id, payload) {
  const client = getClient()
  if (!client) return notConfigured()

  const { data, error } = await client.from(table).update(toSnakeCase(payload)).eq('id', id).select('*').single()
  return { data: data ? toCamelCase(data) : null, error }
}

export async function deleteCompetitionAdminRecord(table, id) {
  const client = getClient()
  if (!client) return notConfigured()

  const { data, error } = await client
    .from(table)
    .update({ deleted_at: nowUtcIso() })
    .eq('id', id)
    .select('*')
    .single()

  return { data: data ? toCamelCase(data) : null, error }
}
