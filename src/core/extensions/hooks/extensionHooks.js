export function createExtensionHooks(engine) {
  return {
    getExtensions() {
      return engine.registry.list()
    },

    getMenus() {
      return engine.menus.list()
    },

    getRoutes() {
      return engine.routes.list()
    },

    hasPermission(extensionId, permissionKey) {
      return engine.permissions.can(extensionId, permissionKey)
    },
  }
}
