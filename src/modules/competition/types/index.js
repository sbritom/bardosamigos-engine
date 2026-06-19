/**
 * @typedef {'football' | 'basketball' | 'volleyball' | 'formula_1' | 'ufc' | 'esports' | 'reality_show' | 'custom'} CompetitionType
 */

/**
 * @typedef {'scheduled' | 'open' | 'live' | 'finished' | 'canceled' | 'postponed'} MatchStatus
 */

/**
 * @typedef {'draft' | 'confirmed' | 'locked' | 'scored' | 'canceled'} PredictionStatus
 */

/**
 * @typedef {'exact_score' | 'winner' | 'draw' | 'position' | 'participation' | 'custom'} ScoringType
 */

/**
 * @typedef {'badge' | 'barcoins' | 'coupon' | 'store_item' | 'experience' | 'custom'} RewardType
 */

/**
 * @typedef {Object} Competition
 * @property {string} id
 * @property {string} name
 * @property {CompetitionType} type
 * @property {boolean} active
 * @property {Record<string, unknown>} settings
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Season
 * @property {string} id
 * @property {string} competitionId
 * @property {string} name
 * @property {string} startsAt
 * @property {string} endsAt
 * @property {boolean} active
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Stage
 * @property {string} id
 * @property {string} seasonId
 * @property {string} name
 * @property {number} order
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Round
 * @property {string} id
 * @property {string} stageId
 * @property {string} name
 * @property {number} number
 * @property {string=} startsAt
 * @property {string=} endsAt
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} MatchResult
 * @property {number | null=} homeScore
 * @property {number | null=} awayScore
 * @property {string | null=} winnerId
 * @property {number | null=} position
 * @property {Record<string, unknown>=} raw
 */

/**
 * @typedef {Object} Match
 * @property {string} id
 * @property {string} roundId
 * @property {string} homeParticipant
 * @property {string} awayParticipant
 * @property {string} startsAt
 * @property {MatchStatus} status
 * @property {MatchResult} result
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Prediction
 * @property {string} id
 * @property {string} matchId
 * @property {string} userId
 * @property {MatchResult} prediction
 * @property {PredictionStatus} status
 * @property {number} points
 * @property {string} createdAt
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} ScoreRule
 * @property {string} id
 * @property {string} competitionId
 * @property {ScoringType} type
 * @property {number} points
 * @property {boolean} active
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} RankingItem
 * @property {string} userId
 * @property {number} points
 * @property {number} exactHits
 * @property {number} resultHits
 * @property {number} predictions
 * @property {number} position
 */

/**
 * @typedef {Object} Ranking
 * @property {string} id
 * @property {string} competitionId
 * @property {string=} seasonId
 * @property {RankingItem[]} items
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} description
 * @property {string} unlockedAt
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} Reward
 * @property {string} id
 * @property {string} competitionId
 * @property {RewardType} type
 * @property {string} title
 * @property {string} description
 * @property {Record<string, unknown>} payload
 * @property {Record<string, unknown>} metadata
 */

export {}
