export const DEFAULT_BARAI_CAPABILITIES = Object.freeze({
  analyze: true,
  insight: true,
  recommendation: true,
  summary: true,
  memory: true,
  events: true,
  externalProviders: false,
  moduleIntegrations: false,
})

export function createBarAiCapabilities(initialCapabilities = {}) {
  let capabilities = {
    ...DEFAULT_BARAI_CAPABILITIES,
    ...initialCapabilities,
  }

  return {
    isEnabled(capability) {
      return Boolean(capabilities[capability])
    },

    enable(capability) {
      capabilities = {
        ...capabilities,
        [capability]: true,
      }

      return { ...capabilities }
    },

    disable(capability) {
      capabilities = {
        ...capabilities,
        [capability]: false,
      }

      return { ...capabilities }
    },

    setCapability(capability, enabled) {
      capabilities = {
        ...capabilities,
        [capability]: Boolean(enabled),
      }

      return { ...capabilities }
    },

    listCapabilities() {
      return { ...capabilities }
    },

    resetCapabilities() {
      capabilities = { ...DEFAULT_BARAI_CAPABILITIES }
      return { ...capabilities }
    },
  }
}

export const barAiCapabilities = createBarAiCapabilities()
