// import { NavLink, Outlet, useNavigate } from 'react-router-dom'
// import { clearAuthToken } from '../lib/auth.js'

// function AdminLayout() {
//   const navigate = useNavigate()

//   const handleLogout = () => {
//     // Clear token and return to login.
//     clearAuthToken()
//     navigate('/login', { replace: true })
//   }

//   return (
//     <div>
//       <header>
//         <h1>Admin</h1>
//         <nav>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/dashboard"
//             end
//           >
//             Dashboard
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/news"
//             end
//           >
//             News
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/obituaries"
//             end
//           >
//             Obituaries
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/clans"
//             end
//           >
//             Clans
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/asafo-companies"
//             end
//           >
//             Asafo Companies
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/hall-of-fame"
//             end
//           >
//             Hall of Fame
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/global-settings"
//             end
//           >
//             Global Settings
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/homepage-sections"
//             end
//           >
//             Homepage Sections
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/landmarks"
//             end
//           >
//             Landmarks
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/carousel"
//             end
//           >
//             Carousel
//           </NavLink>
//           <NavLink
//             className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
//             to="/admin/history"
//             end
//           >
//             History
//           </NavLink>
//           <button type="button" onClick={handleLogout}>
//             Logout
//           </button>
//         </nav>
//       </header>

//       <main>
//         <Outlet />
//       </main>
//     </div>
//   )
// }

// export default AdminLayout


import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/index.jsx'
import { clearAuthToken } from '../lib/auth.js'

function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear token and return to login.
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Admin shell: fixed sidebar, topbar, and scrollable content */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface">
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-border">
            <h1 className="text-base font-semibold">Admin</h1>
          </div>
          {/* Sidebar scrolls independently when menu is long */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/dashboard"
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/news"
              end
            >
              News
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/obituaries"
              end
            >
              Obituaries
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/clans"
              end
            >
              Clans
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/asafo-companies"
              end
            >
              Asafo Companies
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/hall-of-fame"
              end
            >
              Hall of Fame
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/global-settings"
              end
            >
              Global Settings
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/homepage-sections"
              end
            >
              Homepage Settings
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/landmarks"
              end
            >
              Landmarks
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/carousel"
              end
            >
              Carousel
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                ].join(' ')
              }
              to="/admin/history"
              end
            >
              History
            </NavLink>
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
        {/* Only content area scrolls */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
