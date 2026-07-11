import { useContext } from 'react'
import { TVContext } from '../runtime'

export function useTVContext() {
  const context = useContext(TVContext)
  if (!context) {
    throw new Error('TV hooks must be used inside TVProvider.')
  }
  return context
}
