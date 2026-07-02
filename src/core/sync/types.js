/**
 * @typedef {Object} SyncRequest
 * @property {string} integration
 * @property {boolean=} force
 * @property {Record<string, unknown>=} params
 */

/**
 * @typedef {Object} SyncResult
 * @property {string} integration
 * @property {string} status
 * @property {number} records
 * @property {string} lastSyncAt
 * @property {Error|null} error
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} SyncAdapter
 * @property {string} integration
 * @property {(request: SyncRequest) => Promise<{data: unknown[], error: Error|null, skipped?: boolean}>} fetch
 */

/**
 * @typedef {Object} SyncRepository
 * @property {(records: unknown[]) => Promise<{data: unknown[], error: Error|null}>} saveMany
 * @property {() => Promise<{data: unknown[], error: Error|null}>} listSynced
 */

/**
 * @typedef {Object} SyncLog
 * @property {string} integration
 * @property {string} status
 * @property {number} records
 * @property {string} lastSyncAt
 * @property {string=} error
 * @property {Record<string, unknown>=} metadata
 */
