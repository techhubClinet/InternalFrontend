import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'

export function ClientAccessPage() {
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    if (api.isAuthenticated()) {
      try {
        await api.getCurrentUser()
        setIsAuthenticated(true)
      } catch {
        api.logout()
        setIsAuthenticated(false)
      }
    }
    setChecking(false)
  }

  const handleAccess = () => {
    if (projectId.trim()) {
      if (!isAuthenticated) {
        // Redirect to signup with projectId
        navigate(`/signup?projectId=${projectId.trim()}`)
      } else {
        navigate(`/client/${projectId.trim()}`)
      }
    }
  }

  if (checking) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading...</p>
        </div>
      </section>
    )
  }

  // Example base URL for the help text (matches current frontend origin in production)
  const exampleBaseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://internal-frontend-two.vercel.app'

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Client Access</div>
        <h1 className="page-title">Access Your Project</h1>
        <p className="page-subtitle">
          Enter your project ID to access your project, upload images, submit briefings, and make payments.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(30, 64, 175, 0.1)',
            padding: '1.5rem',
            borderRadius: '0.8rem',
            border: '1px solid rgba(30, 64, 175, 0.3)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
              📧 How to Get Your Project Link
            </h3>
            <ol style={{ 
              margin: 0, 
              paddingLeft: '1.5rem', 
              fontSize: '0.9rem', 
              color: '#4b5563',
              lineHeight: '1.8'
            }}>
              <li>Admin creates a project for you</li>
              <li>Admin shares the project link with you (via email or message)</li>
              <li>The link looks like: <code style={{ 
                background: 'rgba(0,0,0,0.1)', 
                padding: '0.2rem 0.4rem', 
                borderRadius: '0.3rem',
                fontSize: '0.85rem'
              }}>{`${exampleBaseUrl}/client/YOUR_PROJECT_ID`}</code></li>
              <li>Copy the project ID from the link and paste it below</li>
            </ol>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.9rem', 
              color: '#0f172a',
              fontWeight: '500'
            }}>
              Enter Your Project ID
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAccess()}
              placeholder="e.g., 6962131d207a067543e61f94"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'white',
                border: '1px solid rgba(30, 64, 175, 0.3)',
                borderRadius: '0.6rem',
                color: '#0f172a',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ 
              margin: '0.5rem 0 0', 
              fontSize: '0.8rem', 
              color: '#6b7280' 
            }}>
              This is the unique ID from your project link
            </p>
          </div>

          {!isAuthenticated && (
            <div style={{
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.6rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#1e40af' }}>
                You need to create an account to access your project
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Link
                  to="/signup"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: '#1d4ed8',
                    border: '1px solid #1d4ed8',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          <button
            onClick={handleAccess}
            disabled={!projectId.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: projectId.trim() ? '#1d4ed8' : 'rgba(29, 78, 216, 0.3)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.6rem',
              fontWeight: '500',
              fontSize: '0.9rem',
              cursor: projectId.trim() ? 'pointer' : 'not-allowed',
              marginBottom: '1.5rem'
            }}
          >
            {isAuthenticated ? 'Access My Project →' : 'Continue to Sign Up →'}
          </button>

          <div style={{
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '0.6rem',
            border: '1px solid rgba(30, 64, 175, 0.2)'
          }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: '#0f172a' }}>
              What You Can Do After Accessing:
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.2rem', 
              fontSize: '0.85rem', 
              color: '#4b5563',
              lineHeight: '1.8'
            }}>
              <li>✅ Select your service or confirm custom quote</li>
              <li>✅ Upload reference images with notes</li>
              <li>✅ Write your project briefing/description</li>
              <li>✅ Make secure payment via Stripe</li>
              <li>✅ Track project progress in your dashboard</li>
            </ul>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(250, 204, 21, 0.1)',
            border: '1px solid rgba(250, 204, 21, 0.3)',
            borderRadius: '0.6rem'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              color: '#92400e',
              lineHeight: '1.6'
            }}>
              <strong>Don't have a project ID?</strong> Contact your admin to create a project and share the link with you.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}



