import { toCamelCase, toSnakeCase } from './baseMapper'

export function mapCompetitionFromRow(row) {
  return toCamelCase(row)
}

export function mapCompetitionToRow(competition) {
  return toSnakeCase(competition)
}
