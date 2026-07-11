import { tvRepository } from '../repository'
import { slugifyTVValue } from '../utils'

function normalizeCategory(payload) {
  return {
    name: String(payload.name || '').trim(),
    slug: slugifyTVValue(payload.slug || payload.name),
    description: String(payload.description || '').trim() || null,
    icon: String(payload.icon || '').trim() || null,
    color: String(payload.color || '').trim() || null,
    displayOrder: Math.max(0, Number(payload.displayOrder) || 0),
    enabled: payload.enabled !== false,
  }
}

async function validate(payload, excludeId) {
  const category = normalizeCategory(payload)
  if (!category.name) return { data: category, error: new Error('Informe o nome da categoria.') }
  if (!category.slug) return { data: category, error: new Error('Informe um slug valido.') }
  const duplicate = await tvRepository.slugExists('tv_categories', category.slug, excludeId)
  if (duplicate.error) return { data: category, error: duplicate.error }
  if (duplicate.exists) return { data: category, error: new Error('Este slug ja esta em uso.') }
  return { data: category, error: null }
}

export const TVCategoryService = {
  list: () => tvRepository.listCategories(),
  listAdmin: () => tvRepository.listAdminCategories(),
  async createCategory(payload) {
    const validation = await validate(payload)
    return validation.error ? validation : tvRepository.createCategory(validation.data)
  },
  async updateCategory(id, payload) {
    const validation = await validate(payload, id)
    return validation.error ? validation : tvRepository.updateCategory(id, validation.data)
  },
  deleteCategory: (id, moveToCategoryId) => tvRepository.deleteCategory(id, moveToCategoryId),
  reorderCategories: (items) => tvRepository.reorderCategories(items),
}
