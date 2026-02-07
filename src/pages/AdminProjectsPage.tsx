import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Modal } from '../components/Modal'
import { NewProjectForm } from '../components/NewProjectForm'
import { api, getApiBaseUrl } from '../services/api'

export function AdminProjectsPage() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'monthly-invoices'>('all')
  const [monthlyInvoices, setMonthlyInvoices] = useState<any[]>([])
  const [loadingMonthlyInvoices, setLoadingMonthlyInvoices] = useState(false)

  // Frontend base URL used for client access links
  const frontendBaseUrl =
    import.meta.env.VITE_FRONTEND_URL ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://internal-frontend-two.vercel.app')

  // Load projects and monthly invoices on initial mount
  useEffect(() => {
    loadProjects(false)
    loadMonthlyInvoices() // Load monthly invoices on mount to get the count
  }, [])

  // Auto-refresh when client pays or collaborator is assigned (no manual refresh needed)
  useEffect(() => {
    const interval = setInterval(() => {
      loadProjects(true)
      if (activeTab === 'monthly-invoices') loadMonthlyInvoices()
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  // Reload monthly invoices when tab is clicked (in case new invoices were added)
  useEffect(() => {
    if (activeTab === 'monthly-invoices') {
      loadMonthlyInvoices()
    }
  }, [activeTab])

  const loadMonthlyInvoices = async () => {
    try {
      setLoadingMonthlyInvoices(true)
      const response: any = await api.getMonthlyInvoices()
      if (response.success) {
        setMonthlyInvoices(response.data || [])
      }
    } catch (error) {
      console.error('Failed to load monthly invoices:', error)
    } finally {
      setLoadingMonthlyInvoices(false)
    }
  }

  const loadProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response: any = await api.request('/projects')
      if (response.success) {
        setProjects(response.data || [])
      }
    } catch (error) {
      if (!silent) console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
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
      review: 'Review',
      revision: 'Revision Requested',
      completed: 'Completed',
    }
    return labels[status] || status
  }

  const getPaymentColor = (paymentStatus: string) => {
    return paymentStatus === 'paid' ? '#22c55e' : '#facc15'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Admin Dashboard</div>
        <h1 className="page-title">Projects</h1>
        <p className="page-subtitle">
          Predefined projects are visible to everyone via the client link. Manage paid orders and monthly invoices in the tabs below.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/custom-quotes"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              background: 'rgba(248, 115, 22, 0.08)',
              color: '#ea580c',
              border: '1px solid rgba(248, 115, 22, 0.3)',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.85rem'
            }}
          >
            View Custom Quote Requests
          </Link>
          <Link
            to="/admin/collaborators"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.85rem'
            }}
          >
            Manage Collaborators
          </Link>
          <Link
            to="/admin/notifications"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#1d4ed8',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.85rem'
            }}
          >
            Notifications
          </Link>
        </div>
      </header>

      <div className="page-body">
        {/* Client Access Link Section */}
        <div className="page-panel" style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
            Client Access Link
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            Share this link with clients. <strong>Simple projects</strong> are visible to everyone via this link (no login required). Custom projects require clients to sign up/login.
          </p>
          <div style={{
            padding: '1rem',
            background: 'rgba(248, 115, 22, 0.05)',
            border: '1px solid rgba(248, 115, 22, 0.18)',
            borderRadius: '0.6rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                readOnly
                value={`${frontendBaseUrl}/client/all`}
                style={{
                  flex: 1,
                  minWidth: '300px',
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${frontendBaseUrl}/client/all`)
                  alert('Link copied to clipboard!')
                }}
                style={{
                  padding: '0.75rem 1.5rem',
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
                📋 Copy Link
              </button>
            </div>
            <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
              Simple projects are visible to everyone. Custom projects require clients to sign up/login to access.
            </p>
          </div>
        </div>

        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: activeTab === 'all' ? '#ea580c' : 'transparent',
                  color: activeTab === 'all' ? '#ffffff' : '#6b7280',
                  border: `1px solid ${activeTab === 'all' ? '#ea580c' : 'rgba(148, 163, 184, 0.4)'}`,
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Predefined Project ({loading ? '...' : (() => {
                  const simple = projects.filter((p: any) => p.project_type === 'simple')
                  const keys = new Set(simple.map((p: any) => `${p.name}|${p.service_price ?? p.custom_quote_amount ?? ''}`))
                  return keys.size
                })()})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: activeTab === 'paid' ? '#22c55e' : 'transparent',
                  color: activeTab === 'paid' ? '#ffffff' : '#6b7280',
                  border: `1px solid ${activeTab === 'paid' ? '#22c55e' : 'rgba(148, 163, 184, 0.4)'}`,
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Paid Orders ({loading ? '...' : projects.filter(p => p.payment_status === 'paid').length})
              </button>
              <button
                onClick={() => setActiveTab('monthly-invoices')}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: activeTab === 'monthly-invoices' ? '#1d4ed8' : 'transparent',
                  color: activeTab === 'monthly-invoices' ? '#ffffff' : '#6b7280',
                  border: `1px solid ${activeTab === 'monthly-invoices' ? '#1d4ed8' : 'rgba(148, 163, 184, 0.4)'}`,
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Monthly Invoices ({loadingMonthlyInvoices ? '...' : monthlyInvoices.length})
              </button>
            </div>
            <button 
              onClick={() => setIsNewProjectOpen(true)}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontWeight: '500',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              + New Project
            </button>
          </div>

          {activeTab === 'monthly-invoices' ? (
            loadingMonthlyInvoices ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading monthly invoices...</p>
              </div>
            ) : monthlyInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#6b7280' }}>No monthly invoices uploaded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {monthlyInvoices.map((invoice: any) => {
                  const monthDate = new Date(`${invoice.month}-01`)
                  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  const collaboratorName = invoice.collaborator && typeof invoice.collaborator === 'object'
                    ? `${invoice.collaborator.first_name} ${invoice.collaborator.last_name}`
                    : 'Unknown'

                  return (
                    <div
                      key={invoice.monthly_invoice_id}
                      style={{
                        padding: '1.5rem',
                        background: 'white',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: '1rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
                            {monthName} - Monthly Invoice
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                            Collaborator: {collaboratorName} • {invoice.projects.length} project(s) • Total: ${invoice.total_amount.toLocaleString()}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            background: invoice.invoice_status === 'approved' 
                              ? 'rgba(34, 197, 94, 0.1)' 
                              : invoice.invoice_status === 'rejected'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(250, 204, 21, 0.1)',
                            border: `1px solid ${
                              invoice.invoice_status === 'approved'
                                ? 'rgba(34, 197, 94, 0.3)'
                                : invoice.invoice_status === 'rejected'
                                ? 'rgba(239, 68, 68, 0.3)'
                                : 'rgba(250, 204, 21, 0.3)'
                            }`,
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            color: invoice.invoice_status === 'approved'
                              ? '#22c55e'
                              : invoice.invoice_status === 'rejected'
                              ? '#ef4444'
                              : '#facc15',
                            fontWeight: '500'
                          }}>
                            {invoice.invoice_status === 'approved' ? '✓ Approved' : invoice.invoice_status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                          Projects included:
                        </p>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                          {invoice.projects.map((project: any) => (
                            <li key={project._id} style={{ marginBottom: '0.25rem' }}>
                              {project.name} - ${project.collaborator_payment_amount?.toLocaleString() || '0'}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('auth_token')
                              if (!token) {
                                alert('You must be logged in to view the invoice.')
                                return
                              }

                              const apiUrl = `${getApiBaseUrl()}/upload/${invoice.projects[0]._id}/invoice`
                              const response = await fetch(apiUrl, {
                                method: 'GET',
                                headers: { 'Authorization': `Bearer ${token}` },
                              })

                              if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                              }

                              const blob = await response.blob()
                              const url = window.URL.createObjectURL(blob)
                              window.open(url, '_blank')
                            } catch (error: any) {
                              alert(`Failed to view invoice: ${error.message}`)
                            }
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          📄 View Invoice
                        </button>
                        {invoice.invoice_status === 'pending' && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const response: any = await api.approveInvoice(invoice.projects[0]._id)
                                  if (response.success) {
                                    alert('Monthly invoice approved successfully!')
                                    await loadMonthlyInvoices()
                                    await loadProjects()
                                  } else {
                                    throw new Error(response.message || 'Failed to approve invoice')
                                  }
                                } catch (error: any) {
                                  alert(`Failed to approve invoice: ${error.message}`)
                                }
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '0.5rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm('Are you sure you want to reject this monthly invoice?')) return
                                try {
                                  const response: any = await api.rejectInvoice(invoice.projects[0]._id)
                                  if (response.success) {
                                    alert('Monthly invoice rejected.')
                                    await loadMonthlyInvoices()
                                    await loadProjects()
                                  } else {
                                    throw new Error(response.message || 'Failed to reject invoice')
                                  }
                                } catch (error: any) {
                                  alert(`Failed to reject invoice: ${error.message}`)
                                }
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.5rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        {invoice.invoice_status === 'approved' && !invoice.projects[0].collaborator_paid && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Pay collaborator $${invoice.total_amount.toLocaleString()} for this monthly invoice?`)) return
                              try {
                                const response: any = await api.payCollaboratorForMonthlyInvoice(invoice.projects[0]._id)
                                if (response.success) {
                                  alert(`Monthly invoice paid successfully! Amount: $${response.data.amount.toLocaleString()} (${response.data.project_count} projects)`)
                                  await loadMonthlyInvoices()
                                  await loadProjects()
                                } else {
                                  throw new Error(response.message || 'Failed to pay collaborator')
                                }
                              } catch (error: any) {
                                alert(`Failed to pay collaborator: ${error.message}`)
                              }
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#22c55e',
                              border: '1px solid rgba(34, 197, 94, 0.4)',
                              borderRadius: '0.5rem',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            💰 Pay Collaborator (${invoice.total_amount.toLocaleString()})
                          </button>
                        )}
                        {invoice.projects[0].collaborator_paid && (
                          <span style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#22c55e',
                            fontWeight: '500'
                          }}>
                            ✓ Paid
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading projects...</p>
            </div>
          ) : (() => {
            const predefinedProjects = projects.filter((p: any) => p.project_type === 'simple')
            const filteredProjects = activeTab === 'paid'
              ? projects.filter((p: any) => p.payment_status === 'paid')
              : predefinedProjects

            if (filteredProjects.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: '#6b7280' }}>
                    {activeTab === 'paid'
                      ? 'No paid orders yet.'
                      : 'No predefined projects yet. Create one with "+ New Project" to show it on the client link.'}
                  </p>
                </div>
              )
            }

            // Predefined tab: same neat card layout as client (/client/all) – one card per unique service (name + price)
            if (activeTab === 'all') {
              const serviceKey = (p: any) => `${p.name}|${p.service_price ?? p.custom_quote_amount ?? ''}`
              const byKey: Record<string, any> = {}
              predefinedProjects.forEach((p: any) => {
                const key = serviceKey(p)
                if (!byKey[key]) byKey[key] = p
              })
              const catalogList = Object.values(byKey)
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {catalogList.map((project: any) => {
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
                      color: 'inherit',
                    }
                    return (
                      <Link
                        key={projectId}
                        to={`/admin/projects/${projectId}`}
                        style={cardStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ea580c'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.18)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{
                            margin: '0 0 0.5rem',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#0f172a',
                            lineHeight: 1.3,
                          }}>
                            {project.name}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                            Simple Project
                          </p>
                        </div>
                        <div style={{
                          marginBottom: '1rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        }}>
                          <div style={{
                            fontSize: '1.75rem',
                            fontWeight: '700',
                            color: '#ea580c',
                            marginBottom: '0.5rem',
                          }}>
                            {formatAmount(project)}
                          </div>
                          {project.delivery_timeline && (
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                              Delivery: {project.delivery_timeline}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#ea580c', fontWeight: '500' }}>
                            View project →
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )
            }

            // Paid tab: admin-style cards with status, client, collaborator
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredProjects.map((project: any) => (
                  <Link
                    key={project._id || project.id}
                    to={`/admin/projects/${project._id || project.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1.5rem',
                      background: 'white',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '1rem',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      height: '100%',
                      color: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ea580c'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.18)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', lineHeight: 1.3 }}>
                          {project.name}
                        </h4>
                        {!project.assigned_collaborator && (
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            background: 'rgba(234, 88, 12, 0.15)',
                            border: '1px solid rgba(234, 88, 12, 0.4)',
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: '#ea580c',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}>
                            New
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                        {project.client_name}
                      </p>
                    </div>
                    <div style={{
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                    }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#ea580c', marginBottom: '0.5rem' }}>
                        {formatAmount(project)}
                      </div>
                      {project.delivery_timeline && (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                          Delivery: {project.delivery_timeline}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          background: `${getStatusColor(project.status)}15`,
                          border: `1px solid ${getStatusColor(project.status)}30`,
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          color: getStatusColor(project.status),
                          fontWeight: '500',
                        }}>
                          {getStatusLabel(project.status)}
                        </span>
                        <span style={{
                          padding: '0.375rem 0.75rem',
                          background: `${getPaymentColor(project.payment_status)}15`,
                          border: `1px solid ${getPaymentColor(project.payment_status)}30`,
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          color: getPaymentColor(project.payment_status),
                          fontWeight: '500',
                        }}>
                          {project.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                        </span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                        Started {formatDate(project.created_at)}
                      </p>
                      {project.assigned_collaborator && (
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          Collaborator: {typeof project.assigned_collaborator === 'object'
                            ? `${project.assigned_collaborator.first_name} ${project.assigned_collaborator.last_name}`
                            : project.assigned_collaborator}
                          {project.collaborator_payment_amount && (
                            <span style={{ marginLeft: '0.5rem', color: '#22c55e' }}>
                              (${project.collaborator_payment_amount.toLocaleString()})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      <Modal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        title="Create New Project"
      >
        <NewProjectForm
          onSubmit={async (data) => {
            try {
              const response: any = await api.request('/projects', {
                method: 'POST',
                body: JSON.stringify({
                  name: data.name,
                  client_name: 'Client', // Default client name
                  client_email: data.project_type === 'custom' ? data.client_email : undefined,
                  project_type: data.project_type,
                  service: data.service || undefined,
                  service_price: data.service_price ? data.service_price.replace('$', '').replace(',', '') : undefined,
                  amount: data.amount ? data.amount.replace('$', '').replace(',', '') : undefined,
                  deadline: data.deadline || undefined,
                }),
              })
              
              if (response.success) {
                await loadProjects(false)
                setIsNewProjectOpen(false)
                const projectId = response.data._id || response.data.id
                const clientLink = data.project_type === 'simple' 
                  ? `${window.location.origin}/client/${projectId}`
                  : `${window.location.origin}/client/all`
                alert(`Project "${data.name}" created successfully!\n\nClient Link: ${clientLink}\n\n${data.project_type === 'simple' ? 'This link is accessible to anyone - no login required!' : 'Client needs to sign up/login to access this project.'}`)
              }
            } catch (error: any) {
              alert(`Failed to create project: ${error.message}`)
            }
          }}
          onCancel={() => setIsNewProjectOpen(false)}
        />
      </Modal>
    </section>
  )
}
