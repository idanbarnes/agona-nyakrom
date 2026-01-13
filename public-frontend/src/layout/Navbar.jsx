import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

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
  const siteName =
    settings?.site_name || settings?.siteName || 'Nyakrom Community'
  const resolvedItems = useMemo(() => navItems, [])

  // Close the mobile menu after navigation.
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  return (
    <header style={{ position: 'sticky', top: 0 }}>
      <nav aria-label="Main">
        <div>
          {/* Placeholder for future logo support. */}
          <span aria-hidden="true">□</span>
          <NavLink to="/">{siteName}</NavLink>
        </div>
        <ul>
          {resolvedItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to}>{item.label}</NavLink>
            </li>
          ))}
        </ul>
        {/* Hamburger menu for small screens (visibility handled later with styling). */}
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setIsOpen(true)}
        >
          Menu
        </button>
      </nav>
      {isOpen && (
        <aside aria-label="Mobile menu">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
          <ul>
            {resolvedItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
          {loading && <p>Loading site settings...</p>}
        </aside>
      )}
    </header>
  )
}

export default Navbar
