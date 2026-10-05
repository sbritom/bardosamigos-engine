export function createStorageOperation(overrides = {}) {
  return {
    status: 'idle',
    progress: 0,
    error: null,
    ...overrides,
  }
}

export function createStorageAsset(overrides = {}) {
  return {
    id: '',
    path: '',
    name: '',
    originalName: '',
    mimeType: '',
    size: 0,
    publicUrl: '',
    directUrl: '',
    createdAt: '',
    status: 'completed',
    ...overrides,
  }
}

