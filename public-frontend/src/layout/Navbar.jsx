import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const navItems = [
  { label: 'Home', to: '/' },
  {
    label: 'About Nyakrom',
    children: [
      { label: 'History', to: '/about/history' },
      { label: 'Who We Are', to: '/about/who-we-are' },
      { label: 'About Agona Nyakrom Town', to: '/about/about-agona-nyakrom-town' },
      { label: 'Leadership & Governance', to: '/about/leadership-governance' },
      { label: 'Landmarks', to: '/landmarks' },
    ],
  },
  { label: 'Clans', to: '/clans' },
  { label: 'Asafo Companies', to: '/asafo-companies' },
  { label: 'Hall of Fame', to: '/hall-of-fame' },
  { label: 'Obituaries', to: '/obituaries' },
  { label: 'News', to: '/news' },
  { label: 'Announcements & Events', to: '/announcements-events' },
  { label: 'Contact Us', to: '/contact' },
]

// STEP 0 — DISCOVERY NOTES (kept in code per request)
// - Current items/routes are defined in navItems above and remain unchanged (same labels, order, and paths).
// - Dropdown structure: only "About Nyakrom" is a parent item with child links.
// - Active-link logic: route links rely on NavLink's isActive state; dropdown parent is treated as active
//   when any child route matches the current pathname prefix.
// - Previous mobile logic used a single menu button that flattened dropdown children into one list.
//   New mobile/tablet logic keeps the same information architecture using accordion sections.

const linkBaseClass =
  'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium leading-5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2'

function ChevronIcon({ className = '' }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5" />
    </svg>
  )
}

function DesktopNavLink({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `${linkBaseClass} ${isActive ? 'bg-gray-100 text-gray-900' : ''}`
      }
    >
      {item.label}
    </NavLink>
  )
}

function DesktopDropdown({ item, isOpen, onToggle, onClose, isActive }) {
  const panelId = `desktop-menu-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`${linkBaseClass} inline-flex items-center gap-1.5 ${isActive ? 'bg-gray-100 text-gray-900' : ''}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span>{item.label}</span>
        <ChevronIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen ? (
        <ul
          id={panelId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-md"
        >
          {item.children.map((child) => (
            <li key={child.to} role="none">
              <NavLink
                to={child.to}
                role="menuitem"
                onClick={onClose}
                className={({ isActive: childActive }) =>
                  `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                    childActive ? 'bg-gray-100 text-gray-900' : ''
                  }`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function MobileAccordionSection({ item, expanded, onToggle, onNavigate }) {
  const panelId = `mobile-panel-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <span>{item.label}</span>
        <ChevronIcon className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded ? (
        <ul id={panelId} className="mt-1 space-y-1 pl-3">
          {item.children.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                    isActive ? 'bg-gray-100 text-gray-900' : ''
                  }`
                }
              >
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function Navbar({ settings, loading }) {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState({})
  const [hasShadow, setHasShadow] = useState(false)
  const mobileDialogRef = useRef(null)
  const mobileOpenBtnRef = useRef(null)
  const firstMobileLinkRef = useRef(null)
  const desktopDropdownRef = useRef(null)

  const siteName = settings?.site_name || settings?.siteName || 'Nyakrom Community'
  const resolvedItems = useMemo(() => navItems, [])

  useEffect(() => {
    const onScroll = () => setHasShadow(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
    setOpenDesktopDropdown(null)
  }, [location.pathname])

  useEffect(() => {
    // Lock body scroll while the mobile/tablet drawer is open.
    document.body.style.overflow = isMobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  useEffect(() => {
    // ESC closes open surfaces (desktop dropdown or mobile/tablet drawer).
    const onEscape = (event) => {
      if (event.key !== 'Escape') return
      setOpenDesktopDropdown(null)
      setIsMobileOpen(false)
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  useEffect(() => {
    // Outside-click closes desktop dropdown.
    const onOutsideClick = (event) => {
      if (!desktopDropdownRef.current?.contains(event.target)) {
        setOpenDesktopDropdown(null)
      }
    }

    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  useEffect(() => {
    if (!isMobileOpen) {
      mobileOpenBtnRef.current?.focus()
      return
    }

    firstMobileLinkRef.current?.focus()

    // Simple focus trap keeps keyboard focus inside the mobile/tablet dialog.
    const trapFocus = (event) => {
      if (event.key !== 'Tab' || !mobileDialogRef.current) return
      const focusable = mobileDialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trapFocus)
    return () => document.removeEventListener('keydown', trapFocus)
  }, [isMobileOpen])

  const isDropdownParentActive = (item) =>
    item.children?.some((child) =>
      child.to === '/' ? location.pathname === '/' : location.pathname.startsWith(child.to),
    )

  return (
    <header
      className={`sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur ${
        hasShadow ? 'shadow-sm' : ''
      }`}
    >
      <nav aria-label="Main navigation" className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:h-16 lg:px-6">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          {siteName}
        </NavLink>

        <ul
          ref={desktopDropdownRef}
          className="ml-auto hidden items-center justify-end gap-1 lg:flex"
        >
          {resolvedItems.map((item) =>
            item.children ? (
              <DesktopDropdown
                key={item.label}
                item={item}
                isOpen={openDesktopDropdown === item.label}
                onToggle={() =>
                  setOpenDesktopDropdown((current) =>
                    current === item.label ? null : item.label,
                  )
                }
                onClose={() => setOpenDesktopDropdown(null)}
                isActive={isDropdownParentActive(item)}
              />
            ) : (
              <li key={item.to}>
                <DesktopNavLink item={item} />
              </li>
            ),
          )}
        </ul>

        <button
          ref={mobileOpenBtnRef}
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 lg:hidden"
          aria-label="Open menu"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-navigation-dialog"
        >
          <MenuIcon />
        </button>
      </nav>

      {isMobileOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100] lg:hidden" aria-hidden={!isMobileOpen}>
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu overlay"
              />

              <aside
                id="mobile-navigation-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
                ref={mobileDialogRef}
                className="absolute inset-y-0 right-0 z-[110] flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl"
              >
                <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
                  <span className="text-sm font-semibold text-gray-900">Menu</span>
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                    aria-label="Close menu"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="overflow-y-auto px-4 py-4">
                  <ul className="flex flex-col space-y-1">
                    {resolvedItems.map((item, index) => {
                      if (item.children) {
                        return (
                          <MobileAccordionSection
                            key={item.label}
                            item={item}
                            expanded={Boolean(mobileExpanded[item.label])}
                            onToggle={() =>
                              setMobileExpanded((prev) => ({
                                ...prev,
                                [item.label]: !prev[item.label],
                              }))
                            }
                            onNavigate={() => setIsMobileOpen(false)}
                          />
                        )
                      }

                      return (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            ref={index === 0 ? firstMobileLinkRef : null}
                            onClick={() => setIsMobileOpen(false)}
                            className={({ isActive }) =>
                              `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
                                isActive ? 'bg-gray-100 text-gray-900' : ''
                              }`
                            }
                          >
                            {item.label}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>

                  {loading ? (
                    <p className="mt-3 px-3 text-xs text-gray-500">Loading site settings...</p>
                  ) : null}
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </header>
  )
}

export default Navbar
