import { createExtensionApi } from '../api/extensionApi'
import { createExtensionEventBus } from '../events/extensionEventBus'
import { createExtensionHooks } from '../hooks/extensionHooks'
import { createExtensionLifecycle } from '../lifecycle/extensionLifecycle'
import { createExtensionLoader } from '../loader/extensionLoader'
import { createExtensionMenuRegistry } from '../menu/menuRegistry'
import { createExtensionRouteRegistry } from '../navigation/routeRegistry'
import { createExtensionPermissionManager } from '../permissions/permissionManager'
import { createExtensionRegistry } from '../registry/extensionRegistry'

export function createBarExtensionEngine() {
  const registry = createExtensionRegistry()
  const menus = createExtensionMenuRegistry()
  const routes = createExtensionRouteRegistry()
  const permissions = createExtensionPermissionManager()
  const events = createExtensionEventBus()
  const api = createExtensionApi({ registry, menus, routes, permissions, events })
  const lifecycle = createExtensionLifecycle({ registry, menus, routes, permissions, events, api })
  const loader = createExtensionLoader({ registry, lifecycle })

  const engine = {
    name: 'Bar Extension Engine',
    registry,
    menus,
    routes,
    permissions,
    events,
    api,
    lifecycle,
    loader,

    async register(extension) {
      return loader.load(extension)
    },

    async enable(extensionId) {
      return lifecycle.enable(extensionId)
    },

    async disable(extensionId) {
      return lifecycle.disable(extensionId)
    },

    async uninstall(extensionId) {
      return lifecycle.uninstall(extensionId)
    },

    async update(extensionId, nextExtension) {
      return lifecycle.update(extensionId, nextExtension)
    },

    healthCheck() {
      return {
        ok: true,
        name: 'Bar Extension Engine',
        extensions: registry.list().length,
        routes: routes.list().length,
        menus: menus.list().length,
      }
    },
  }

  return {
    ...engine,
    hooks: createExtensionHooks(engine),
  }
}

export const barExtensionEngine = createBarExtensionEngine()
