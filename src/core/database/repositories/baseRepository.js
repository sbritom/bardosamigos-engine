export function createBaseRepository({ client, table, mapper = (value) => value }) {
  function getTable() {
    if (!client) {
      return null
    }

    return client.from(table)
  }

  return {
    async findById(id) {
      const query = getTable()
      if (!query) return { data: null, error: new Error('Supabase client is not configured.') }

      const { data, error } = await query.select('*').eq('id', id).maybeSingle()
      return { data: data ? mapper(data) : null, error }
    },

    async list(filters = {}) {
      const query = getTable()
      if (!query) return { data: [], error: new Error('Supabase client is not configured.') }

      let request = query.select('*')

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          request = request.eq(key, value)
        }
      })

      const { data, error } = await request
      return { data: (data || []).map(mapper), error }
    },

    async insert(payload) {
      const query = getTable()
      if (!query) return { data: null, error: new Error('Supabase client is not configured.') }

      const { data, error } = await query.insert(payload).select('*').single()
      return { data: data ? mapper(data) : null, error }
    },

    async update(id, payload) {
      const query = getTable()
      if (!query) return { data: null, error: new Error('Supabase client is not configured.') }

      const { data, error } = await query.update(payload).eq('id', id).select('*').single()
      return { data: data ? mapper(data) : null, error }
    },

    async softDelete(id) {
      return this.update(id, { deleted_at: new Date().toISOString() })
    },
  }
}
