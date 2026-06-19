import { Alert } from './Alert'

export function Toast({ toast, onClose }) {
  return (
    <Alert status={toast.status || 'info'} title={toast.title}>
      <span>{toast.message}</span>
      {onClose && <button type="button" onClick={() => onClose(toast.id)}>Fechar</button>}
    </Alert>
  )
}
