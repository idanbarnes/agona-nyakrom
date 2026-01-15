import { cn } from '../../lib/cn.js'

export const toastStyles = {
  container:
    'w-full max-w-sm rounded-lg border border-border bg-surface p-4 text-foreground shadow-lg',
  title: 'text-sm font-semibold text-foreground',
  message: 'mt-1 text-sm text-muted-foreground',
  variants: {
    success: 'border-success/40 bg-success/10',
    error: 'border-danger/40 bg-danger/10',
    warning: 'border-warning/40 bg-warning/10',
    info: 'border-primary/40 bg-primary/10',
  },
}

// Apply toastStyles to the existing toast component by mapping type -> variants[type].

const defaultTitles = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

export function ToastMessage({
  type = 'info',
  title,
  message,
  className,
  role,
}) {
  if (!message) {
    return null
  }

  const variantClass = toastStyles.variants[type] || toastStyles.variants.info
  const resolvedTitle = title ?? defaultTitles[type]
  const ariaRole = role || (type === 'error' ? 'alert' : 'status')

  return (
    <div
      className={cn(toastStyles.container, variantClass, className)}
      role={ariaRole}
      aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'}
    >
      {resolvedTitle ? (
        <p className={toastStyles.title}>{resolvedTitle}</p>
      ) : null}
      <p className={toastStyles.message}>{message}</p>
    </div>
  )
}
