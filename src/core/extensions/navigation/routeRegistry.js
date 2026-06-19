export function createExtensionRouteRegistry() {
  const routes = new Map()

  return {
    register(extensionId, route = {}) {
      if (!extensionId || !route.path) {
        return null
      }

      const entry = {
        extensionId,
        permissions: [],
        ...route,
      }

      routes.set(`${extensionId}:${route.path}`, entry)
      return { ...entry }
    },

    unregisterByExtension(extensionId) {
      Array.from(routes.keys()).forEach((key) => {
        if (key.startsWith(`${extensionId}:`)) {
          routes.delete(key)
        }
      })
    },

    list() {
      return Array.from(routes.values())
    },

    clear() {
      routes.clear()
    },
  }
}

export const extensionRouteRegistry = createExtensionRouteRegistry()
