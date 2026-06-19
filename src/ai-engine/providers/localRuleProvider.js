import { AI_ACTION_TYPES, AI_PROVIDER_TYPES, AI_RISK_LEVELS } from '../constants'
import { sanitizeAiInput, sanitizeAiOutput } from '../utils/aiSanitizer'

const providerId = 'local-rule-provider'

function normalizeInput(input) {
  const safeInput = sanitizeAiInput(input)

  if (typeof safeInput === 'string') {
    return safeInput
  }

  try {
    return JSON.stringify(safeInput)
  } catch {
    return ''
  }
}

function createBaseResponse(type, message, metadata = {}) {
  return sanitizeAiOutput({
    ok: true,
    provider: AI_PROVIDER_TYPES.LOCAL_RULE,
    type,
    message,
    riskLevel: AI_RISK_LEVELS.LOW,
    confidence: 0.62,
    metadata: {
      providerId,
      generatedAt: new Date().toISOString(),
      ...metadata,
    },
  })
}

function createInsight(request, normalizedInput) {
  return {
    title: 'Insight inicial',
    message:
      normalizedInput.length > 0
        ? 'Foi identificado contexto suficiente para uma analise inicial baseada em regras locais.'
        : 'Ainda nao ha contexto suficiente para gerar um insight especifico.',
    riskLevel: AI_RISK_LEVELS.LOW,
    confidence: 0.62,
    metadata: {
      module: request.module,
    },
  }
}

function createRecommendation(request, normalizedInput) {
  return {
    title: 'Recomendacao inicial',
    message:
      normalizedInput.length > 0
        ? 'Priorize validar os dados de entrada antes de conectar este fluxo a provedores externos.'
        : 'Forneca contexto adicional quando esta funcionalidade for integrada a modulos reais.',
    actionType: AI_ACTION_TYPES.RECOMMENDATION,
    riskLevel: AI_RISK_LEVELS.LOW,
    priority: 1,
    metadata: {
      module: request.module,
    },
  }
}

function generateWarning(normalizedInput) {
  const looksSensitive = /token|senha|password|secret|api[-_ ]?key/i.test(normalizedInput)

  if (!looksSensitive) {
    return null
  }

  return {
    title: 'Dado sensivel detectado',
    message: 'A entrada parece conter informacao sensivel e deve ser revisada antes de qualquer integracao externa.',
    riskLevel: AI_RISK_LEVELS.MEDIUM,
    confidence: 0.7,
  }
}

export const localRuleProvider = {
  id: providerId,
  type: AI_PROVIDER_TYPES.LOCAL_RULE,

  generate(request = {}) {
    const action = request.action || AI_ACTION_TYPES.ANALYZE
    const normalizedInput = normalizeInput(request.input)
    const insight = createInsight(request, normalizedInput)
    const recommendation = createRecommendation(request, normalizedInput)
    const warning = generateWarning(normalizedInput)

    if (action === AI_ACTION_TYPES.INSIGHT) {
      return createBaseResponse(action, insight.message, {
        requestId: request.id,
        insights: [insight],
      })
    }

    if (action === AI_ACTION_TYPES.RECOMMENDATION) {
      return createBaseResponse(action, recommendation.message, {
        requestId: request.id,
        recommendations: [recommendation],
      })
    }

    if (action === AI_ACTION_TYPES.SUMMARY) {
      return createBaseResponse(action, 'Resumo local gerado a partir das regras iniciais do AI Engine.', {
        requestId: request.id,
        inputLength: normalizedInput.length,
      })
    }

    const response = createBaseResponse(
      warning ? AI_ACTION_TYPES.WARNING : AI_ACTION_TYPES.ANALYZE,
      warning?.message || 'Analise local concluida com sucesso pela fundacao do AI Engine.',
      {
        requestId: request.id,
        inputLength: normalizedInput.length,
      },
    )

    return {
      ...response,
      insights: warning ? [warning, insight] : [insight],
      recommendations: [recommendation],
      riskLevel: warning?.riskLevel || response.riskLevel,
    }
  },

  healthCheck() {
    return createBaseResponse('health', 'Local rule provider operacional.', {
      providerId,
    })
  },
}
