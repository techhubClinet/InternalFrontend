import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if this login is coming from a client context
  const redirect = searchParams.get('redirect')
  const projectId = searchParams.get('projectId')
  const isClientContext =
    (redirect && redirect.startsWith('/client')) ||
    (!!projectId)

  // Check if user is already authenticated and redirect if so
  useEffect(() => {
    // Only redirect if user is already authenticated and there's no specific redirect/projectId
    if (api.isAuthenticated()) {
      // If already authenticated and no specific redirect, go to client dashboard
      if (!redirect && !projectId) {
        navigate('/client/all')
      }
    }
    // If not authenticated, allow user to stay on login page
  }, [searchParams, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setLoading(true)
      const response: any = await api.login({
        email: formData.email,
        password: formData.password,
      })

      if (response.success) {
        const redirect = searchParams.get('redirect')
        if (redirect) {
          navigate(redirect)
        } else {
          const projectId = searchParams.get('projectId')
          if (projectId) {
            navigate(`/client/${projectId}`)
          } else {
            // Redirect to all projects page instead of access page
            navigate('/client/all')
          }
        }
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      padding: '2rem'
    }}>

      <div style={{
        width: '100%',
        maxWidth: '440px'
      }}>
        {/* Form Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '0.5rem',
              letterSpacing: '0.02em'
            }}>
              WELCOME BACK
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 0.5rem 0',
              lineHeight: '1.2'
            }}>
              Sign In
            </h1>
            <p style={{
              fontSize: '0.95rem',
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Sign in to access your project and track progress.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              color: '#dc2626',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: '600'
              }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ea580c'
                  e.target.style.background = '#ffffff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(248, 115, 22, 0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.background = '#f9fafb'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                color: '#374151',
                fontWeight: '600'
              }}>
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ea580c'
                  e.target.style.background = '#ffffff'
                  e.target.style.boxShadow = '0 0 0 3px rgba(248, 115, 22, 0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb'
                  e.target.style.background = '#f9fafb'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading 
                  ? 'linear-gradient(135deg, #9ca3af, #6b7280)' 
                  : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading 
                  ? 'none' 
                  : '0 4px 14px rgba(234, 88, 12, 0.4)',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(234, 88, 12, 0.4)'
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {isClientContext && (
            <div style={{
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#6b7280',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              Don't have an account?{' '}
              <Link
                to={`/signup${projectId ? `?projectId=${projectId}` : ''}`}
                style={{
                  color: '#ea580c',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c2410c')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#ea580c')}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
