import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { Button } from './button.jsx'

export function DetailPageCTA({
  to,
  label = 'View Details',
  children,
  variant = 'primary',
  size = 'sm',
  disabled = false,
  className,
  icon,
  iconPosition = 'end',
  ...props
}) {
  const isDisabled = disabled || !to
  const content = children ?? label
  const Component = isDisabled ? 'span' : Link

  return (
    <Button
      as={Component}
      to={isDisabled ? undefined : to}
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={cn(
        'border-transparent bg-[#D97706] text-white hover:bg-[#B45309] focus-visible:ring-[#D97706]',
        className,
      )}
      {...props}
    >
      {icon && iconPosition === 'start' ? icon : null}
      {content}
      {icon && iconPosition !== 'start' ? icon : null}
    </Button>
  )
}
