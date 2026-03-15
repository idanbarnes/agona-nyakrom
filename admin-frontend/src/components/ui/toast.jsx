import { cn } from '../../lib/cn.js'
import { toastStyles } from './toast-styles.js'

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
