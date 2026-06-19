import { aiEngine } from './aiEngine'
import { createBarAiCapabilities } from './capabilities/baraiCapabilities'
import { createBarAiConfig } from './config/baraiConfig'
import { createBarAiEventBus } from './events/baraiEventBus'
import { createBarAiMemory } from './memory/baraiMemory'
import { createBarAiModuleRegistry } from './modules/baraiModuleRegistry'
import { createBarAiPersonality } from './personality/baraiPersonality'

const capabilityByMethod = Object.freeze({
  analyze: 'analyze',
  generateInsight: 'insight',
  generateRecommendation: 'recommendation',
  summarize: 'summary',
})

function disabledResponse(type, reason) {
  return {
    ok: false,
    provider: 'barai-core',
    type,
    message: reason,
    error: reason,
  }
}

export function createBarAiCore(options = {}) {
  const engine = options.engine || aiEngine
  const config = options.config || createBarAiConfig(options.initialConfig)
  const personality = options.personality || createBarAiPersonality(options.initialPersonality)
  const memory = options.memory || createBarAiMemory()
  const moduleRegistry = options.moduleRegistry || createBarAiModuleRegistry(options.initialModules)
  const eventBus = options.eventBus || createBarAiEventBus()
  const capabilities = options.capabilities || createBarAiCapabilities(options.initialCapabilities)

  async function run(methodName, request = {}) {
    const currentConfig = config.getConfig()
    const capability = capabilityByMethod[methodName]

    if (!currentConfig.enabled) {
      return disabledResponse(methodName, 'BarAI Core esta desabilitado por configuracao.')
    }

    if (capability && !capabilities.isEnabled(capability)) {
      return disabledResponse(methodName, `Capability ${capability} esta desabilitada.`)
    }

    const enrichedRequest = personality.applyToRequest({
      ...request,
      context: {
        locale: currentConfig.locale,
        timezone: currentConfig.timezone,
        ...request.context,
      },
      metadata: {
        ...request.metadata,
        barAiCore: currentConfig.coreName,
      },
    })

    if (currentConfig.eventsEnabled && capabilities.isEnabled('events')) {
      eventBus.emit('barai:request', {
        methodName,
        request: enrichedRequest,
      })
    }

    const response = await engine[methodName](enrichedRequest)

    if (currentConfig.memoryEnabled && capabilities.isEnabled('memory')) {
      memory.remember('barai:requests', {
        methodName,
        module: enrichedRequest.module,
        responseType: response.type,
        ok: response.ok,
      })
    }

    if (currentConfig.eventsEnabled && capabilities.isEnabled('events')) {
      eventBus.emit('barai:response', {
        methodName,
        response,
      })
    }

    return response
  }

  return {
    name: 'BarAI Core',
    config,
    personality,
    memory,
    moduleRegistry,
    eventBus,
    capabilities,

    analyze(request) {
      return run('analyze', request)
    },

    generateInsight(request) {
      return run('generateInsight', request)
    },

    generateRecommendation(request) {
      return run('generateRecommendation', request)
    },

    summarize(request) {
      return run('summarize', request)
    },

    healthCheck() {
      return engine.healthCheck()
    },
  }
}

export const barAiCore = createBarAiCore()
