import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

// Shared nav items for desktop and mobile menus.
const navItems = [
  { label: 'Home', to: '/' },
  { label: 'History', to: '/about/history' },
  { label: 'Clans', to: '/clans' },
  { label: 'Asafo Companies', to: '/asafo-companies' },
  { label: 'Hall of Fame', to: '/hall-of-fame' },
  { label: 'Landmarks', to: '/landmarks' },
  { label: 'Obituaries', to: '/obituaries' },
  { label: 'News', to: '/news' },
  { label: 'Contact Us', to: '/contact' },
]

function Navbar({ settings, loading }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const toggleRef = useRef(null)
  const firstLinkRef = useRef(null)
  const lastActiveRef = useRef(null)
  const siteName =
    settings?.site_name || settings?.siteName || 'Nyakrom Community'
  const resolvedItems = useMemo(() => navItems, [])

  // Close the mobile menu after navigation.
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('overflow-hidden')
      return undefined
    }

    lastActiveRef.current = document.activeElement
    document.body.classList.add('overflow-hidden')

    const timer = window.setTimeout(() => {
      firstLinkRef.current?.focus()
    }, 0)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(timer)
      if (lastActiveRef.current?.focus) {
        lastActiveRef.current.focus()
      }
    }
  }, [isOpen])

  return (
    <header
      className="z-50 border-b border-border bg-background/80 backdrop-blur"
      style={{ position: 'sticky', top: 0 }}
    >
      <nav aria-label="Main">
        <div className="container flex h-16 items-center justify-between">
          {/* Placeholder for future logo support. */}
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-muted-foreground">
              □
            </span>
            <NavLink to="/" className="text-sm font-semibold text-foreground">
              {siteName}
            </NavLink>
          </div>
          <ul className="hidden items-center gap-6 md:flex">
            {resolvedItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition hover:text-foreground',
                      isActive
                        ? 'bg-muted text-foreground underline underline-offset-4'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        {/* Hamburger menu for small screens (visibility handled later with styling). */}
          <button
            ref={toggleRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen(true)}
            className="h-11 rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground md:hidden"
          >
            Menu
          </button>
        </div>
      </nav>
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-menu"
            aria-label="Mobile menu"
            className="absolute inset-x-0 top-16 border-b border-border bg-background/95 backdrop-blur"
          >
            <div className="container space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Menu
                </span>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setIsOpen(false)}
                  className="h-11 rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <ul className="flex flex-col gap-3">
                {resolvedItems.map((item, index) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      ref={index === 0 ? firstLinkRef : null}
                      className={({ isActive }) =>
                        [
                          'flex h-11 items-center justify-between rounded-md px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground',
                          isActive ? 'bg-muted text-foreground' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {loading && (
                <p className="text-xs text-muted-foreground">
                  Loading site settings...
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}

export default Navbar
