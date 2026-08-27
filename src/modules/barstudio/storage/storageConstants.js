export const STORAGE_BUCKET = import.meta.env?.VITE_SUPABASE_STORAGE_BUCKET || 'media'
export const STORAGE_PREFIX = 'barstudio'
export const STORAGE_MAX_FILE_SIZE = 20 * 1024 * 1024

export const STORAGE_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml'

export const STORAGE_IMAGE_TYPES = Object.freeze({
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/jpg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
  'image/gif': ['gif'],
  'image/svg+xml': ['svg'],
})

export const STORAGE_STATUS = Object.freeze({
  IDLE: 'idle',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
})

export const STORAGE_STATUS_LABELS = Object.freeze({
  [STORAGE_STATUS.IDLE]: 'Pronto',
  [STORAGE_STATUS.PREPARING]: 'Preparando',
  [STORAGE_STATUS.UPLOADING]: 'Enviando',
  [STORAGE_STATUS.PROCESSING]: 'Processando',
  [STORAGE_STATUS.COMPLETED]: 'Concluído',
  [STORAGE_STATUS.ERROR]: 'Erro',
})
