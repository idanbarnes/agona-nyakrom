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
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '../components/ui/index.jsx'
import { clearAuthToken } from '../lib/auth.js'

function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear token and return to login.
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden flex bg-background text-foreground">
      {/* Admin shell: fixed sidebar, topbar, and scrollable content */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface">
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-border">
            <h1 className="text-base font-semibold">Admin</h1>
          </div>
          {/* Sidebar scrolls independently when menu is long */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <NavLink
              className={({ isActive }) =>
                [
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
                ].join(' ')
              }
              to="/admin/homepage-sections"
              end
            >
              Homepage Sections
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                [
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-accent',
                  isActive ? 'bg-accent text-foreground' : '',
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
        <header className="h-16 flex items-center justify-end px-4 border-b border-border bg-background/80 backdrop-blur">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            Logout
          </button>
        </header>
        {/* Only content area scrolls */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* UI kit demo (remove later) */}
          <div className="mb-6 max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  Demo Card
                  <StatusBadge status="published" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Button + card preview.
                </p>
                <Button size="sm" variant="secondary">
                  View
                </Button>
              </CardContent>
            </Card>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
