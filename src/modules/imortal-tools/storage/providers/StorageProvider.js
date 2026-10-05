export default class StorageProvider {
  constructor({ name = 'storage', supportsDelete = false, supportsCancel = false } = {}) {
    this.name = name
    this.capabilities = Object.freeze({ delete: supportsDelete, cancel: supportsCancel })
  }

  upload() { return Promise.reject(new Error('Upload não implementado por este provedor.')) }
  download() { return Promise.reject(new Error('Download não implementado por este provedor.')) }
  delete() { return Promise.reject(new Error('Exclusão não implementada por este provedor.')) }
  get() { return Promise.reject(new Error('Consulta não implementada por este provedor.')) }
  list() { return Promise.reject(new Error('Listagem não implementada por este provedor.')) }
  health() { return Promise.resolve({ available: false }) }
}

