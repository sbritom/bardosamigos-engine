import { toCamelCase, toSnakeCase } from './baseMapper'

export function mapProfileFromRow(row) {
  return toCamelCase(row)
}

export function mapProfileToRow(profile) {
  return toSnakeCase(profile)
}
