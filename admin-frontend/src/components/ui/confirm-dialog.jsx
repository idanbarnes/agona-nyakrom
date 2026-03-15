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
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="w-full sm:w-auto" onClick={onConfirm}>
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
