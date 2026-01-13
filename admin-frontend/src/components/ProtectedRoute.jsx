import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAuthToken } from '../lib/auth.js'

function ProtectedRoute() {
  const location = useLocation()
  const token = getAuthToken()

  if (!token) {
    // Preserve the attempted URL so login can return the user later.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
