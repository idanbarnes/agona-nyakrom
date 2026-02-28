import { cn } from '../../lib/cn.js'

function IconBase({ className, children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5 shrink-0', className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function HomeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </IconBase>
  )
}

export function NewsIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </IconBase>
  )
}

export function CalendarIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
    </IconBase>
  )
}

export function MegaphoneIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1.5-5H11l7-4V8l-7-4H5a2 2 0 0 0-2 2v2" />
      <path d="M6 9v6" />
    </IconBase>
  )
}

export function HeartIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.8-7 10-7 10Z" />
    </IconBase>
  )
}

export function UsersIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M14 19a4 4 0 0 1 7 0" />
    </IconBase>
  )
}

export function ShieldIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3 5 6v6c0 4.5 2.8 7.6 7 9 4.2-1.4 7-4.5 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </IconBase>
  )
}

export function AwardIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="8.5" r="4.5" />
      <path d="M9.5 13 8 21l4-2.3L16 21l-1.5-8" />
    </IconBase>
  )
}

export function SettingsIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-1.7-1l-.4-2.7h-4l-.4 2.7a7 7 0 0 0-1.7 1l-2.5-1-2 3.4L5.1 11a7 7 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7 7 0 0 0 1.7 1l.4 2.7h4l.4-2.7a7 7 0 0 0 1.7-1l2.5 1 2-3.4L18.9 13c.1-.3.1-.7.1-1Z" />
    </IconBase>
  )
}

export function PhoneIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 4h4l2 5-2 1.5A13 13 0 0 0 13.5 15L15 13l5 2v4a2 2 0 0 1-2 2h-1C10 21 3 14 3 6V5a2 2 0 0 1 2-1Z" />
    </IconBase>
  )
}

export function HelpCircleIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.5a2.7 2.7 0 1 1 4.2 2.3c-.9.5-1.5 1.1-1.5 2.2" />
      <path d="M12 17h.01" />
    </IconBase>
  )
}

export function ImageIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m20 15-4-4-5 5-2-2-5 5" />
    </IconBase>
  )
}

export function BookOpenIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 6a5 5 0 0 0-4-2H5a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h3a5 5 0 0 1 4 2" />
      <path d="M12 6a5 5 0 0 1 4-2h3a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2h-3a5 5 0 0 0-4 2" />
    </IconBase>
  )
}

export function MenuIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </IconBase>
  )
}

export function CloseIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </IconBase>
  )
}

export function ChevronDownIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  )
}

export function ChevronRightIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  )
}

export function TrendingUpIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="m3 17 7-7 4 4 7-7" />
      <path d="M15 7h6v6" />
    </IconBase>
  )
}

export function EyeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  )
}
