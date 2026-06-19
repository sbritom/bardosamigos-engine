export function createExtensionApi(dependencies = {}) {
  return {
    registry: dependencies.registry,
    menus: dependencies.menus,
    routes: dependencies.routes,
    permissions: dependencies.permissions,
    events: dependencies.events,

    getContext(extension) {
      return {
        manifest: extension.manifest,
        api: this,
        registry: dependencies.registry,
        permissions: dependencies.permissions,
        events: dependencies.events,
      }
    },
  }
}
