import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Modal } from '../components/Modal'

export function ClientDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [briefing, setBriefing] = useState<any>(null)
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingRevision, setClaimingRevision] = useState(false)
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false)
  const [revisionDescription, setRevisionDescription] = useState('')

  useEffect(() => {
    if (projectId) {
      loadProjectData(false)
    }
  }, [projectId])

  // Auto-refresh when status or payment changes (e.g. admin updates or collaborator paid)
  useEffect(() => {
    if (!projectId) return
    const interval = setInterval(() => loadProjectData(true), 30000)
    return () => clearInterval(interval)
  }, [projectId])

  const loadProjectData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response: any = await api.getProjectDetails(projectId!)
      if (response.success) {
        setProject(response.data.project)
        setBriefing(response.data.briefing)
        setImages(response.data.images || [])
      }
    } catch (error: any) {
      if (!silent) console.error('Failed to load project:', error)
      if (error?.message?.toLowerCase().includes('do not have access')) {
        navigate('/client/all')
        if (!silent) alert('You do not have access to this project. It belongs to another client.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    if (!project) return []
    
    const notes = (project.status_notes || {}) as any

    const steps = []
    steps.push({ 
      label: 'Briefing Submitted', 
      status: briefing ? 'completed' : 'pending',
      date: briefing ? new Date(briefing.created_at).toLocaleDateString() : 'Pending',
      note: undefined
    })
    steps.push({ 
      label: 'Payment Confirmed', 
      status: project.payment_status === 'paid' ? 'completed' : 'pending',
      date: project.payment_status === 'paid' ? 'Completed' : 'Pending',
      note: undefined
    })
    steps.push({ 
      label: 'Project In Progress', 
      status: project.status === 'in_progress'
        ? 'active'
        : (project.status === 'review' || project.status === 'completed')
        ? 'completed'
        : 'pending',
      date: project.status === 'in_progress'
        ? 'In Progress'
        : project.status === 'review'
        ? 'Completed'
        : project.status === 'completed'
        ? 'Completed'
        : 'Pending',
      note: notes.in_progress
    })
    steps.push({ 
      label: 'Review Stage', 
      status: project.status === 'review' ? 'active' : project.status === 'completed' ? 'completed' : 'pending',
      date: project.status === 'review' ? 'In Review' : project.status === 'completed' ? 'Completed' : 'Pending',
      note: notes.review
    })
    steps.push({ 
      label: 'Revision', 
      status: project.status === 'revision' ? 'active' : 'pending',
      date: project.status === 'revision' ? 'In Revision' : 'Pending',
      note: notes.revision
    })
    steps.push({ 
      label: 'Delivery', 
      status: project.status === 'completed' ? 'completed' : 'pending',
      date: project.status === 'completed' ? 'Delivered' : 'Pending',
      note: notes.completed
    })
    
    return steps
  }

  const getCleanBriefingText = () => {
    if (!briefing?.overall_description) return ''
    // Remove any lines that are internal notes
    return briefing.overall_description
      .split('\n')
      .filter((line: string) => !line.trim().startsWith('[Internal Note]:'))
      .join('\n')
      .trim()
  }

  const handleOpenRevisionModal = () => {
    if (!project) return

    const revisionsUsed = project.revisions_used || 0
    const maxRevisions = project.max_revisions || 3
    const remaining = maxRevisions - revisionsUsed

    if (remaining <= 0) {
      alert('All revisions have been used.')
      return
    }

    setRevisionDescription('')
    setIsRevisionModalOpen(true)
  }

  const handleClaimRevision = async () => {
    if (!projectId || !project) return

    try {
      setClaimingRevision(true)
      const response: any = await api.claimRevision(projectId, revisionDescription.trim() || undefined)
      if (response.success) {
        alert(response.message || 'Revision claimed successfully!')
        setIsRevisionModalOpen(false)
        setRevisionDescription('')
        // Reload project data
        await loadProjectData(false)
      } else {
        alert(response.message || 'Failed to claim revision')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to claim revision')
    } finally {
      setClaimingRevision(false)
    }
  }

  const getAvailableRevisions = () => {
    if (!project) return { used: 0, max: 3, remaining: 3 }
    const used = project.revisions_used || 0
    const max = project.max_revisions || 3
    return { used, max, remaining: max - used }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading dashboard...</p>
        </div>
      </section>
    )
  }

  if (!project) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Project Not Found</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            The project link is invalid or has expired.
          </p>
        </div>
      </section>
    )
  }

  const statusSteps = getStatusSteps()

  return (
    <section className="page">
      <header className="page-header">
        <Link
          to="/client/all"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.9rem',
            color: '#64748b',
            textDecoration: 'none',
            marginBottom: '0.5rem',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f97316'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748b'
          }}
        >
          ← View all projects
        </Link>
        <div className="page-kicker">Client Dashboard</div>
        <h1 className="page-title">{project.name}</h1>
        <p className="page-subtitle">
          Track your project progress and review submitted materials.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          {/* Revisions Section */}
          {project.payment_status === 'paid' && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '0.8rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: '600' }}>
                    Revisions Available
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                    You have <strong style={{ color: '#f97316' }}>{getAvailableRevisions().remaining}</strong> of <strong>{getAvailableRevisions().max}</strong> revision(s) remaining
                  </p>
                </div>
                <button
                  onClick={handleOpenRevisionModal}
                  disabled={getAvailableRevisions().remaining <= 0 || project.status === 'revision'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: getAvailableRevisions().remaining > 0 && project.status !== 'revision'
                      ? '#f97316'
                      : '#94a3b8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.6rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: getAvailableRevisions().remaining > 0 && project.status !== 'revision'
                      ? 'pointer'
                      : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (getAvailableRevisions().remaining > 0 && project.status !== 'revision') {
                      e.currentTarget.style.background = '#ea580c'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getAvailableRevisions().remaining > 0 && project.status !== 'revision') {
                      e.currentTarget.style.background = '#f97316'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {project.status === 'revision' ? 'Revision in Progress' : 'Request Revision'}
                </button>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#0f172a' }}>
            Project Status
          </h3>

          <div style={{ marginBottom: '2rem' }}>
            {statusSteps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.2rem',
                  paddingLeft: '1rem',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: step.status === 'completed' 
                    ? '#22c55e' 
                    : step.status === 'active' 
                    ? '#1d4ed8' 
                    : 'rgba(148, 163, 184, 0.4)',
                  border: step.status === 'active' ? '2px solid #1d4ed8' : 'none',
                  boxShadow: step.status === 'active' ? '0 0 12px rgba(29, 78, 216, 0.6)' : 'none',
                  flexShrink: 0,
                  marginTop: '0.2rem'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: step.status !== 'pending' ? '600' : '400',
                    color: step.status === 'completed' ? '#22c55e' : step.status === 'active' ? '#1d4ed8' : '#64748b',
                    marginBottom: '0.2rem'
                  }}>
                    {step.label}
                  </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{step.date}</div>
                {step.note && (
                  <div
                    style={{
                      marginTop: '0.2rem',
                      fontSize: '0.85rem',
                      color: '#4b5563',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {step.note}
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>

          {briefing && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>
                Your Briefing
              </h3>
              {getCleanBriefingText() && (
                <div style={{
                  background: 'rgba(30, 64, 175, 0.05)',
                  padding: '1rem',
                  borderRadius: '0.6rem',
                  marginBottom: '1rem',
                  border: '1px solid rgba(30, 64, 175, 0.2)'
                }}>
                  <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.6' }}>
                    {getCleanBriefingText()}
                  </p>
                </div>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a' }}>
                Reference Images ({images.length})
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                {images.map((img: any) => (
                  <div
                    key={img._id || img.id}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      background: '#f3f4f6',
                      borderRadius: '0.6rem',
                      overflow: 'hidden',
                      border: '1px solid rgba(30, 64, 175, 0.2)'
                    }}
                  >
                    <img
                      src={img.url}
                      alt="Reference"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    {img.notes && (
                      <div style={{
                        padding: '0.5rem',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        fontSize: '0.75rem',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0
                      }}>
                        {img.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revision Request Modal */}
      <Modal
        isOpen={isRevisionModalOpen}
        onClose={() => {
          setIsRevisionModalOpen(false)
          setRevisionDescription('')
        }}
        title="Request Revision"
      >
        <div>
          <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
            Please provide details about what you'd like to be revised. This will help the collaborator understand your requirements.
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#0f172a',
              fontWeight: '500'
            }}>
              Revision Description *
            </label>
            <textarea
              value={revisionDescription}
              onChange={(e) => setRevisionDescription(e.target.value)}
              placeholder="Describe what you'd like to be changed or improved..."
              required
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '0.75rem',
                background: '#ffffff',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '0.6rem',
                color: '#0f172a',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setIsRevisionModalOpen(false)
                setRevisionDescription('')
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClaimRevision}
              disabled={claimingRevision || !revisionDescription.trim()}
              style={{
                padding: '0.75rem 1.8rem',
                background: claimingRevision || !revisionDescription.trim() ? '#94a3b8' : '#f97316',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                cursor: claimingRevision || !revisionDescription.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!claimingRevision && revisionDescription.trim()) {
                  e.currentTarget.style.background = '#ea580c'
                }
              }}
              onMouseLeave={(e) => {
                if (!claimingRevision && revisionDescription.trim()) {
                  e.currentTarget.style.background = '#f97316'
                }
              }}
            >
              {claimingRevision ? 'Submitting...' : 'Submit Revision Request'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
