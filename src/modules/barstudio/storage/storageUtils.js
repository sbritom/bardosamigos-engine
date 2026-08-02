import { STORAGE_IMAGE_TYPES, STORAGE_MAX_FILE_SIZE, STORAGE_PREFIX } from './storageConstants.js'

const UNSAFE_SVG_ELEMENTS = 'script, foreignObject, iframe, object, embed'

function hasInvalidControlCharacters(value) {
  return Array.from(String(value || '')).some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })
}

export function getFileExtension(name) {
  return String(name || '').split('.').pop()?.toLowerCase() || ''
}

export function sanitizeStorageFilename(name) {
  const extension = getFileExtension(name)
  const basename = String(name || '')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'imagem'
  return extension ? `${basename}.${extension}` : basename
}

export function validateStorageImageFile(file) {
  if (!file) return 'Selecione uma imagem.'
  if (!file.name || file.name.length > 180 || hasInvalidControlCharacters(file.name)) return 'O nome do arquivo é inválido.'
  if (file.name.includes('/') || file.name.includes('\\')) return 'O nome do arquivo não pode conter caminhos.'
  if (file.size <= 0) return 'O arquivo está vazio ou corrompido.'
  if (file.size > STORAGE_MAX_FILE_SIZE) return 'A imagem deve ter no máximo 20 MB.'

  const allowedExtensions = STORAGE_IMAGE_TYPES[file.type]
  if (!allowedExtensions) return 'Use uma imagem PNG, JPG, JPEG, WEBP, AVIF, GIF ou SVG.'
  if (!allowedExtensions.includes(getFileExtension(file.name))) return 'A extensão do arquivo não corresponde ao tipo da imagem.'
  return ''
}

export async function validateSvgFile(file) {
  if (file.type !== 'image/svg+xml') return ''
  const source = await file.text()
  const documentNode = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (documentNode.querySelector('parsererror') || documentNode.documentElement.nodeName.toLowerCase() !== 'svg') {
    return 'O arquivo SVG está corrompido ou é inválido.'
  }
  if (documentNode.querySelector(UNSAFE_SVG_ELEMENTS)) return 'O SVG contém elementos que não podem ser hospedados com segurança.'

  for (const element of documentNode.querySelectorAll('*')) {
    for (const attribute of element.attributes) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim().toLowerCase()
      if (name.startsWith('on')) return 'O SVG contém eventos que não podem ser hospedados com segurança.'
      if ((name === 'href' || name.endsWith(':href')) && value && !value.startsWith('#')) {
        return 'O SVG contém referências externas que não podem ser hospedadas.'
      }
    }
  }
  return ''
}

export function createStoragePath(file, prefix = STORAGE_PREFIX) {
  const identifier = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}/${identifier}-${sanitizeStorageFilename(file.name)}`
}

export function normalizeStorageId(value) {
  const path = typeof value === 'string' ? value : value?.path || value?.id
  const normalized = String(path || '').replace(/^\/+/, '')
  if (!normalized || normalized.includes('..')) throw new Error('Identificador de arquivo inválido.')
  return normalized
}

export function mapStorageError(error) {
  const message = String(error?.message || error || '')
  const normalized = message.toLowerCase()
  if (normalized.includes('row-level security') || normalized.includes('unauthorized')) {
    return new Error('Sua sessão não possui permissão para hospedar arquivos. Entre com uma conta autorizada e tente novamente.')
  }
  if (normalized.includes('bucket not found')) return new Error('O armazenamento não aceitou o envio. Verifique se sua sessão possui permissão para hospedar arquivos.')
  if (normalized.includes('mime type') || normalized.includes('not allowed')) return new Error('Este formato não é aceito pelo armazenamento configurado.')
  if (normalized.includes('abort')) return new Error('O envio foi cancelado.')
  return new Error(message || 'Não foi possível concluir a operação de armazenamento.')
}

export function buildStorageLinks(asset) {
  if (!asset?.publicUrl) return null
  const url = asset.publicUrl
  const alt = Array.from(String(asset.originalName || asset.name || 'Imagem'))
    .filter((character) => !'[]<>"\''.includes(character))
    .join('')
  return {
    direct: url,
    public: url,
    html: `<img src="${url}" alt="${alt}">`,
    bbcode: `[img]${url}[/img]`,
    markdown: `![${alt}](${url})`,
  }
}

export function getStorageFormatLabel(mimeType) {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'JPG'
  if (mimeType === 'image/svg+xml') return 'SVG'
  return String(mimeType || '').replace('image/', '').toUpperCase() || 'Desconhecido'
}
