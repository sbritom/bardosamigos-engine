import { logAiError } from '../utils/aiLogger'

export function createBarAiEventBus() {
  const listeners = new Map()

  function getListeners(eventName) {
    return listeners.get(eventName) || new Set()
  }

  return {
    on(eventName, listener) {
      if (!eventName || typeof listener !== 'function') {
        return () => {}
      }

      const eventListeners = getListeners(eventName)
      eventListeners.add(listener)
      listeners.set(eventName, eventListeners)

      return () => this.off(eventName, listener)
    },

    once(eventName, listener) {
      const unsubscribe = this.on(eventName, (payload) => {
        unsubscribe()
        listener(payload)
      })

      return unsubscribe
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
        try {
          results.push(listener(payload))
        } catch (error) {
          logAiError(error, {
            eventName,
            payload,
          })
        }
      })

      return results
    },

    clear(eventName) {
      if (eventName) {
        listeners.delete(eventName)
        return
      }

      listeners.clear()
    },

    listenerCount(eventName) {
      return getListeners(eventName).size
    },
  }
}

export const barAiEventBus = createBarAiEventBus()
