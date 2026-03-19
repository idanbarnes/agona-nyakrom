import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import {
  backdropFadeInOut,
  dropdownInOut,
  mobileMenuPanelInOut,
} from '../motion/variants.js'
import { preloadPublicRoute } from '../routes/routeLoaders.js'
import {
  ABOUT_SECTION_LABEL,
  DEFAULT_SITE_NAME,
  PUBLIC_NAV_ITEMS,
  PUBLIC_UI_LABELS,
} from '../constants/publicChrome.js'

// STEP 0 — DISCOVERY NOTES (kept in code per request)
// - Current items/routes are defined in navItems above and remain unchanged (same labels, order, and paths).
// - Dropdown structure: only "About Nyakrom" is a parent item with child links.
// - Active-link logic: route links rely on NavLink's isActive state; dropdown parent is treated as active
//   when any child route matches the current pathname prefix.
// - Previous mobile logic used a single menu button that flattened dropdown children into one list.
//   New mobile/tablet logic keeps the same information architecture using accordion sections.

const linkBaseClass =
  'relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium leading-5 text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] after:pointer-events-none after:absolute after:right-3 after:bottom-[5px] after:left-3 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-amber-400 after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100'

const activeDesktopLinkClass = 'bg-white/15 text-white ring-1 ring-white/20 after:scale-x-100'
const activeMobileLinkClass = 'bg-white/15 text-white ring-1 ring-white/20'

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
      onMouseEnter={() => preloadPublicRoute(item.to)}
      onFocus={() => preloadPublicRoute(item.to)}
      onTouchStart={() => preloadPublicRoute(item.to)}
      className={({ isActive }) =>
        `${linkBaseClass} ${isActive ? activeDesktopLinkClass : ''}`
      }
    >
      {item.label}
    </NavLink>
  )
}

function DesktopDropdown({ item, isOpen, onToggle, onClose, isActive, variants }) {
  const panelId = `desktop-menu-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`${linkBaseClass} inline-flex items-center gap-1.5 ${
          isActive ? activeDesktopLinkClass : ''
        }`}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span>{item.label}</span>
        <ChevronIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <Motion.ul
            id={panelId}
            role="menu"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={variants}
            className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#111827] p-2 shadow-lg shadow-black/20"
          >
            <li className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-white/50 uppercase">
              {ABOUT_SECTION_LABEL}
            </li>
            {item.children.map((child) => (
              <li key={child.to} role="none">
                <NavLink
                  to={child.to}
                  role="menuitem"
                  onClick={onClose}
                  onMouseEnter={() => preloadPublicRoute(child.to)}
                  onFocus={() => preloadPublicRoute(child.to)}
                  onTouchStart={() => preloadPublicRoute(child.to)}
                  className={({ isActive: childActive }) =>
                    `flex items-center rounded-lg px-3.5 py-2.5 text-sm font-medium text-white/85 transition-all duration-200 hover:translate-x-[2px] hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] ${
                      childActive ? 'bg-white/10 text-white' : ''
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </Motion.ul>
        ) : null}
      </AnimatePresence>
    </li>
  )
}

