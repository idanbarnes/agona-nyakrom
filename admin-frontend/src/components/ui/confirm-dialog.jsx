import React from 'react'
import { Button } from './button.jsx'
import { Modal } from './modal.jsx'

const defaultTitles = {
  danger: 'Confirm deletion',
  primary: 'Confirm action',
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const heading = title || defaultTitles[variant] || 'Confirm'

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={heading}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </Modal>
  )
}
