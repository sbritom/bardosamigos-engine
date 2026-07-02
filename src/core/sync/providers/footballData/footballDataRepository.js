import { DATABASE_TABLES } from '../../../database/constants/tables.js'
import { createSyncRepository } from '../../repositories/createSyncRepository.js'

export function createFootballDataRepository(client) {
  const competitions = createSyncRepository({
    client,
    table: DATABASE_TABLES.COMPETITIONS,
    validateRecord: (record) => Boolean(record.name && record.slug),
  })
  const teams = createSyncRepository({
    client,
    table: DATABASE_TABLES.COMPETITION_TEAMS,
    validateRecord: (record) => Boolean(record.name),
  })
  const matches = createSyncRepository({
    client,
    table: DATABASE_TABLES.COMPETITION_MATCHES,
    validateRecord: (record) => Boolean(record.round_id && record.starts_at),
  })
  const standings = createSyncRepository({
    client,
    table: DATABASE_TABLES.RANKING_ENTRIES,
    validateRecord: (record) => Boolean(record.profile_id),
  })

  async function saveByLookup({ table, records = [], validateRecord, createLookup }) {
    const safeRecords = records.filter(validateRecord)

    if (!client) return { data: [], error: new Error('Supabase client is not configured.') }
    if (!safeRecords.length) return { data: [], error: null }

    try {
      const saved = []

      for (const record of safeRecords) {
        const lookup = createLookup(record)
        let query = client.from(table).select('id').limit(1)

        Object.entries(lookup).forEach(([key, value]) => {
          query = value === null ? query.is(key, null) : query.eq(key, value)
        })

        const { data: existingRows, error: findError } = await query

        if (findError) return { data: saved, error: findError }

        const existing = existingRows?.[0]
        const writeQuery = existing
          ? client.from(table).update(record).eq('id', existing.id)
          : client.from(table).insert(record)

        const { data, error } = await writeQuery.select('*').single()
        if (error) return { data: saved, error }
        saved.push(data)
      }

      return { data: saved, error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async function saveTeamsByName(records = []) {
    const safeRecords = records.filter((record) => Boolean(record.name))

    if (!client) return { data: [], error: new Error('Supabase client is not configured.') }
    if (!safeRecords.length) return { data: [], error: null }

    try {
      const competitionIds = [...new Set(safeRecords.map((record) => record.competition_id).filter(Boolean))]
      const names = [...new Set(safeRecords.map((record) => record.name))]
      let existingQuery = client
        .from(DATABASE_TABLES.COMPETITION_TEAMS)
        .select('id, competition_id, name')
        .in('name', names)
        .is('deleted_at', null)

      if (competitionIds.length === 1) {
        existingQuery = existingQuery.eq('competition_id', competitionIds[0])
      }

      const { data: existingRows, error: findError } = await existingQuery
      if (findError) return { data: [], error: findError }

      const existingKeys = new Set((existingRows || []).map((row) => `${row.competition_id || ''}:${row.name}`))
      const missingRecords = safeRecords.filter((record) => !existingKeys.has(`${record.competition_id || ''}:${record.name}`))
      const existingByKey = new Map((existingRows || []).map((row) => [`${row.competition_id || ''}:${row.name}`, row.id]))
      const updatedRecords = []

      for (const record of safeRecords.filter((item) => existingKeys.has(`${item.competition_id || ''}:${item.name}`))) {
        const existingId = existingByKey.get(`${record.competition_id || ''}:${record.name}`)
        const { data, error } = await client
          .from(DATABASE_TABLES.COMPETITION_TEAMS)
          .update(record)
          .eq('id', existingId)
          .select('*')
          .single()

        if (error) return { data: updatedRecords, error }
        updatedRecords.push(data)
      }

      if (!missingRecords.length) return { data: updatedRecords, error: null }

      const { data, error } = await client.from(DATABASE_TABLES.COMPETITION_TEAMS).insert(missingRecords).select('*')
      if (error) return { data: [], error }

      return { data: [...(data || []), ...updatedRecords], error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  async function saveMatchesByExternalRef(records = []) {
    const safeRecords = records.filter((record) => Boolean(record.round_id && record.starts_at))

    if (!client) return { data: [], error: new Error('Supabase client is not configured.') }
    if (!safeRecords.length) return { data: [], error: null }

    try {
      const externalRefs = [...new Set(safeRecords.map((record) => record.external_ref).filter(Boolean))]
      const { data: existingRows, error: findError } = externalRefs.length
        ? await client
            .from(DATABASE_TABLES.COMPETITION_MATCHES)
            .select('id, external_ref')
            .in('external_ref', externalRefs)
            .is('deleted_at', null)
        : { data: [], error: null }

      if (findError) return { data: [], error: findError }

      const existingRefs = new Set((existingRows || []).map((row) => row.external_ref).filter(Boolean))
      const missingRecords = safeRecords.filter((record) => !record.external_ref || !existingRefs.has(record.external_ref))
      const existingRecords = safeRecords.filter((record) => record.external_ref && existingRefs.has(record.external_ref))
      const existingByRef = new Map((existingRows || []).map((row) => [row.external_ref, row.id]))
      const updatedRecords = []

      for (const record of existingRecords) {
        const { data, error } = await client
          .from(DATABASE_TABLES.COMPETITION_MATCHES)
          .update(record)
          .eq('id', existingByRef.get(record.external_ref))
          .is('deleted_at', null)
          .select('*')

        if (error) return { data: updatedRecords, error }
        updatedRecords.push(...(data || []))
      }

      if (!missingRecords.length) return { data: updatedRecords, error: null }

      const { data, error } = await client.from(DATABASE_TABLES.COMPETITION_MATCHES).insert(missingRecords).select('*')
      if (error) return { data: [], error }

      return { data: [...(data || []), ...updatedRecords], error: null }
    } catch (error) {
      return { data: [], error }
    }
  }

  return {
    saveCompetitions(records) {
      return saveByLookup({
        table: DATABASE_TABLES.COMPETITIONS,
        records,
        validateRecord: (record) => Boolean(record.name && record.slug),
        createLookup: (record) => ({ slug: record.slug, deleted_at: null }),
      })
    },

    saveTeams(records) {
      return saveTeamsByName(records)
    },

    saveMatches(records) {
      return saveMatchesByExternalRef(records)
    },

    saveStandings(records) {
      return standings.saveMany(records)
    },

    listSyncedMatches(limit) {
      return matches.listSynced(limit)
    },

    listSyncedCompetitions(limit) {
      return competitions.listSynced(limit)
    },
  }
}
