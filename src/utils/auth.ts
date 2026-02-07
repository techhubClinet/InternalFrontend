// Utility functions for authentication and role management

export interface User {
  id: string
  name: string
  email: string
  role: 'client' | 'admin' | 'collaborator'
}

// Decode JWT token to get user info
export const decodeToken = (token: string): { userId: string; email: string; role: string } | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

// Get current user from token
export const getCurrentUser = (): User | null => {
  const token = localStorage.getItem('auth_token')
  if (!token) return null

  const decoded = decodeToken(token)
  if (!decoded) return null

  // Try to get user data from localStorage first
  const storedUser = localStorage.getItem('user_data')
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser)
      return user
    } catch {
      // If parsing fails, fall back to token
    }
  }

  // Fallback to token data
  return {
    id: decoded.userId,
    email: decoded.email,
    name: decoded.email, // Name not in token, use email as fallback
    role: decoded.role as 'client' | 'admin' | 'collaborator',
  }
}

// Get current user role
export const getUserRole = (): 'client' | 'admin' | 'collaborator' | null => {
  const user = getCurrentUser()
  return user?.role || null
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token')
}

// Check if user has specific role
export const hasRole = (role: 'client' | 'admin' | 'collaborator'): boolean => {
  const userRole = getUserRole()
  return userRole === role
}

// Store user data
export const storeUserData = (user: User) => {
  localStorage.setItem('user_data', JSON.stringify(user))
}

// Clear user data
export const clearUserData = () => {
  localStorage.removeItem('user_data')
  localStorage.removeItem('auth_token')
}
















