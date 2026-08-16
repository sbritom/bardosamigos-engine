import { getSupabaseClient } from '../../../../core/database/client/supabaseClient.js'
import { STORAGE_BUCKET, STORAGE_PREFIX } from '../storageConstants.js'
import { createStorageAsset } from '../storageTypes.js'
import { createStoragePath, mapStorageError, normalizeStorageId } from '../storageUtils.js'
import StorageProvider from './StorageProvider.js'

const PUBLIC_SITE_URL = String(import.meta.env?.VITE_PUBLIC_SITE_URL || 'https://radiobardosamigos.com.br').replace(/\/$/, '')

function createShareUrl(path) {
  const filename = normalizeStorageId(path).split('/').pop()
  return `${PUBLIC_SITE_URL}/ft/bda/${encodeURIComponent(filename)}`
}

export default class SupabaseStorageProvider extends StorageProvider {
  constructor({ client, bucket = STORAGE_BUCKET, prefix = STORAGE_PREFIX } = {}) {
    super({ name: 'primary', supportsDelete: true, supportsCancel: false })
    this.client = client || getSupabaseClient()
    this.bucket = bucket
    this.prefix = prefix
  }

  getBucket() {
    if (!this.client) throw new Error('O armazenamento não está configurado neste ambiente.')
    return this.client.storage.from(this.bucket)
  }

  toAsset(path, metadata = {}) {
    const normalizedPath = normalizeStorageId(path)
    const { data } = this.getBucket().getPublicUrl(normalizedPath)
    const shareUrl = createShareUrl(normalizedPath)

    return createStorageAsset({
      id: normalizedPath,
      path: normalizedPath,
      name: normalizedPath.split('/').pop(),
      publicUrl: shareUrl,
      directUrl: data.publicUrl,
      shareUrl,
      ...metadata,
    })
  }

  async upload(file) {
    try {
      const path = createStoragePath(file, this.prefix)
      const { data, error } = await this.getBucket().upload(path, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      })
      if (error) throw error
      return this.toAsset(data.path, {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
      })
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async download(id) {
    try {
      const { data, error } = await this.getBucket().download(normalizeStorageId(id))
      if (error) throw error
      return data
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async delete(id) {
    try {
      const path = normalizeStorageId(id)
      const { error } = await this.getBucket().remove([path])
      if (error) throw error
      return { id: path, deleted: true }
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async get(id) {
    try {
      const path = normalizeStorageId(id)
      const parts = path.split('/')
      const name = parts.pop()
      const folder = parts.join('/')
      const { data, error } = await this.getBucket().list(folder, { limit: 10, search: name })
      if (error) throw error
      const item = (data || []).find((entry) => entry.name === name && entry.id)
      if (!item) throw new Error('Arquivo não encontrado.')
      return this.toAsset(path, {
        mimeType: item.metadata?.mimetype || '',
        size: item.metadata?.size || 0,
        createdAt: item.created_at || item.updated_at || '',
      })
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async list() {
    try {
      const { data, error } = await this.getBucket().list(this.prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })
      if (error) throw error
      return (data || []).filter((item) => item.id).map((item) => this.toAsset(`${this.prefix}/${item.name}`, {
        mimeType: item.metadata?.mimetype || '',
        size: item.metadata?.size || 0,
        createdAt: item.created_at || item.updated_at || '',
      }))
    } catch (error) {
      throw mapStorageError(error)
    }
  }

  async health() {
    try {
      const { error } = await this.getBucket().list(this.prefix, { limit: 1 })
      return { available: !error }
    } catch {
      return { available: false }
    }
  }
}
