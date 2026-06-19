export function createExtensionEventBus() {
  const listeners = new Map()
  const declaredEvents = new Map()

  function getListeners(eventName) {
    return listeners.get(eventName) || new Set()
  }

  return {
    declare(extensionId, event = {}) {
      if (!extensionId || !event.name) {
        return null
      }

      const entry = { extensionId, ...event }
      declaredEvents.set(`${extensionId}:${event.name}`, entry)
      return { ...entry }
    },

    on(eventName, listener) {
      if (!eventName || typeof listener !== 'function') {
        return () => {}
      }

      const eventListeners = getListeners(eventName)
      eventListeners.add(listener)
      listeners.set(eventName, eventListeners)

      return () => this.off(eventName, listener)
    },

    off(eventName, listener) {
      const eventListeners = getListeners(eventName)
      eventListeners.delete(listener)

      if (eventListeners.size === 0) {
        listeners.delete(eventName)
      }
    },

    emit(eventName, payload = {}) {
      const results = []

      getListeners(eventName).forEach((listener) => {
        results.push(listener(payload))
      })

      return results
    },

    listDeclared(extensionId) {
      return Array.from(declaredEvents.values()).filter(
        (event) => !extensionId || event.extensionId === extensionId,
      )
    },

    unregisterByExtension(extensionId) {
      Array.from(declaredEvents.keys()).forEach((key) => {
        if (key.startsWith(`${extensionId}:`)) {
          declaredEvents.delete(key)
        }
      })
    },
  }
}

export const extensionEventBus = createExtensionEventBus()
