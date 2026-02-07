import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function ClientProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication first
    if (!api.isAuthenticated()) {
      navigate(`/login?redirect=/client/${projectId}`)
      return
    }

    if (projectId) {
      loadProject()
    } else {
      setError('No project ID provided')
      setLoading(false)
    }
  }, [projectId, navigate])

  const loadProject = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getProject(projectId!)
      if (response.success) {
        const projectData = response.data
        setProject(projectData)

        // If the project is already paid, send the client straight to their dashboard
        if (projectData.payment_status === 'paid') {
          navigate(`/client/${projectId}/dashboard`)
          return
        }

        // For simple projects, allow access without authentication
        // For custom projects, require authentication (safety check, though we already enforced auth above)
        if (projectData.project_type === 'custom' && !api.isAuthenticated()) {
          navigate(`/signup?projectId=${projectId}`)
          return
        }
      } else {
        setError('Project not found')
      }
    } catch (err: any) {
      console.error('Error loading project:', err)
      const message = err?.message || 'Failed to load project. Make sure the backend is running.'
      if (message.toLowerCase().includes('do not have access')) {
        try {
          const startRes = await api.startFromCatalog(projectId!)
          if (startRes.success && startRes.data) {
            const openableId = (startRes.data as any)._id || (startRes.data as any).id
            if (openableId) {
              navigate(`/client/${openableId}`, { replace: true })
              return
            }
          }
        } catch (startErr: any) {
          console.warn('Could not start from catalog:', startErr)
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading project...</p>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {projectId ? `Fetching project: ${projectId}` : 'No project ID'}
          </p>
        </div>
      </section>
    )
  }

  if (error || !project) {
    const isAccessDenied = error?.toLowerCase().includes('do not have access')
    const btnBase = {
      display: 'inline-block',
      marginTop: '0.75rem',
      padding: '0.6rem 1.2rem',
      color: '#fff',
      borderRadius: '0.5rem',
      textDecoration: 'none' as const,
      fontWeight: '500',
      fontSize: '0.9rem',
      marginRight: '0.75rem',
    }
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '420px', margin: '0 auto' }}>
          <h2>{isAccessDenied ? "Can't open this project" : 'Project Not Found'}</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            {error || 'The project link is invalid or has expired.'}
          </p>
          {projectId && (
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Project ID: {projectId}
            </p>
          )}
          {!isAccessDenied && (
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem' }}>
              Make sure the backend server is running.
            </p>
          )}
          {isAccessDenied && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: '0.75rem',
              textAlign: 'left',
            }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#0f172a', fontWeight: '500' }}>
                You can still submit requirements and buy a project or service:
              </p>
              <ul style={{ margin: '0 0 1rem', paddingLeft: '1.25rem', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <li>Choose another project from the list and complete briefing & payment</li>
                <li>Request a custom offer and we’ll create a project for you</li>
              </ul>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                <Link to="/client/all" style={{ ...btnBase, background: '#f97316' }}>
                  View all projects →
                </Link>
                <Link to="/client/all" style={{ ...btnBase, background: '#1d4ed8' }} state={{ openRequestModal: true }}>
                  Request custom offer
                </Link>
              </div>
            </div>
          )}
          {!isAccessDenied && (
            <Link to="/client/all" style={{ ...btnBase, background: '#f97316', marginRight: 0 }}>
              ← Back to all projects
            </Link>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Welcome</div>
        <h1 className="page-title">{project.name}</h1>
        <p className="page-subtitle">
          Submit your requirements (briefing) and pay to get started. Choose your service, then we’ll guide you through the rest.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel">
          <div className="badge-row">
            <span className="badge" style={{ background: 'rgba(29, 78, 216, 0.1)', borderColor: 'rgba(29, 78, 216, 0.3)' }}>
              Project #{project._id ? project._id.toString().slice(0, 8) : project.id?.slice(0, 8) || 'N/A'}
            </span>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: '#0f172a' }}>
              Project Overview
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '1.2rem' }}>
              We're excited to work with you. You’ll select your service, submit your requirements (briefing), and then pay to begin.
            </p>

            {/* Show client's original description for custom projects */}
            {project?.project_type === 'custom' && project?.custom_quote_request && typeof project.custom_quote_request === 'object' && project.custom_quote_request.description && (
              <div style={{
                marginBottom: '1.2rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.6rem'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem', 
                  fontSize: '0.9rem', 
                  color: '#1e40af',
                  fontWeight: '600'
                }}>
                  Your Request:
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: '#4b5563', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {project.custom_quote_request.description}
                </p>
              </div>
            )}

            {/* Show admin's description if available */}
            {project?.custom_quote_description && (
              <div style={{
                marginBottom: '1.2rem',
                padding: '1rem',
                background: 'rgba(29, 78, 216, 0.05)',
                border: '1px solid rgba(29, 78, 216, 0.2)',
                borderRadius: '0.6rem'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem', 
                  fontSize: '0.9rem', 
                  color: '#1d4ed8',
                  fontWeight: '600'
                }}>
                  Quote Details:
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: '#4b5563', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {project.custom_quote_description}
                </p>
              </div>
            )}

            <div style={{ 
              background: 'rgba(30, 64, 175, 0.2)', 
              padding: '1rem', 
              borderRadius: '0.6rem',
              border: '1px solid rgba(30, 64, 175, 0.4)',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1d4ed8' }}>
                <strong>Next Step:</strong> Select your service, then submit your requirements and pay
              </p>
            </div>

            {!api.isAuthenticated() ? (
              <div>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '0.6rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626' }}>
                    <strong>⚠️ Login Required:</strong> You must be logged in to purchase this project.
                  </p>
                </div>
                <Link 
                  to={`/login?redirect=/client/${projectId}`}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.8rem',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    boxShadow: '0 8px 20px rgba(29, 78, 216, 0.4)'
                  }}
                >
                  Login to Continue →
                </Link>
              </div>
            ) : (
              <Link 
                to={`/client/${projectId}/service`}
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.8rem',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  boxShadow: '0 8px 20px rgba(29, 78, 216, 0.4)'
                }}
              >
                Continue to Service Selection →
              </Link>
            )}
          </div>
        </div>

        <aside className="page-sidebar">
          <strong style={{ display: 'block', marginBottom: '0.6rem', color: '#0f172a' }}>Project Timeline</strong>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#0f172a' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#1d4ed8' }}>●</span> <span style={{ color: '#0f172a' }}>Service Selection</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Submit requirements (briefing)</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Payment</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Project In Progress</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Delivery</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
