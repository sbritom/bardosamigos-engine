import { SYNC_INTEGRATIONS } from '../constants'
import { syncEngine } from '../services'

export function createSyncAdminService(engine = syncEngine) {
  return {
    listStatus() {
      return engine.listIntegrations().map((item) => ({
        ...item,
        label: item.integration,
        canSyncNow: true,
      }))
    },

    syncNow(integration, params = {}) {
      return engine.sync(integration, { force: true, params })
    },

    syncAllNow(params = {}) {
      return engine.syncAll({ force: true, params })
    },

    listLogs(limit = 20) {
      return engine.listLogs(limit)
    },

    getAvailableIntegrations() {
      return Object.values(SYNC_INTEGRATIONS)
    },
  }
}

export const syncAdminService = createSyncAdminService()
