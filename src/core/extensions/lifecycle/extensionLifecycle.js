const lifecycleMethods = Object.freeze({
  INSTALL: 'install',
  ENABLE: 'enable',
  DISABLE: 'disable',
  UNINSTALL: 'uninstall',
  UPDATE: 'update',
})

async function callLifecycle(extension, methodName, context) {
  if (typeof extension?.[methodName] === 'function') {
    await extension[methodName](context)
  }
}

export function createExtensionLifecycle(dependencies = {}) {
  const { registry, menus, routes, permissions, events, api } = dependencies

  function registerManifestResources(extension) {
    const { manifest } = extension

    ;(manifest.permissions || []).forEach((permission) => {
      permissions.register(manifest.id, permission)
    })

    ;(manifest.menus || []).forEach((menu) => {
      menus.register(manifest.id, menu)
    })

    ;(manifest.routes || []).forEach((route) => {
      routes.register(manifest.id, route)
    })

    ;(manifest.events || []).forEach((event) => {
      events.declare(manifest.id, event)
    })
  }

  function unregisterManifestResources(extensionId) {
    menus.unregisterByExtension(extensionId)
    routes.unregisterByExtension(extensionId)
    permissions.unregisterByExtension(extensionId)
    events.unregisterByExtension(extensionId)
  }

  return {
    async install(extensionId) {
      const extension = registry.getExtension(extensionId)

      if (!extension) {
        return null
      }

      registerManifestResources(extension)
      await callLifecycle(extension, lifecycleMethods.INSTALL, api.getContext(extension))

      return registry.updateState(extensionId, { installed: true })
    },

    async enable(extensionId) {
      const extension = registry.getExtension(extensionId)

      if (!extension) {
        return null
      }

      await callLifecycle(extension, lifecycleMethods.ENABLE, api.getContext(extension))
      return registry.updateState(extensionId, { enabled: true })
    },

    async disable(extensionId) {
      const extension = registry.getExtension(extensionId)

      if (!extension) {
        return null
      }

      await callLifecycle(extension, lifecycleMethods.DISABLE, api.getContext(extension))
      return registry.updateState(extensionId, { enabled: false })
    },

    async uninstall(extensionId) {
      const extension = registry.getExtension(extensionId)

      if (!extension) {
        return null
      }

      await callLifecycle(extension, lifecycleMethods.UNINSTALL, api.getContext(extension))
      unregisterManifestResources(extensionId)
      registry.unregister(extensionId)

      return { extensionId, uninstalled: true }
    },

    async update(extensionId, nextExtension) {
      const currentExtension = registry.getExtension(extensionId)

      if (!currentExtension || !nextExtension?.manifest?.id) {
        return null
      }

      await callLifecycle(currentExtension, lifecycleMethods.UPDATE, api.getContext(currentExtension))
      unregisterManifestResources(extensionId)
      const registered = registry.register(nextExtension)
      registerManifestResources(nextExtension)

      return registered
    },
  }
}

export { lifecycleMethods }
