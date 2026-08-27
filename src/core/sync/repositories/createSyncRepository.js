export function createSyncRepository({ client, table, select = '*', validateRecord = () => true }) {
  function getTable() {
    return client ? client.from(table) : null
  }

  return {
    async saveMany(records = []) {
      const query = getTable()
      const safeRecords = records.filter(validateRecord)

      if (!query) return { data: [], error: new Error('Supabase client is not configured.') }
      if (!safeRecords.length) return { data: [], error: null }

      try {
        const { data, error } = await query.insert(safeRecords).select(select)
        return { data: data || [], error }
      } catch (error) {
        return { data: [], error }
      }
    },

    async listSynced(limit = 50) {
      const query = getTable()
      if (!query) return { data: [], error: new Error('Supabase client is not configured.') }

      try {
        const { data, error } = await query.select(select).limit(limit)
        return { data: data || [], error }
      } catch (error) {
        return { data: [], error }
      }
    },
  }
}
