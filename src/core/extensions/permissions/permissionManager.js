export function createExtensionPermissionManager() {
  const permissions = new Map()

  return {
    register(extensionId, permission = {}) {
      if (!extensionId || !permission.key) {
        return null
      }

      const entry = {
        extensionId,
        required: false,
        granted: false,
        ...permission,
      }

      permissions.set(`${extensionId}:${permission.key}`, entry)
      return { ...entry }
    },

    grant(extensionId, permissionKey) {
      const key = `${extensionId}:${permissionKey}`
      const permission = permissions.get(key)

      if (!permission) {
        return null
      }

      const nextPermission = { ...permission, granted: true }
      permissions.set(key, nextPermission)
      return { ...nextPermission }
    },

    revoke(extensionId, permissionKey) {
      const key = `${extensionId}:${permissionKey}`
      const permission = permissions.get(key)

      if (!permission) {
        return null
      }

      const nextPermission = { ...permission, granted: false }
      permissions.set(key, nextPermission)
      return { ...nextPermission }
    },

    can(extensionId, permissionKey) {
      return Boolean(permissions.get(`${extensionId}:${permissionKey}`)?.granted)
    },

    list(extensionId) {
      return Array.from(permissions.values()).filter(
        (permission) => !extensionId || permission.extensionId === extensionId,
      )
    },

    unregisterByExtension(extensionId) {
      Array.from(permissions.keys()).forEach((key) => {
        if (key.startsWith(`${extensionId}:`)) {
          permissions.delete(key)
        }
      })
    },

    clear() {
      permissions.clear()
    },
  }
}

export const extensionPermissionManager = createExtensionPermissionManager()
