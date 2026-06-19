/**
 * @typedef {Object} DatabaseRecord
 * @property {string} id
 * @property {string=} created_at
 * @property {string=} updated_at
 * @property {string|null=} deleted_at
 * @property {number=} version
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {DatabaseRecord & {
 *   display_name?: string,
 *   username?: string,
 *   avatar_url?: string,
 *   role?: string,
 *   status?: string,
 *   preferences?: Record<string, unknown>
 * }} ProfileRow
 */

/**
 * @typedef {DatabaseRecord & {
 *   name: string,
 *   slug: string,
 *   type: string,
 *   status: string,
 *   settings?: Record<string, unknown>
 * }} CompetitionRow
 */

/**
 * @typedef {DatabaseRecord & {
 *   match_id: string,
 *   profile_id: string,
 *   prediction: Record<string, unknown>,
 *   status: string,
 *   points: number
 * }} CompetitionPredictionRow
 */

/**
 * @typedef {DatabaseRecord & {
 *   profile_id: string,
 *   balance: number,
 *   locked_balance: number,
 *   lifetime_earned: number,
 *   lifetime_spent: number
 * }} BarcoinWalletRow
 */

export {}
