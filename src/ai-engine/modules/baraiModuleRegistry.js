export function createBarAiModuleRegistry(initialModules = []) {
  const modules = new Map()

  initialModules.forEach((module) => {
    if (module?.id) {
      modules.set(module.id, { enabled: false, ...module })
    }
  })

  return {
    registerModule(module = {}) {
      if (!module.id) {
        return null
      }

      const registeredModule = {
        enabled: false,
        capabilities: [],
        integrations: [],
        ...module,
      }

      modules.set(module.id, registeredModule)
      return { ...registeredModule }
    },

    unregisterModule(moduleId) {
      return modules.delete(moduleId)
    },

    getModule(moduleId) {
      const module = modules.get(moduleId)
      return module ? { ...module } : null
    },

    listModules() {
      return Array.from(modules.values()).map((module) => ({ ...module }))
    },

    isModuleRegistered(moduleId) {
      return modules.has(moduleId)
    },
  }
}

export const barAiModuleRegistry = createBarAiModuleRegistry()
