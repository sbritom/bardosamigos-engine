import { AI_PROVIDER_TYPES } from '../constants'

export const DEFAULT_BARAI_CONFIG = Object.freeze({
  name: 'BarAI',
  coreName: 'BarAI Core',
  enabled: true,
  providerType: AI_PROVIDER_TYPES.LOCAL_RULE,
  locale: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  cacheEnabled: true,
  memoryEnabled: true,
  eventsEnabled: true,
  personalityEnabled: true,
})

export function createBarAiConfig(initialConfig = {}) {
  let config = {
    ...DEFAULT_BARAI_CONFIG,
    ...initialConfig,
  }

  return {
    getConfig() {
      return { ...config }
    },

    updateConfig(nextConfig = {}) {
      config = {
        ...config,
        ...nextConfig,
      }

      return { ...config }
    },

    resetConfig() {
      config = { ...DEFAULT_BARAI_CONFIG }
      return { ...config }
    },

    isEnabled() {
      return Boolean(config.enabled)
    },
  }
}

export const barAiConfig = createBarAiConfig()
