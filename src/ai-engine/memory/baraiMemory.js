import { removeSensitiveFields } from '../utils/aiSanitizer'

export function createBarAiMemory() {
  const memory = new Map()

  return {
    remember(scope = 'global', value = {}) {
      const safeValue = removeSensitiveFields(value)
      const entries = memory.get(scope) || []
      const entry = {
        id: safeValue.id || crypto.randomUUID?.() || `${Date.now()}-${entries.length}`,
        createdAt: new Date().toISOString(),
        value: safeValue,
      }

      memory.set(scope, [...entries, entry])
      return entry
    },

    recall(scope = 'global') {
      return [...(memory.get(scope) || [])]
    },

    forget(scope = 'global', entryId) {
      if (!entryId) {
        memory.delete(scope)
        return true
      }

      const entries = memory.get(scope) || []
      memory.set(
        scope,
        entries.filter((entry) => entry.id !== entryId),
      )

      return true
    },

    clearMemory() {
      memory.clear()
    },

    getSnapshot() {
      return Object.fromEntries(memory.entries())
    },
  }
}

export const barAiMemory = createBarAiMemory()
