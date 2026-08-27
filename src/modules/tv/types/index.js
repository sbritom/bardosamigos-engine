/**
 * @typedef {Object} TVCategory
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string|null} description
 * @property {string|null} icon
 * @property {string|null} color
 * @property {number} displayOrder
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} TVChannel
 * @property {string} id
 * @property {string|null} categoryId
 * @property {string} name
 * @property {string} slug
 * @property {string|null} description
 * @property {string|null} logo
 * @property {string} provider
 * @property {string} embedUrl
 * @property {string|null} country
 * @property {string|null} language
 * @property {boolean} featured
 * @property {boolean} verified
 * @property {boolean} enabled
 * @property {number} displayOrder
 * @property {number} views
 */

/**
 * @typedef {Object} TVFeatured
 * @property {string} id
 * @property {string} channelId
 * @property {number} priority
 * @property {string|null} startAt
 * @property {string|null} endAt
 * @property {TVChannel=} channel
 */

/**
 * @typedef {Object} TVRecent
 * @property {string} userId
 * @property {string} channelId
 * @property {string} lastWatch
 * @property {number} watchTime
 * @property {TVChannel=} channel
 */

/**
 * @typedef {Object} TVQuery
 * @property {string=} categoryId
 * @property {string=} search
 * @property {number=} page
 * @property {number=} pageSize
 */

export {}
