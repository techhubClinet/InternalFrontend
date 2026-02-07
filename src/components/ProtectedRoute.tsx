import { Navigate } from 'react-router-dom'
import { getUserRole } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: ('client' | 'admin' | 'collaborator')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const userRole = getUserRole()

  if (!userRole) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(userRole)) {
    // User doesn't have required role, redirect to appropriate page
    if (userRole === 'client') {
      return <Navigate to="/client/access" replace />
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/projects" replace />
    } else if (userRole === 'collaborator') {
      return <Navigate to="/collaborator/projects" replace />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
















