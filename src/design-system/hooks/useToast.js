import { useCallback, useState } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((toast) => {
    const id = toast.id || crypto.randomUUID?.() || `toast-${Date.now()}`
    const nextToast = {
      id,
      status: 'info',
      ...toast,
    }

    setToasts((current) => [...current, nextToast])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return {
    toasts,
    pushToast,
    removeToast,
    clearToasts: () => setToasts([]),
  }
}
