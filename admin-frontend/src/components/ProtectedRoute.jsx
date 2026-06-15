import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthToken } from '../lib/auth.js'
import { ADMIN_LOGIN_PATH } from '../lib/adminPaths.js'

function ProtectedRoute() {
  const location = useLocation()
  const token = getAuthToken()

  if (!token) {
    // Preserve the attempted URL so login can return the user later.
    return <Navigate to={ADMIN_LOGIN_PATH} state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
