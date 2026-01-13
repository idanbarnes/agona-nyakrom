import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../lib/auth.js'

function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear token and return to login.
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <header>
        <h1>Admin</h1>
        <nav>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/dashboard"
            end
          >
            Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/news"
            end
          >
            News
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/obituaries"
            end
          >
            Obituaries
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/clans"
            end
          >
            Clans
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/asafo-companies"
            end
          >
            Asafo Companies
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/hall-of-fame"
            end
          >
            Hall of Fame
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/global-settings"
            end
          >
            Global Settings
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/homepage-sections"
            end
          >
            Homepage Sections
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/landmarks"
            end
          >
            Landmarks
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/carousel"
            end
          >
            Carousel
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            to="/admin/history"
            end
          >
            History
          </NavLink>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
