import { removeSensitiveFields } from './aiSanitizer'

export function formatAiLog(event = {}) {
  return {
    timestamp: new Date().toISOString(),
    ...removeSensitiveFields(event),
  }
}

export function logAiEvent(event = {}) {
  const formattedEvent = formatAiLog({
    level: 'info',
    ...event,
  })

  console.info('[AI Engine]', formattedEvent)
  return formattedEvent
}

export function logAiError(error, context = {}) {
  const formattedError = formatAiLog({
    level: 'error',
    message: error?.message || 'Unknown AI Engine error',
    stack: error?.stack,
    context,
  })

  console.error('[AI Engine]', formattedError)
  return formattedError
}
