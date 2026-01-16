import React, { useId } from 'react'
import { cn } from '../../lib/cn.js'
import { Label } from './label.jsx'

export function FormField({
  label,
  htmlFor,
  id,
  helpText,
  errorText,
  required = false,
  className,
  children,
}) {
  const autoId = useId()
  const controlId = id || htmlFor || `field-${autoId}`
  const helpId = helpText ? `${controlId}-help` : undefined
  const errorId = errorText ? `${controlId}-error` : undefined
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined

  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        id: children.props.id || controlId,
        'aria-describedby': [
          children.props['aria-describedby'],
          describedBy,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
        // When errorText exists, ensure the control is marked invalid.
        'aria-invalid':
          errorText || children.props['aria-invalid'] ? true : undefined,
      })
    : children

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label htmlFor={controlId}>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </Label>
      ) : null}
      {child}
      {helpText ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      ) : null}
      {errorText ? (
        <p id={errorId} className="text-sm text-danger">
          {errorText}
        </p>
      ) : null}
    </div>
  )
}
