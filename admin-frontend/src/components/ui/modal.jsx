import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn.js'

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  closeOnOverlayClick = true,
  size = 'md',
  title,
  children,
  footer,
}) {
  const panelRef = useRef(null)
  const lastActiveRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    lastActiveRef.current = document.activeElement
    const timer = window.setTimeout(() => {
      panelRef.current?.focus()
    }, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(timer)
      if (lastActiveRef.current && lastActiveRef.current.focus) {
        lastActiveRef.current.focus()
      }
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full rounded-lg border border-border bg-surface p-6 text-foreground shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          sizeStyles[size],
        )}
      >
        {title ? (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        ) : null}
        <div className="space-y-4">{children}</div>
        {footer ? <div className="mt-6 flex justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
