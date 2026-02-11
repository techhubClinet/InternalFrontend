import { Navigate } from 'react-router-dom'
import { getUserRole, canAccessCollaborator } from '../utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: ('client' | 'admin' | 'collaborator')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const userRole = getUserRole()
  const canCollaborator = canAccessCollaborator()

  if (!userRole) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />
  }

  // Allow access if user has the role OR (for collaborator) if they have a collaborator profile (e.g. client who is also collaborator)
  const hasAccess =
    allowedRoles.includes(userRole) ||
    (allowedRoles.includes('collaborator') && canCollaborator)

  if (!hasAccess) {
    if (userRole === 'client') {
      return <Navigate to="/client/access" replace />
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/projects" replace />
    } else if (userRole === 'collaborator' || canCollaborator) {
      return <Navigate to="/collaborator/projects" replace />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
















