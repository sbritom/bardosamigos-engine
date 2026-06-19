/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} AiRiskLevel
 */

/**
 * @typedef {Object} AiContext
 * @property {string=} userId
 * @property {string=} sessionId
 * @property {string=} locale
 * @property {string=} timezone
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} AiModule
 * @property {string} id
 * @property {string} name
 * @property {boolean=} enabled
 * @property {Record<string, unknown>=} config
 */

/**
 * @typedef {Object} AiRequest
 * @property {string=} id
 * @property {string=} module
 * @property {string=} action
 * @property {string | Record<string, unknown> | Array<unknown>=} input
 * @property {AiContext=} context
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} AiInsight
 * @property {string} title
 * @property {string} message
 * @property {AiRiskLevel=} riskLevel
 * @property {number=} confidence
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} AiRecommendation
 * @property {string} title
 * @property {string} message
 * @property {string=} actionType
 * @property {AiRiskLevel=} riskLevel
 * @property {number=} priority
 * @property {Record<string, unknown>=} metadata
 */

/**
 * @typedef {Object} AiResponse
 * @property {boolean} ok
 * @property {string} provider
 * @property {string} type
 * @property {string} message
 * @property {AiInsight[]=} insights
 * @property {AiRecommendation[]=} recommendations
 * @property {AiRiskLevel=} riskLevel
 * @property {number=} confidence
 * @property {Record<string, unknown>=} metadata
 * @property {string=} error
 */

/**
 * @typedef {Object} AiProvider
 * @property {string} id
 * @property {string} type
 * @property {(request: AiRequest) => Promise<AiResponse> | AiResponse} generate
 * @property {() => Promise<AiResponse> | AiResponse=} healthCheck
 */

export {}
