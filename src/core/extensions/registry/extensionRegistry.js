export function createExtensionRegistry() {
  const extensions = new Map()

  return {
    register(extension) {
      if (!extension?.manifest?.id) {
        return null
      }

      const entry = {
        extension,
        manifest: extension.manifest,
        installed: false,
        enabled: false,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      extensions.set(extension.manifest.id, entry)
      return { ...entry }
    },

    unregister(extensionId) {
      return extensions.delete(extensionId)
    },

    get(extensionId) {
      const entry = extensions.get(extensionId)
      return entry ? { ...entry } : null
    },

    getExtension(extensionId) {
      return extensions.get(extensionId)?.extension || null
    },

    updateState(extensionId, nextState = {}) {
      const entry = extensions.get(extensionId)

      if (!entry) {
        return null
      }

      const updatedEntry = {
        ...entry,
        ...nextState,
        updatedAt: new Date().toISOString(),
      }

      extensions.set(extensionId, updatedEntry)
      return { ...updatedEntry }
    },

    list() {
      return Array.from(extensions.values()).map((entry) => ({ ...entry }))
    },

    clear() {
      extensions.clear()
    },
  }
}

export const extensionRegistry = createExtensionRegistry()