function MobileAccordionSection({ item, expanded, onToggle, onNavigate, isActive }) {
  const panelId = `mobile-panel-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-100 transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] ${
          isActive ? activeMobileLinkClass : ''
        }`}
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
                onMouseEnter={() => preloadPublicRoute(child.to)}
                onFocus={() => preloadPublicRoute(child.to)}
                onTouchStart={() => preloadPublicRoute(child.to)}
                className={({ isActive }) =>
                  `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-200 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] ${
                    isActive ? activeMobileLinkClass : ''
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
  const reduceMotion = useReducedMotion()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState({})
  const [hasShadow, setHasShadow] = useState(false)
  const mobileDialogRef = useRef(null)
  const mobileOpenBtnRef = useRef(null)
  const firstMobileLinkRef = useRef(null)
  const desktopDropdownRef = useRef(null)

  const siteName = settings?.site_name || settings?.siteName || DEFAULT_SITE_NAME
  const resolvedItems = useMemo(() => PUBLIC_NAV_ITEMS, [])
  const dropdownVariants = useMemo(
    () => dropdownInOut(Boolean(reduceMotion)),
    [reduceMotion],
  )
  const mobileMenuPanelVariants = useMemo(
    () => mobileMenuPanelInOut(Boolean(reduceMotion)),
    [reduceMotion],
  )
  const mobileBackdropVariants = useMemo(
    () => backdropFadeInOut(Boolean(reduceMotion)),
    [reduceMotion],
  )

  useEffect(() => {
    const onScroll = () => setHasShadow(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setIsMobileOpen(false)
      setOpenDesktopDropdown(null)
    })

    return () => window.cancelAnimationFrame(rafId)
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
      className={`sticky top-0 z-50 overflow-visible rounded-tl-[8px] border-b border-[#1F2937] bg-[#111827]/95 backdrop-blur md:rounded-tl-[10px] lg:rounded-tl-none ${
        hasShadow ? 'shadow-[0_8px_20px_rgba(0,0,0,0.35)]' : ''
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 lg:h-20 lg:px-6"
      >
        <NavLink
          to="/"
          onMouseEnter={() => preloadPublicRoute('/')}
          onFocus={() => preloadPublicRoute('/')}
          onTouchStart={() => preloadPublicRoute('/')}
          className="inline-flex min-w-0 max-w-[calc(100%-4.5rem)] items-center gap-2 pr-12 text-sm font-semibold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] lg:max-w-none lg:pr-0"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-lg font-bold text-white shadow-[0_6px_14px_rgba(217,119,6,0.35)]"
          >
            N
          </span>
          <span className="truncate">{siteName}</span>
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
                variants={dropdownVariants}
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
          onClick={() => setIsMobileOpen((prev) => !prev)}
          // Keep toggle anchored to the right edge so viewport changes cannot push it off-canvas.
          className="absolute top-1/2 right-4 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg border border-[#374151] text-gray-100 transition-[background-color,transform] duration-200 ease-out hover:bg-white/10 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] lg:hidden"
          aria-label={isMobileOpen ? PUBLIC_UI_LABELS.closeMenu : PUBLIC_UI_LABELS.openMenu}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-navigation-dialog"
        >
          {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {createPortal(
        <AnimatePresence>
          {isMobileOpen ? (
            <Motion.div
              className="fixed inset-x-0 top-20 bottom-0 z-[100] lg:hidden"
              aria-hidden={!isMobileOpen}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <Motion.button
                type="button"
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsMobileOpen(false)}
                aria-label={PUBLIC_UI_LABELS.closeMenuOverlay}
                variants={mobileBackdropVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              />

              <Motion.aside
                id="mobile-navigation-dialog"
                role="dialog"
                aria-modal="true"
                aria-label={PUBLIC_UI_LABELS.mobileNavigationMenu}
                ref={mobileDialogRef}
                variants={mobileMenuPanelVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-y-0 right-0 z-[110] flex h-full w-full max-w-sm flex-col border-l border-[#1F2937] bg-[#111827]/95 backdrop-blur-sm shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              >
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
                            isActive={isDropdownParentActive(item)}
                          />
                        )
                      }

                      return (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            ref={index === 0 ? firstMobileLinkRef : null}
                            onClick={() => setIsMobileOpen(false)}
                            onMouseEnter={() => preloadPublicRoute(item.to)}
                            onFocus={() => preloadPublicRoute(item.to)}
                            onTouchStart={() => preloadPublicRoute(item.to)}
                            className={({ isActive }) =>
                              `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-gray-100 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] ${
                                isActive ? activeMobileLinkClass : ''
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
                    <p className="mt-3 px-3 text-xs text-gray-400">{PUBLIC_UI_LABELS.loadingSiteSettings}</p>
                  ) : null}
                </div>
              </Motion.aside>
            </Motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </header>
  )
}

export default Navbar
