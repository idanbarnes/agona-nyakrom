import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../components/ui/index.jsx'
import { clearAuthToken } from '../lib/auth.js'
import { adminUi } from '../components/admin/ui/styles.js'

const navLinkClass = ({ isActive }) =>
  [
    'flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isActive
      ? 'bg-slate-100 text-slate-900'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  ].join(' ')

const aboutNyakromLinks = [
  { label: 'History', to: '/admin/about-nyakrom/history' },
  { label: 'Who We Are', to: '/admin/about-nyakrom/who-we-are' },
  {
    label: 'About Agona Nyakrom Town',
    to: '/admin/about-nyakrom/about-agona-nyakrom-town',
  },
  {
    label: 'Leadership & Governance',
    to: '/admin/about-nyakrom/leadership-governance',
  },
]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isAboutNyakromOpen, setIsAboutNyakromOpen] = useState(() =>
    location.pathname.startsWith('/admin/about-nyakrom/'),
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


  const handleLogout = () => {
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <h1 className="text-base font-semibold text-slate-900">Agona CMS</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink className={navLinkClass} to="/dashboard" end>
          Dashboard
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/news" end>
          News
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/events" end>
          Events
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/announcements" end>
          Announcements
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/obituaries" end>
          Obituaries
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/clans" end>
          Clans
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/asafo-companies" end>
          Asafo Companies
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/hall-of-fame" end>
          Hall of Fame
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/global-settings" end>
          Global Settings
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/homepage-sections" end>
          Homepage Settings
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/landmarks" end>
          Landmarks
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/carousel" end>
          Carousel
        </NavLink>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsAboutNyakromOpen((current) => !current)}
            aria-expanded={isAboutNyakromOpen}
            className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>About Nyakrom</span>
            <span className="text-base leading-none" aria-hidden="true">
              {isAboutNyakromOpen ? '▾' : '▸'}
            </span>
          </button>

          <div
            className={`space-y-1 overflow-hidden pl-3 transition-all ${
              isAboutNyakromOpen ? 'max-h-80 pt-1' : 'max-h-0'
            }`}
          >
            {aboutNyakromLinks.map((item) => (
              <NavLink key={item.to} className={navLinkClass} to={item.to} end>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )

  return (
    <div className={`flex min-h-screen ${adminUi.page} text-foreground`}>
      <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 lg:block">
        {sidebar}
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative z-10 h-full w-72 border-r border-slate-200 shadow-xl">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </Button>
            <h2 className="text-sm font-semibold text-slate-700">Admin Dashboard</h2>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <main className="flex-1 py-6">
          <div className={adminUi.container}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
