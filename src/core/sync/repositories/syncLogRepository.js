import { formatBrazilFullDateTime, nowUtcIso } from '../../time/timeService.js'

const memoryLogs = []

export function createSyncLogRepository(client) {
  return {
    async saveLog(log) {
      const normalizedLog = {
        ...log,
        lastSyncAt: log.lastSyncAt || nowUtcIso(),
        syncUtc: log.syncUtc || log.lastSyncAt || nowUtcIso(),
        syncBrazilTime: log.syncBrazilTime || formatBrazilFullDateTime(log.lastSyncAt || nowUtcIso()),
      }

      memoryLogs.unshift(normalizedLog)

      if (!client) {
        return { data: normalizedLog, error: null }
      }

      try {
        const { data, error } = await client.from('analytics_events').insert({
          source_module: 'sync_engine',
          event_name: `sync.${normalizedLog.integration}.${normalizedLog.status}`,
          payload: normalizedLog,
          occurred_at: normalizedLog.lastSyncAt,
        }).select('*').single()

        return { data: data || normalizedLog, error }
      } catch (error) {
        return { data: normalizedLog, error }
      }
    },

    async listLogs(limit = 20) {
      if (!client) {
        return { data: memoryLogs.slice(0, limit), error: null }
      }

      try {
        const { data, error } = await client
          .from('analytics_events')
          .select('*')
          .eq('source_module', 'sync_engine')
          .order('occurred_at', { ascending: false })
          .limit(limit)

        return {
          data: error ? memoryLogs.slice(0, limit) : data || [],
          error,
        }
      } catch (error) {
        return { data: memoryLogs.slice(0, limit), error }
      }
    },
  }
}
