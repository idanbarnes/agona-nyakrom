import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../components/ui/index.jsx'
import { clearAuthToken } from '../lib/auth.js'

const navLinkClass = ({ isActive }) =>
  [
    'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent text-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
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

  const handleLogout = () => {
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="w-64 shrink-0 border-r border-border bg-surface">
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-border">
            <h1 className="text-base font-semibold">Admin</h1>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                className="flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <span>About Nyakrom</span>
                <span className="text-base leading-none">
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
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur">
          <h2 className="text-sm font-semibold text-foreground">Dashboard</h2>
          <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
