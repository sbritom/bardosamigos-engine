import { createContext, useCallback, useMemo, useState } from 'react'
import SupabaseStorageProvider from './providers/SupabaseStorageProvider'
import { STORAGE_STATUS } from './storageConstants'
import { createStorageOperation } from './storageTypes'

export const StorageContext = createContext(null)

function nextPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve())
    else setTimeout(resolve, 0)
  })
}

export function StorageContextProvider({ children, provider }) {
  const activeProvider = useMemo(() => provider || new SupabaseStorageProvider(), [provider])
  const [operation, setOperation] = useState(() => createStorageOperation())

  const run = useCallback(async (callback, { trackUpload = false } = {}) => {
    try {
      if (trackUpload) setOperation(createStorageOperation({ status: STORAGE_STATUS.PREPARING, progress: 10 }))
      await nextPaint()
      if (trackUpload) setOperation(createStorageOperation({ status: STORAGE_STATUS.UPLOADING, progress: 40 }))
      const result = await callback(activeProvider)
      if (trackUpload) {
        setOperation(createStorageOperation({ status: STORAGE_STATUS.PROCESSING, progress: 85 }))
        await nextPaint()
        setOperation(createStorageOperation({ status: STORAGE_STATUS.COMPLETED, progress: 100 }))
      }
      return result
    } catch (error) {
      if (trackUpload) setOperation(createStorageOperation({ status: STORAGE_STATUS.ERROR, progress: 0, error }))
      throw error
    }
  }, [activeProvider])

  const value = useMemo(() => ({
    upload: (file) => run((current) => current.upload(file), { trackUpload: true }),
    download: (id) => run((current) => current.download(id)),
    delete: (id) => run((current) => current.delete(id)),
    get: (id) => run((current) => current.get(id)),
    list: () => run((current) => current.list()),
    health: () => run((current) => current.health()),
    capabilities: activeProvider.capabilities,
    operation,
    resetOperation: () => setOperation(createStorageOperation()),
  }), [activeProvider.capabilities, operation, run])

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
}
