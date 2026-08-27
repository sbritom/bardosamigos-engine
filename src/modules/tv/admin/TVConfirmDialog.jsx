import { AlertTriangle } from 'lucide-react'
import { ActionButton, Modal, Select } from '../../../design-system'

export function TVConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  loading,
  danger = true,
  options,
  optionValue,
  onOptionChange,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="tv-admin-confirm">
        <AlertTriangle size={28} aria-hidden="true" />
        <p>{description}</p>
        {options && (
          <Select
            id="tv-confirm-destination"
            label="Mover canais para"
            value={optionValue}
            onChange={(event) => onOptionChange?.(event.target.value)}
            options={options}
          />
        )}
        <div className="tv-admin-form__actions">
          <ActionButton variant="outline" onClick={onClose}>Cancelar</ActionButton>
          <ActionButton
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            disabled={Boolean(options && !optionValue)}
            onClick={onConfirm}
          >
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </Modal>
  )
}
