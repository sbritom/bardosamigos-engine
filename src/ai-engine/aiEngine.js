import { AI_ACTION_TYPES } from './constants'
import { localRuleProvider } from './providers/localRuleProvider'
import { createCacheKey, getCache, setCache } from './utils/aiCache'
import { logAiError, logAiEvent } from './utils/aiLogger'
import { sanitizeAiInput } from './utils/aiSanitizer'

function withAction(request = {}, action) {
  return {
    ...request,
    action,
    input: sanitizeAiInput(request.input),
  }
}

export function createAiEngine(provider = localRuleProvider) {
  async function run(request = {}, action = AI_ACTION_TYPES.ANALYZE) {
    const safeRequest = withAction(request, action)
    const cacheKey = createCacheKey({
      provider: provider.id,
      module: safeRequest.module,
      action: safeRequest.action,
      input: safeRequest.input,
    })

    const cachedResponse = getCache(cacheKey)

    if (cachedResponse) {
      return cachedResponse
    }

    try {
      logAiEvent({
        event: 'ai_request_started',
        provider: provider.id,
        action,
        module: safeRequest.module,
      })

      const response = await provider.generate(safeRequest)
      return setCache(cacheKey, response)
    } catch (error) {
      logAiError(error, {
        provider: provider.id,
        action,
        module: safeRequest.module,
      })

      return {
        ok: false,
        provider: provider.type,
        type: action,
        message: 'Nao foi possivel processar a solicitacao do AI Engine.',
        error: error?.message || 'Unknown error',
      }
    }
  }

  return {
    analyze(request) {
      return run(request, AI_ACTION_TYPES.ANALYZE)
    },

    generateInsight(request) {
      return run(request, AI_ACTION_TYPES.INSIGHT)
    },

    generateRecommendation(request) {
      return run(request, AI_ACTION_TYPES.RECOMMENDATION)
    },

    summarize(request) {
      return run(request, AI_ACTION_TYPES.SUMMARY)
    },

    async healthCheck() {
      try {
        return provider.healthCheck ? await provider.healthCheck() : await provider.generate({ action: 'health' })
      } catch (error) {
        logAiError(error, {
          provider: provider.id,
          action: 'health',
        })

        return {
          ok: false,
          provider: provider.type,
          type: 'health',
          message: 'AI Engine indisponivel.',
          error: error?.message || 'Unknown error',
        }
      }
    },
  }
}

export const aiEngine = createAiEngine()
