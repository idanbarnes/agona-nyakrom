import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

const navItems = [
  { label: 'Home', to: '/' },
  {
    label: 'About Nyakrom',
    children: [
      { label: 'History', to: '/about-nyakrom/history' },
      { label: 'Who We Are', to: '/about-nyakrom/who-we-are' },
      { label: 'About Agona Nyakrom Town', to: '/about-nyakrom/about-agona-nyakrom-town' },
      { label: 'Leadership & Governance', to: '/about-nyakrom/leadership-governance' },
    ],
  },
  { label: 'Clans', to: '/clans' },
  { label: 'Asafo Companies', to: '/asafo-companies' },
  { label: 'Hall of Fame', to: '/hall-of-fame' },
  { label: 'Landmarks', to: '/landmarks' },
  { label: 'Obituaries', to: '/obituaries' },
  { label: 'News', to: '/news' },
  { label: 'Announcements & Events', to: '/announcements-events' },
  { label: 'Contact Us', to: '/contact' },
]

function Navbar({ settings, loading }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const firstLinkRef = useRef(null)
  const siteName = settings?.site_name || settings?.siteName || 'Nyakrom Community'
  const resolvedItems = useMemo(() => navItems, [])

  useEffect(() => setIsOpen(false), [location.pathname])

  return (
    <header className="z-50 border-b border-border bg-background/80 backdrop-blur" style={{ position: 'sticky', top: 0 }}>
      <nav aria-label="Main"><div className="container flex h-16 items-center justify-between"><NavLink to="/" className="text-sm font-semibold text-foreground">{siteName}</NavLink>
      <ul className="hidden items-center gap-4 md:flex">{resolvedItems.map((item)=> item.children ? <li key={item.label} className="group relative"><span className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground">{item.label}</span><ul className="invisible absolute left-0 top-full z-50 mt-2 w-64 rounded border bg-background p-2 opacity-0 shadow group-hover:visible group-hover:opacity-100">{item.children.map((child)=><li key={child.to}><NavLink to={child.to} className="block rounded px-2 py-1 text-sm hover:bg-muted">{child.label}</NavLink></li>)}</ul></li> : <li key={item.to}><NavLink to={item.to} className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition hover:text-foreground">{item.label}</NavLink></li>)}</ul>
      <button type="button" onClick={() => setIsOpen(true)} className="h-11 rounded-md border border-border px-4 text-sm md:hidden">Menu</button>
      </div></nav>
      {isOpen && <div className="fixed inset-0 z-40 md:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} /><aside className="absolute inset-x-0 top-16 border-b border-border bg-background/95"><div className="container py-4"><ul className="flex flex-col gap-2">{resolvedItems.flatMap((item)=> item.children || [item]).map((item,index)=><li key={item.to || item.label}><NavLink to={item.to} ref={index===0 ? firstLinkRef : null} className="block rounded px-2 py-2">{item.label}</NavLink></li>)}</ul>{loading ? <p>Loading site settings...</p> : null}</div></aside></div>}
    </header>
  )
}

export default Navbar
