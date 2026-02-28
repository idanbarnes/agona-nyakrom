import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/index.jsx'
import { useAdminSession } from '../context/AdminSessionContext.jsx'
import { cn } from '../lib/cn.js'
import {
  AwardIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  HeartIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  MegaphoneIcon,
  MenuIcon,
  NewsIcon,
  PhoneIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from '../components/admin/icons.jsx'

const navLinkClass = ({ isActive }) =>
  [
    'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isActive
      ? 'bg-blue-50 text-blue-600'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

const childNavLinkClass = ({ isActive }) =>
  [
    'flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isActive
      ? 'bg-blue-50 text-blue-600'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: HomeIcon },
  { label: 'News', to: '/admin/news', icon: NewsIcon },
  { label: 'Events', to: '/admin/events', icon: CalendarIcon },
  { label: 'Announcements', to: '/admin/announcements', icon: MegaphoneIcon },
  { label: 'Obituaries', to: '/admin/obituaries', icon: HeartIcon },
  { label: 'Clans', to: '/admin/clans', icon: UsersIcon },
  { label: 'Asafo Companies', to: '/admin/asafo-companies', icon: ShieldIcon },
  { label: 'Hall of Fame', to: '/admin/hall-of-fame', icon: AwardIcon },
  { label: 'Carousel', to: '/admin/carousel', icon: ImageIcon },
  { label: 'Homepage Settings', to: '/admin/homepage-sections', icon: HomeIcon },
  { label: 'Contact Information', to: '/admin/contact', icon: PhoneIcon },
  { label: 'Contact FAQs', to: '/admin/faqs', icon: HelpCircleIcon },
  { label: 'Global Settings', to: '/admin/global-settings', icon: SettingsIcon },
]

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
  { label: 'Landmarks', to: '/admin/landmarks' },
]

function isAboutNyakromPath(pathname) {
  return pathname.startsWith('/admin/about-nyakrom/') || pathname.startsWith('/admin/landmarks')
}

function AdminLayout() {
  const location = useLocation()
  const { hardLogout } = useAdminSession()
  const [isAboutNyakromOpen, setIsAboutNyakromOpen] = useState(() =>
    isAboutNyakromPath(location.pathname),
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isAboutNyakromPath(location.pathname)) {
      setIsAboutNyakromOpen(true)
    }
  }, [location.pathname])

  const handleLogout = () => {
    hardLogout('manual_logout', {
      broadcast: true,
      redirect: true,
      preserveRoute: false,
    })
  }

  const currentPageTitle = useMemo(() => {
    const directMatch = navItems.find((item) => item.to === location.pathname)
    if (directMatch) {
      return directMatch.label
    }

    const nestedMatch = navItems.find(
      (item) => item.to !== '/dashboard' && location.pathname.startsWith(`${item.to}/`),
    )
    if (nestedMatch) {
      return nestedMatch.label
    }

    const aboutMatch = aboutNyakromLinks.find((item) => item.to === location.pathname)
    if (aboutMatch) {
      return aboutMatch.label
    }

    return 'Admin Dashboard'
  }, [location.pathname])

  const isAboutNyakromActive = isAboutNyakromPath(location.pathname)

  const sidebar = (onNavigate) => (
    <div className="flex h-full flex-col bg-white">
      <div className="flex min-h-20 items-center justify-between border-b border-slate-200 px-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Agona Nyakrom</h1>
          <p className="text-sm text-slate-500">CMS Dashboard</p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Close navigation menu"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
        {navItems.slice(0, 8).map((item) => (
          <NavLink
            key={item.to}
            className={navLinkClass}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onNavigate}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsAboutNyakromOpen((current) => !current)}
            aria-expanded={isAboutNyakromOpen}
            className={cn(
              'flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium transition-colors',
              isAboutNyakromActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <span className="flex items-center gap-3">
              <BookOpenIcon className="h-4 w-4" />
              <span>About Nyakrom</span>
            </span>
            {isAboutNyakromOpen ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>

          <div
            className={`space-y-1 overflow-hidden pl-8 transition-all ${
              isAboutNyakromOpen ? 'max-h-[20rem] pt-1' : 'max-h-0'
            }`}
          >
            {aboutNyakromLinks.map((item) => (
              <NavLink
                key={item.to}
                className={childNavLinkClass}
                to={item.to}
                end={item.to !== '/admin/landmarks'}
                onClick={onNavigate}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-2 border-t border-slate-200 pt-3">
          {navItems.slice(8).map((item) => (
            <NavLink
              key={item.to}
              className={navLinkClass}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={onNavigate}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            AN
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">Admin User</p>
            <p className="truncate text-xs text-slate-500">admin@nyakrom.gov.gh</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 text-foreground">
      <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-200 lg:block">
        {sidebar(() => {})}
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
            {sidebar(() => setIsMobileMenuOpen(false))}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuIcon className="h-5 w-5 text-slate-700" />
            </button>
            <h2 className="text-base font-semibold text-slate-900">{currentPageTitle}</h2>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
