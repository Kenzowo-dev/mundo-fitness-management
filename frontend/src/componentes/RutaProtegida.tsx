import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'

interface ProtectedRouteProps {
  roles?: ('admin' | 'lite')[]
}

function ProtectedRoute({
  roles,
}: ProtectedRouteProps) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (
    roles &&
    !roles.includes(currentUser.role)
  ) {
    if (currentUser.role === 'lite') {
      return <Navigate to="/usuario" replace />
    }

    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute