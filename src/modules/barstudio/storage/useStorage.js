import { useContext } from 'react'
import { StorageContext } from './StorageContext'

export default function useStorage() {
  const storage = useContext(StorageContext)
  if (!storage) throw new Error('useStorage deve ser utilizado dentro de StorageContextProvider.')
  return storage
}

