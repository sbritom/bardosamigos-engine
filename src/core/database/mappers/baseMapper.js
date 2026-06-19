function toCamelKey(key) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
}

function toSnakeKey(key) {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

function mapKeys(value, mapper) {
  if (Array.isArray(value)) {
    return value.map((item) => mapKeys(item, mapper))
  }

  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value
  }

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    acc[mapper(key)] = mapKeys(entryValue, mapper)
    return acc
  }, {})
}

export function toCamelCase(value) {
  return mapKeys(value, toCamelKey)
}

export function toSnakeCase(value) {
  return mapKeys(value, toSnakeKey)
}
