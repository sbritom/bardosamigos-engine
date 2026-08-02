import StorageProvider from './StorageProvider.js'

const unavailable = () => Promise.reject(new Error('Este provedor ainda não está configurado.'))

export default class ImgBBStorageProvider extends StorageProvider {
  constructor() { super({ name: 'imgbb' }) }
  upload() { return unavailable() }
  download() { return unavailable() }
  delete() { return unavailable() }
  get() { return unavailable() }
  list() { return unavailable() }
  health() { return Promise.resolve({ available: false }) }
}
