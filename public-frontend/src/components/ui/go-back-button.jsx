import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/cn.js'

function ArrowLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

function hasUsableHistory() {
  return typeof window !== 'undefined' && window.history.length > 1
}

export function GoBackButton({
  fallbackTo = '/',
  to,
  className,
  label = 'Go back',
  showLabel = false,
  replace = false,
}) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to, { replace })
      return
    }

    if (hasUsableHistory()) {
      navigate(-1)
      return
    }

    navigate(fallbackTo, { replace: true })
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface/90 text-foreground transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-border hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        showLabel ? 'w-auto gap-2 px-3 text-sm font-medium' : '',
        className,
      )}
    >
      <ArrowLeftIcon />
      {showLabel ? <span>{label}</span> : null}
    </button>
  )
}
