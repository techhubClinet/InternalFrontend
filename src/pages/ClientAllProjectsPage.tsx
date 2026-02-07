import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Modal } from '../components/Modal'

export function ClientAllProjectsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestData, setRequestData] = useState({
    description: '',
    estimated_budget: '',
    preferred_timeline: '30 days'
  })
  const [submitting, setSubmitting] = useState(false)
  const [startingProjectId, setStartingProjectId] = useState<string | null>(null)

  useEffect(() => {
    loadProjects(false)
  }, [])

  // Open request modal when navigated with state (e.g. from "Request custom offer" on access-denied page)
  useEffect(() => {
    const state = location.state as { openRequestModal?: boolean } | null
    if (state?.openRequestModal) {
      setShowRequestModal(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // Auto-refresh when project status or payment changes
  useEffect(() => {
    const interval = setInterval(() => loadProjects(true), 30000)
    return () => clearInterval(interval)
  }, [])

  const getServiceKey = (p: any) => {
    const name = p.name || ''
    const price = p.service_price ?? p.custom_quote_amount ?? (p.selected_service?.price ?? '')
    return `${name}|${price}`
  }

  const loadProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      // Always load all predefined (simple) services - these are the catalog
      const simpleResponse: any = await api.getSimpleProjects()
      const allSimple: any[] = simpleResponse.success ? (simpleResponse.data || []) : []

      if (api.isAuthenticated()) {
        try {
          const userResponse: any = await api.getCurrentUser()
          if (userResponse.success) setUser(userResponse.data)
          const myResponse: any = await api.getMyProjects()
          const myProjects: any[] = myResponse.success ? (myResponse.data || []) : []

          // Build one list per service (like Fiverr gigs): each service once. If user already has this service, show theirs; else show any project as template (name/price). Multiple users can buy the same service.
          const byKey: Record<string, { project: any; isMine: boolean }> = {}
          const projectsByKey: Record<string, any[]> = {}
          for (const p of allSimple) {
            const key = getServiceKey(p)
            if (!projectsByKey[key]) projectsByKey[key] = []
            projectsByKey[key].push(p)
          }
          for (const key of Object.keys(projectsByKey)) {
            const group = projectsByKey[key]
            const myProject = myProjects.find((m: any) => getServiceKey(m) === key)
            byKey[key] = {
              project: myProject || group[0],
              isMine: !!myProject,
            }
          }
          let list: { project: any; isMine: boolean }[] = Object.values(byKey)
          const simpleIds = new Set(list.map((x) => (x.project._id || x.project.id).toString()))
          for (const m of myProjects) {
            if (m.project_type === 'custom' && !simpleIds.has((m._id || m.id).toString())) {
              list.push({ project: m, isMine: true })
              simpleIds.add((m._id || m.id).toString())
            }
          }
          const sorted = list.sort((a, b) =>
            new Date((b.project as any).created_at).getTime() - new Date((a.project as any).created_at).getTime()
          )
          setProjects(sorted)
        } catch (err: any) {
          console.warn('Failed to load your projects:', err)
          const sorted = allSimple
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((p: any) => ({ project: p, isMine: false }))
          setProjects(sorted)
        }
      } else {
        // Not logged in: show catalog deduped by service (name+price)
        const byKey: Record<string, any> = {}
        for (const p of allSimple) {
          const key = getServiceKey(p)
          if (!byKey[key]) byKey[key] = p
        }
        const list = Object.values(byKey).map((p: any) => ({ project: p, isMine: false }))
        const sorted = list.sort((a: any, b: any) =>
          new Date((b.project as any).created_at).getTime() - new Date((a.project as any).created_at).getTime()
        )
        setProjects(sorted)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleStartService = async (templateProjectId: string) => {
    if (startingProjectId) return
    setStartingProjectId(templateProjectId)
    try {
      const res = await api.startFromCatalog(templateProjectId)
      if (res.success && res.data) {
        const id = (res.data as any)._id || (res.data as any).id
        if (id) navigate(`/client/${id}`)
      }
    } catch (err) {
      console.error(err)
      setStartingProjectId(null)
    } finally {
      setStartingProjectId(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: '#64748b',
      in_progress: '#1d4ed8',
      review: '#facc15',
      revision: '#f97316',
      completed: '#22c55e',
    }
    return colors[status] || '#64748b'
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      pending: 'Pending',
      in_progress: 'In Progress',
      review: 'In Review',
      revision: 'Revision Requested',
      completed: 'Completed',
    }
    return labels[status] || status
  }

  const formatAmount = (project: any) => {
    if (project.custom_quote_amount) {
      return `$${project.custom_quote_amount.toLocaleString()}`
    }
    if (project.service_price) {
      return `$${project.service_price.toLocaleString()}`
    }
    if (project.selected_service && typeof project.selected_service === 'object') {
      return `$${project.selected_service.price?.toLocaleString() || '0'}`
    }
    return 'TBD'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const handleRequestCustomOffer = async () => {
    if (!api.isAuthenticated()) {
      navigate('/login?redirect=/client/all')
      return
    }

    if (!requestData.description.trim()) {
      alert('Please describe what you need')
      return
    }

    try {
      setSubmitting(true)
      const cleanedBudget = requestData.estimated_budget
        ? Number(requestData.estimated_budget.replace('$', '').replace(',', ''))
        : undefined

      const response: any = await api.requestStandaloneQuote({
        description: requestData.description,
        estimated_budget: cleanedBudget,
        preferred_timeline: requestData.preferred_timeline,
      })

      if (response.success) {
        alert('Custom offer request submitted successfully! Admin will review and create a project for you.')
        setShowRequestModal(false)
        setRequestData({ description: '', estimated_budget: '', preferred_timeline: '30 days' })
        // Reload projects in case a project was created
        loadProjects(false)
      } else {
        alert('Failed to submit request. Please try again.')
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to submit request'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading your projects...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Error</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">{user ? 'Your Projects' : 'Available Projects'}</div>
        <h1 className="page-title">{user ? 'All Your Projects' : 'Available Projects'}</h1>
        <p className="page-subtitle">
          {user 
            ? 'View and manage all your projects in one place.'
            : 'Browse available simple projects. Sign up or log in to see your custom projects.'}
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          {user && (
            <div style={{
              padding: '1rem',
              background: 'rgba(248, 115, 22, 0.08)',
              border: '1px solid rgba(248, 115, 22, 0.3)',
              borderRadius: '0.6rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af', fontWeight: '500' }}>
                  Need something custom? Request a custom offer!
                </p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Describe what you need and we'll create a custom project for you.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!api.isAuthenticated()) {
                    navigate('/login?redirect=/client/all')
                  } else {
                    setShowRequestModal(true)
                  }
                }}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                + Request Custom Offer
              </button>
            </div>
          )}
          {!user && (
            <div style={{
              padding: '1rem',
              background: 'rgba(248, 115, 22, 0.08)',
              border: '1px solid rgba(248, 115, 22, 0.3)',
              borderRadius: '0.6rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#9a3412' }}>
                💡 <strong>Tip:</strong> These are public simple projects. <Link to="/signup" style={{ color: '#ea580c', textDecoration: 'underline' }}>Sign up</Link> or <Link to="/login" style={{ color: '#ea580c', textDecoration: 'underline' }}>log in</Link> to see your custom projects and manage all your projects.
              </p>
            </div>
          )}
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>
                {user ? `No projects found for ${user.email}` : 'No simple projects available at the moment.'}
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {projects.map((item) => {
                const project = item.project
                const isMine = item.isMine
                const projectId = project._id || project.id
                const cardStyle = {
                  display: 'flex',
                  flexDirection: 'column' as const,
                  padding: '1.5rem',
                  background: 'white',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '1rem',
                  textDecoration: 'none' as const,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer' as const,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  height: '100%' as const,
                }
                const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.borderColor = '#ea580c'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.18)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
                const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
                const cardContent = (
                  <>
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem', 
                      fontSize: '1.25rem', 
                      fontWeight: '600',
                      color: '#0f172a',
                      lineHeight: '1.3'
                    }}>
                      {project.name}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.875rem', 
                      color: '#64748b',
                      lineHeight: '1.5'
                    }}>
                      {project.project_type === 'custom' ? 'Custom Project' : 'Simple Project'}
                    </p>
                  </div>

                  <div style={{ 
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
                  }}>
                    <div style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: '700', 
                      color: '#ea580c',
                      marginBottom: '0.5rem'
                    }}>
                      {formatAmount(project)}
                    </div>
                    {project.delivery_timeline && (
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.875rem', 
                        color: '#64748b'
                      }}>
                        Delivery: {project.delivery_timeline}
                      </p>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: 'auto'
                  }}>
                    {api.isAuthenticated() && user && project.client_email === user.email && (
                      <>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            background: `${getStatusColor(project.status)}15`,
                            border: `1px solid ${getStatusColor(project.status)}30`,
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            color: getStatusColor(project.status),
                            fontWeight: '500'
                          }}>
                            {getStatusLabel(project.status)}
                          </span>
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            background: project.payment_status === 'paid' ? '#22c55e15' : '#facc1515',
                            border: `1px solid ${project.payment_status === 'paid' ? '#22c55e30' : '#facc1530'}`,
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            color: project.payment_status === 'paid' ? '#22c55e' : '#facc15',
                            fontWeight: '500'
                          }}>
                            {project.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                          </span>
                        </div>
                        <p style={{ 
                          margin: '0.5rem 0 0', 
                          fontSize: '0.75rem', 
                          color: '#94a3b8'
                        }}>
                          Started {formatDate(project.created_at)}
                        </p>
                      </>
                    )}
                    {api.isAuthenticated() && user && !isMine && project.project_type !== 'custom' && (
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#ea580c', fontWeight: '500' }}>
                        Click to buy this service →
                      </p>
                    )}
                    {!api.isAuthenticated() && (
                      <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#ea580c', fontWeight: '500' }}>
                        Sign in to select this project →
                      </p>
                    )}
                  </div>
                </>
                )
                if (!api.isAuthenticated()) {
                  return (
                    <div
                      key={projectId}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/login?redirect=/client/all`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/login?redirect=/client/all`)}
                      style={cardStyle}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {cardContent}
                    </div>
                  )
                }
                if (isMine) {
                  return (
                    <Link
                      key={projectId}
                      to={`/client/${projectId}`}
                      style={cardStyle}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {cardContent}
                    </Link>
                  )
                }
                const isStarting = startingProjectId === projectId
                return (
                  <div
                    key={projectId}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStartService(projectId)}
                    onKeyDown={(e) => e.key === 'Enter' && !isStarting && handleStartService(projectId)}
                    style={{ ...cardStyle, opacity: isStarting ? 0.8 : 1, cursor: isStarting ? 'wait' : 'pointer' }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {cardContent}
                    {isStarting && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#ea580c', fontWeight: '500' }}>
                        Opening…
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Custom Offer"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleRequestCustomOffer(); }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#0f172a',
              fontWeight: '500'
            }}>
              What do you need? *
            </label>
            <textarea
              value={requestData.description}
              onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
              required
              placeholder="Describe your project requirements, goals, timeline, and any specific needs..."
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(30, 64, 175, 0.3)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#0f172a',
              fontWeight: '500'
            }}>
              Estimated Budget (Optional)
            </label>
            <input
              type="text"
              value={requestData.estimated_budget}
              onChange={(e) => setRequestData({ ...requestData, estimated_budget: e.target.value })}
              placeholder="e.g., $5,000 or 5000"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(30, 64, 175, 0.3)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#0f172a',
              fontWeight: '500'
            }}>
              Preferred Timeline
            </label>
            <input
              type="text"
              value={requestData.preferred_timeline}
              onChange={(e) => setRequestData({ ...requestData, preferred_timeline: e.target.value })}
              placeholder="e.g., 30 days, 2 weeks, 1 month"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(30, 64, 175, 0.3)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Default: 30 days (admin can adjust based on complexity)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '999px',
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !requestData.description.trim()}
              style={{
                padding: '0.75rem 1.8rem',
                background: submitting || !requestData.description.trim() ? '#9ca3af' : '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.9rem',
                cursor: submitting || !requestData.description.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                boxShadow: submitting || !requestData.description.trim() ? 'none' : '0 8px 20px rgba(29, 78, 216, 0.4)'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

