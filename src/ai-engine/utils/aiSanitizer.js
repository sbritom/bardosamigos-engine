const SENSITIVE_KEYS = [
  'accessToken',
  'apiKey',
  'authorization',
  'jwt',
  'password',
  'privateKey',
  'refreshToken',
  'secret',
  'token',
]

const MAX_TEXT_LENGTH = 4000

const isSensitiveKey = (key) => {
  const normalizedKey = String(key).toLowerCase()
  return SENSITIVE_KEYS.some((sensitiveKey) =>
    normalizedKey.includes(sensitiveKey.toLowerCase()),
  )
}

export function removeSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => removeSensitiveFields(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.entries(value).reduce((safeValue, [key, entryValue]) => {
    safeValue[key] = isSensitiveKey(key) ? '[redacted]' : removeSensitiveFields(entryValue)
    return safeValue
  }, {})
}

export function sanitizeAiInput(input) {
  if (typeof input === 'string') {
    return input.trim().slice(0, MAX_TEXT_LENGTH)
  }

  return removeSensitiveFields(input)
}

export function sanitizeAiOutput(output) {
  if (typeof output === 'string') {
    return output.trim().slice(0, MAX_TEXT_LENGTH)
  }

  return removeSensitiveFields(output)
}
