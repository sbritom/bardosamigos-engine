export const COMPETITION_TYPES = Object.freeze({
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  VOLLEYBALL: 'volleyball',
  FORMULA_1: 'formula_1',
  UFC: 'ufc',
  ESPORTS: 'esports',
  REALITY_SHOW: 'reality_show',
  CUSTOM: 'custom',
})

export const MATCH_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  OPEN: 'open',
  LIVE: 'live',
  FINISHED: 'finished',
  CANCELED: 'canceled',
  POSTPONED: 'postponed',
})

export const PREDICTION_STATUS = Object.freeze({
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  LOCKED: 'locked',
  SCORED: 'scored',
  CANCELED: 'canceled',
})

export const SCORING_TYPES = Object.freeze({
  EXACT_SCORE: 'exact_score',
  WINNER: 'winner',
  DRAW: 'draw',
  POSITION: 'position',
  PARTICIPATION: 'participation',
  CUSTOM: 'custom',
})

export const REWARD_TYPES = Object.freeze({
  BADGE: 'badge',
  BARCOINS: 'barcoins',
  COUPON: 'coupon',
  STORE_ITEM: 'store_item',
  EXPERIENCE: 'experience',
  CUSTOM: 'custom',
})

export const DEFAULT_SCORING_RULES = Object.freeze({
  [SCORING_TYPES.EXACT_SCORE]: 5,
  [SCORING_TYPES.WINNER]: 3,
  [SCORING_TYPES.DRAW]: 3,
  [SCORING_TYPES.POSITION]: 2,
  [SCORING_TYPES.PARTICIPATION]: 1,
})
