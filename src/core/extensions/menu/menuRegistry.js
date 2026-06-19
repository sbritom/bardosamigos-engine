export function createExtensionMenuRegistry() {
  const menus = new Map()

  return {
    register(extensionId, menu = {}) {
      if (!extensionId || !menu.id) {
        return null
      }

      const entry = {
        extensionId,
        order: 100,
        ...menu,
      }

      menus.set(`${extensionId}:${menu.id}`, entry)
      return { ...entry }
    },

    unregisterByExtension(extensionId) {
      Array.from(menus.keys()).forEach((key) => {
        if (key.startsWith(`${extensionId}:`)) {
          menus.delete(key)
        }
      })
    },

    list() {
      return Array.from(menus.values()).sort((a, b) => a.order - b.order)
    },

    clear() {
      menus.clear()
    },
  }
}

export const extensionMenuRegistry = createExtensionMenuRegistry()
