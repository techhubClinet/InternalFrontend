import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Modal } from '../components/Modal'

export function CollaboratorProjectsPage() {
  const location = useLocation()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [collaboratorName, setCollaboratorName] = useState('')
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [projectDetails, setProjectDetails] = useState<Record<string, { briefing: any; images: any[] }>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  const [stripeStatus, setStripeStatus] = useState<{ 
    connected: boolean; 
    payouts_enabled: boolean;
    balance?: {
      available: Array<{ amount: number; currency: string }>;
      pending: Array<{ amount: number; currency: string }>;
    };
  } | null>(null)
  const [loadingStripe, setLoadingStripe] = useState(false)
  const [claimingProjectId, setClaimingProjectId] = useState<string | null>(null)
  const [invoiceType, setInvoiceType] = useState<'per-project' | 'monthly'>('per-project')
  const [loadingInvoiceType, setLoadingInvoiceType] = useState(false)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [monthlyProjects, setMonthlyProjects] = useState<any[]>([])
  const [loadingMonthlyProjects, setLoadingMonthlyProjects] = useState(false)
  const [isMonthlyInvoiceModalOpen, setIsMonthlyInvoiceModalOpen] = useState(false)
  const [monthlyInvoiceFile, setMonthlyInvoiceFile] = useState<File | null>(null)
  const [uploadingMonthlyInvoice, setUploadingMonthlyInvoice] = useState(false)
  const [monthlyInvoices, setMonthlyInvoices] = useState<any[]>([])
  const [loadingMonthlyInvoices, setLoadingMonthlyInvoices] = useState(false)

  // Initial load - only run once on mount
  useEffect(() => {
    loadProjects(false)
    loadStripeStatus()
    // loadInvoiceType will be called after Stripe status loads if needed
  }, [])

  // Auto-refresh when admin approves/rejects invoice, pays collaborator, or updates status (no manual refresh)
  useEffect(() => {
    const interval = setInterval(() => loadProjects(true), 10000)
    return () => clearInterval(interval)
  }, [])

  // Refresh Stripe status when returning from Stripe Connect
  useEffect(() => {
    // Check if we're coming from Stripe return/refresh page
    if (location.state?.fromStripe || document.referrer.includes('stripe')) {
      loadStripeStatus()
    }
  }, [location])

  // Load monthly invoices when invoice type changes to monthly
  useEffect(() => {
    if (invoiceType === 'monthly') {
      loadMyMonthlyInvoices()
    } else {
      setMonthlyInvoices([])
    }
  }, [invoiceType])

  const loadMyMonthlyInvoices = async () => {
    try {
      setLoadingMonthlyInvoices(true)
      // Get all projects first to get project IDs
      const projectsResponse: any = await api.getMyCollaboratorProjects()
      const myProjectIds = projectsResponse.success 
        ? (projectsResponse.data || []).map((p: any) => p._id || p.id)
        : []

      const response: any = await api.getMonthlyInvoices()
      if (response.success) {
        // Filter to only show invoices for the current collaborator
        const myInvoices = response.data.filter((invoice: any) => {
          // Check if any project in the invoice belongs to this collaborator
          return invoice.projects.some((p: any) => myProjectIds.includes(p._id))
        })
        setMonthlyInvoices(myInvoices)
      }
    } catch (error) {
      console.error('Failed to load monthly invoices:', error)
      setMonthlyInvoices([])
    } finally {
      setLoadingMonthlyInvoices(false)
    }
  }

  useEffect(() => {
    if (invoiceType === 'monthly' && selectedYear && selectedMonth) {
      const monthString = `${selectedYear}-${selectedMonth}`
      loadMonthlyProjects(monthString)
    }
  }, [invoiceType, selectedYear, selectedMonth])

  const handleInvoiceTypeChange = async (type: 'per-project' | 'monthly') => {
    try {
      setLoadingInvoiceType(true)
      const response: any = await api.updateInvoiceType(type)
      if (response.success) {
        setInvoiceType(type)
        alert('Invoice type updated successfully')
        if (type === 'monthly') {
          await loadMyMonthlyInvoices()
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update invoice type')
    } finally {
      setLoadingInvoiceType(false)
    }
  }

  const loadMonthlyProjects = async (month: string) => {
    try {
      setLoadingMonthlyProjects(true)
      const response: any = await api.getMonthlyInvoiceProjects(month)
      if (response.success) {
        setMonthlyProjects(response.data.projects || [])
      }
    } catch (error) {
      console.error('Failed to load monthly projects:', error)
      setMonthlyProjects([])
    } finally {
      setLoadingMonthlyProjects(false)
    }
  }

  const handleMonthlyInvoiceUpload = async () => {
    if (!selectedYear || !selectedMonth || !monthlyInvoiceFile) {
      alert('Please select a year, month, and invoice file')
      return
    }

    const monthString = `${selectedYear}-${selectedMonth}`

    try {
      setUploadingMonthlyInvoice(true)
      const response: any = await api.uploadMonthlyInvoice(monthString, monthlyInvoiceFile)
      if (response.success) {
        alert(`Monthly invoice uploaded successfully for ${response.data.projects_count} project(s)`)
        setIsMonthlyInvoiceModalOpen(false)
        setMonthlyInvoiceFile(null)
        setSelectedYear('')
        setSelectedMonth('')
        await loadProjects()
        await loadMonthlyProjects(monthString)
        await loadMyMonthlyInvoices()
      } else {
        throw new Error(response.message || 'Failed to upload monthly invoice')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to upload monthly invoice')
    } finally {
      setUploadingMonthlyInvoice(false)
    }
  }

  // Get available years (current year and previous 2 years)
  const getAvailableYears = () => {
    const years: number[] = []
    const currentYear = new Date().getFullYear()
    for (let i = 0; i < 3; i++) {
      years.push(currentYear - i)
    }
    return years
  }

  // Get all 12 months
  const getAllMonths = () => {
    return [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' },
    ]
  }

  const loadStripeStatus = async () => {
    try {
      setLoadingStripe(true)
      const response: any = await api.getCollaboratorStripeStatus()
      if (response.success) {
        setStripeStatus(response.data)
        // Also set invoice type if available, otherwise default to 'per-project'
        if (response.data.invoice_type) {
          setInvoiceType(response.data.invoice_type)
        } else {
          setInvoiceType('per-project')
        }
      } else {
        // Default to 'per-project' if request fails
        setInvoiceType('per-project')
      }
    } catch (error) {
      console.error('Failed to load Stripe status:', error)
      // Default to 'per-project' on error
      setInvoiceType('per-project')
    } finally {
      setLoadingStripe(false)
    }
  }

  const loadProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response: any = await api.getMyCollaboratorProjects()
      if (response.success) {
        const assignedProjects = response.data || []

        // Set collaborator name from first project if available
        if (assignedProjects.length > 0 && assignedProjects[0].assigned_collaborator) {
          const collab = assignedProjects[0].assigned_collaborator
          if (typeof collab === 'object') {
            setCollaboratorName(`${collab.first_name} ${collab.last_name}`)
          }
        }

        setProjects(assignedProjects)
      }
    } catch (error) {
      if (!silent) console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    try {
      setLoadingStripe(true)
      const response: any = await api.createCollaboratorStripeLink()
      if (response.success && response.data?.url) {
        window.location.href = response.data.url
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create Stripe onboarding link')
    } finally {
      setLoadingStripe(false)
    }
  }

  const handleDisconnectStripe = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? You will need to reconnect to receive payments.')) {
      return
    }

    try {
      setLoadingStripe(true)
      const response: any = await api.disconnectCollaboratorStripe()
      if (response.success) {
        alert('Stripe account disconnected successfully')
        await loadStripeStatus()
      } else {
        throw new Error(response.message || 'Failed to disconnect Stripe account')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect Stripe account')
    } finally {
      setLoadingStripe(false)
    }
  }

  const canClaimEarnings = (project: any) => {
    if (!stripeStatus || !stripeStatus.connected || !stripeStatus.payouts_enabled) return false
    if (!project.collaborator_payment_amount || project.collaborator_payment_amount <= 0) return false
    if (project.payment_status !== 'paid') return false
    if (project.status !== 'completed') return false
    if (project.collaborator_paid) return false
    return true
  }

  const handleClaimEarnings = async (projectId: string) => {
    try {
      setClaimingProjectId(projectId)
      const response: any = await api.claimCollaboratorEarnings(projectId)
      if (response.success) {
        alert(response.message || 'Earnings claimed successfully')
        await loadProjects()
      } else {
        alert(response.message || 'Failed to claim earnings')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to claim earnings')
    } finally {
      setClaimingProjectId(null)
    }
  }

  const formatCollaboratorPayment = (project: any) => {
    if (project.collaborator_payment_amount) {
      return `$${project.collaborator_payment_amount.toLocaleString()}`
    }
    return 'Not set'
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const loadProjectDetails = async (projectId: string) => {
    if (projectDetails[projectId]) {
      return // Already loaded
    }

    try {
      setLoadingDetails(prev => ({ ...prev, [projectId]: true }))
      const response: any = await api.getProjectDetails(projectId)
      if (response.success) {
        setProjectDetails(prev => ({
          ...prev,
          [projectId]: {
            briefing: response.data.briefing,
            images: response.data.images || []
          }
        }))
      }
    } catch (error) {
      console.error('Failed to load project details:', error)
    } finally {
      setLoadingDetails(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const handleCardClick = (projectId: string, isExpanded: boolean) => {
    if (!isExpanded) {
      // Expanding - load details
      loadProjectDetails(projectId)
    }
    setExpandedProjectId(isExpanded ? null : projectId)
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Collaborator Dashboard</div>
        <h1 className="page-title">My Assigned Projects</h1>
        <p className="page-subtitle">
          {collaboratorName 
            ? `View projects assigned to ${collaboratorName} and access full briefings and deadlines.`
            : 'View projects assigned to you and access full briefings and deadlines.'}
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {stripeStatus && stripeStatus.connected && stripeStatus.payouts_enabled ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '999px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#22c55e',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>✓</span>
                <span>Connected Successfully</span>
              </span>
              {stripeStatus.balance && stripeStatus.balance.available && stripeStatus.balance.available.length > 0 && (
                <span style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '999px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }} title="Available balance in your connected Stripe account. Check your Stripe dashboard for full details.">
                  <span>💰</span>
                  <span>
                    Balance: {stripeStatus.balance.available.map((b: any) => 
                      `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`
                    ).join(', ')}
                    {stripeStatus.balance.pending && stripeStatus.balance.pending.length > 0 && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
                        (Pending: {stripeStatus.balance.pending.map((b: any) => 
                          `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`
                        ).join(', ')})
                      </span>
                    )}
                  </span>
                </span>
              )}
              {stripeStatus.balance && (!stripeStatus.balance.available || stripeStatus.balance.available.length === 0) && (
                <span style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '999px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }} title="Check your connected Stripe account dashboard for balance details">
                  💰 Balance: $0.00 (Check Stripe dashboard)
                </span>
              )}
              <button
                type="button"
                onClick={handleDisconnectStripe}
                disabled={loadingStripe}
                style={{
                  padding: '0.55rem 1.1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: '999px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: loadingStripe ? 'not-allowed' : 'pointer',
                  opacity: loadingStripe ? 0.7 : 1,
                }}
              >
                Disconnect
              </button>
            </div>
          ) : stripeStatus && stripeStatus.connected ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '999px',
                background: 'rgba(250, 204, 21, 0.15)',
                border: '1px solid rgba(250, 204, 21, 0.4)',
                color: '#facc15',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>⏳</span>
                <span>Connected - Complete Setup</span>
              </span>
              <button
                type="button"
                onClick={handleDisconnectStripe}
                disabled={loadingStripe}
                style={{
                  padding: '0.55rem 1.1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: '999px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: loadingStripe ? 'not-allowed' : 'pointer',
                  opacity: loadingStripe ? 0.7 : 1,
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectStripe}
              disabled={loadingStripe}
              style={{
                padding: '0.55rem 1.1rem',
                background: '#f97316',
                color: '#ffffff',
                borderRadius: '999px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: loadingStripe ? 'not-allowed' : 'pointer',
                opacity: loadingStripe ? 0.7 : 1,
              }}
            >
              {loadingStripe ? 'Connecting to Stripe...' : 'Connect Stripe to receive payments'}
            </button>
          )}

          {/* Invoice Type Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Invoice Type:</span>
            <select
              value={invoiceType}
              onChange={(e) => handleInvoiceTypeChange(e.target.value as 'per-project' | 'monthly')}
              disabled={loadingInvoiceType}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'white',
                fontSize: '0.85rem',
                cursor: loadingInvoiceType ? 'not-allowed' : 'pointer',
                color: '#0f172a',
              }}
            >
              <option value="per-project">Per-Project Invoice</option>
              <option value="monthly">Monthly Combined Invoice</option>
            </select>
          </div>

          {/* Monthly Invoice Upload Button */}
          {invoiceType === 'monthly' && (
            <button
              type="button"
              onClick={() => {
                const now = new Date()
                setSelectedYear(String(now.getFullYear()))
                setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'))
                setIsMonthlyInvoiceModalOpen(true)
              }}
              style={{
                padding: '0.55rem 1.1rem',
                background: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
                borderRadius: '999px',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Upload Monthly Invoice
            </button>
          )}
        </div>
      </header>

      <div className="page-body">
        {/* Monthly Invoice Status Section */}
        {invoiceType === 'monthly' && (
          <div className="page-panel" style={{ gridColumn: '1 / -1', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#0f172a' }}>
              Monthly Invoice Status
            </h3>
            {loadingMonthlyInvoices ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading monthly invoices...</p>
              </div>
            ) : monthlyInvoices.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                No monthly invoices uploaded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {monthlyInvoices.map((invoice: any) => {
                  const monthDate = new Date(`${invoice.month}-01`)
                  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  
                  return (
                    <div
                      key={invoice.monthly_invoice_id}
                      style={{
                        padding: '1rem',
                        background: invoice.invoice_status === 'approved'
                          ? 'rgba(34, 197, 94, 0.05)'
                          : invoice.invoice_status === 'rejected'
                          ? 'rgba(239, 68, 68, 0.05)'
                          : 'rgba(250, 204, 21, 0.05)',
                        border: `1px solid ${
                          invoice.invoice_status === 'approved'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : invoice.invoice_status === 'rejected'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(250, 204, 21, 0.3)'
                        }`,
                        borderRadius: '0.6rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>
                            {monthName}
                          </h4>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            {invoice.projects.length} project(s) • ${invoice.total_amount.toLocaleString()}
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
                          {invoice.invoice_status === 'rejected' && (
                            <button
                              type="button"
                              onClick={() => {
                                const [year, month] = invoice.month.split('-')
                                setSelectedYear(year)
                                setSelectedMonth(month)
                                setIsMonthlyInvoiceModalOpen(true)
                              }}
                              style={{
                                padding: '0.4rem 0.8rem',
                                background: 'rgba(234, 88, 12, 0.1)',
                                color: '#ea580c',
                                border: '1px solid rgba(234, 88, 12, 0.3)',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Re-upload
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>No projects assigned to you yet.</p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#0f172a' }}>
                Active Assignments ({projects.length})
              </h3>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {projects.map((project) => {
                  const projectId = project._id || project.id
                  const isExpanded = expandedProjectId === projectId
                  
                  return (
                    <div
                      key={projectId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1.5rem',
                        background: 'white',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: '1rem',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        height: isExpanded ? 'auto' : '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1d4ed8'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.15)'
                        if (!isExpanded) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)'
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                        if (!isExpanded) {
                          e.currentTarget.style.transform = 'translateY(0)'
                        }
                      }}
                      onClick={() => {
                        handleCardClick(projectId, isExpanded)
                      }}
                    >
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '1.25rem', 
                            fontWeight: '600',
                            color: '#0f172a',
                            lineHeight: '1.3',
                            flex: 1
                          }}>
                            {project.name}
                          </h4>
                          <span style={{
                            fontSize: '1.2rem',
                            color: '#64748b',
                            transition: 'transform 0.3s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}>
                            ▼
                          </span>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          color: '#64748b',
                          lineHeight: '1.5'
                        }}>
                          Client: {project.client_name}
                        </p>
                      </div>

                      <div style={{ 
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
                      }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700', 
                          color: '#22c55e',
                          marginBottom: '0.5rem'
                        }}>
                          {formatCollaboratorPayment(project)}
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          color: '#64748b'
                        }}>
                          Your Payment Amount
                        </p>
                      </div>

                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.5rem',
                        marginTop: 'auto'
                      }}>
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
                        </div>
                        {project.deadline && (
                          <p style={{ 
                            margin: '0.5rem 0 0', 
                            fontSize: '0.75rem', 
                            color: '#94a3b8'
                          }}>
                            Deadline: {formatDate(project.deadline)}
                          </p>
                        )}
                      </div>

                      {/* Claim earnings button for completed, paid projects */}
                      {canClaimEarnings(project) && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClaimEarnings(projectId)
                            }}
                            disabled={claimingProjectId === projectId}
                            style={{
                              width: '100%',
                              padding: '0.6rem 1rem',
                              background: claimingProjectId === projectId ? '#94a3b8' : '#f97316',
                              color: '#ffffff',
                              borderRadius: '0.5rem',
                              border: 'none',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: claimingProjectId === projectId ? 'not-allowed' : 'pointer',
                              marginTop: '0.25rem',
                            }}
                          >
                            {claimingProjectId === projectId ? 'Claiming...' : 'Claim Earnings'}
                          </button>
                        </div>
                      )}

                      {isExpanded && (
                        <div style={{
                          marginTop: '1.5rem',
                          paddingTop: '1.5rem',
                          borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                          animation: 'fadeIn 0.3s ease'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        >
                          {loadingDetails[projectId] ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                              Loading project details...
                            </div>
                          ) : (
                            <>
                              {/* Project Details */}
                              <div style={{ marginBottom: '1.5rem' }}>
                                <h5 style={{ 
                                  margin: '0 0 0.75rem', 
                                  fontSize: '0.9rem', 
                                  fontWeight: '600',
                                  color: '#0f172a'
                                }}>
                                  Project Details
                                </h5>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6' }}>
                                  {project.delivery_timeline && (
                                    <p style={{ margin: '0 0 0.5rem' }}>
                                      <strong>Delivery Timeline:</strong> {project.delivery_timeline}
                                    </p>
                                  )}
                                  {project.project_type && (
                                    <p style={{ margin: '0 0 0.5rem' }}>
                                      <strong>Project Type:</strong> {project.project_type === 'custom' ? 'Custom Project' : 'Simple Project'}
                                    </p>
                                  )}
                                  {project.client_email && (
                                    <p style={{ margin: '0 0 0.5rem' }}>
                                      <strong>Client Email:</strong> {project.client_email}
                                    </p>
                                  )}
                                  <p style={{ margin: 0 }}>
                                    <strong>Started:</strong> {formatDate(project.created_at)}
                                  </p>
                                </div>
                              </div>

                              {/* Full Client Briefing */}
                              {projectDetails[projectId]?.briefing && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                  <h5 style={{ 
                                    margin: '0 0 0.75rem', 
                                    fontSize: '0.9rem', 
                                    fontWeight: '600',
                                    color: '#0f172a'
                                  }}>
                                    Full Client Briefing
                                  </h5>
                                  <div style={{ marginBottom: '1rem' }}>
                                    <h6 style={{ 
                                      fontSize: '0.85rem', 
                                      marginBottom: '0.5rem', 
                                      color: '#4b5563',
                                      fontWeight: '500'
                                    }}>
                                      Overall Description
                                    </h6>
                                    <div style={{ 
                                      padding: '1rem', 
                                      background: '#f9fafb',
                                      border: '1px solid rgba(30, 64, 175, 0.2)',
                                      borderRadius: '0.6rem',
                                      color: '#0f172a',
                                      lineHeight: '1.6',
                                      fontSize: '0.9rem',
                                      whiteSpace: 'pre-wrap'
                                    }}>
                                      {projectDetails[projectId].briefing.overall_description || 'No description provided.'}
                                    </div>
                                  </div>

                                  {/* Reference Images */}
                                  {projectDetails[projectId].images && projectDetails[projectId].images.length > 0 && (
                                    <div>
                                      <h6 style={{ 
                                        fontSize: '0.85rem', 
                                        marginBottom: '0.75rem', 
                                        color: '#4b5563',
                                        fontWeight: '500'
                                      }}>
                                        Reference Images ({projectDetails[projectId].images.length})
                                      </h6>
                                      <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                        gap: '0.75rem'
                                      }}>
                                        {projectDetails[projectId].images.map((img: any) => (
                                          <div
                                            key={img._id || img.id}
                                            style={{
                                              aspectRatio: '1',
                                              background: '#f9fafb',
                                              border: '1px solid rgba(30, 64, 175, 0.2)',
                                              borderRadius: '0.6rem',
                                              padding: '0.5rem',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              overflow: 'hidden'
                                            }}
                                          >
                                            <div style={{
                                              flex: 1,
                                              background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(15, 23, 42, 0.1))',
                                              borderRadius: '0.4rem',
                                              marginBottom: '0.5rem',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              overflow: 'hidden'
                                            }}>
                                              {img.url ? (
                                                <img 
                                                  src={img.url} 
                                                  alt={img.notes || 'Reference image'}
                                                  style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                  }}
                                                />
                                              ) : (
                                                <span style={{ fontSize: '1.5rem' }}>🖼️</span>
                                              )}
                                            </div>
                                            {img.notes && (
                                              <p style={{
                                                margin: 0,
                                                fontSize: '0.7rem',
                                                color: '#64748b',
                                                lineHeight: '1.3',
                                                textAlign: 'center',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                              }}>
                                                {img.notes}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Link to full details page */}
                              <Link
                                to={`/collaborator/projects/${projectId}`}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-block',
                                  padding: '0.6rem 1.2rem',
                                  background: '#1d4ed8',
                                  color: '#ffffff',
                                  borderRadius: '0.5rem',
                                  textDecoration: 'none',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#1e40af'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#1d4ed8'
                                }}
                              >
                                View Full Project Details →
                              </Link>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Invoice Modal */}
      <Modal
        isOpen={isMonthlyInvoiceModalOpen}
        onClose={() => {
          setIsMonthlyInvoiceModalOpen(false)
          setMonthlyInvoiceFile(null)
          setSelectedYear('')
          setSelectedMonth('')
        }}
        title="Upload Monthly Combined Invoice"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleMonthlyInvoiceUpload(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: '500' }}>
                Select Year *
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value)
                  // Reset month when year changes
                  setSelectedMonth('')
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a year</option>
                {getAvailableYears().map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: '500' }}>
                Select Month *
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  if (selectedYear) {
                    const monthString = `${selectedYear}-${e.target.value}`
                    loadMonthlyProjects(monthString)
                  }
                }}
                required
                disabled={!selectedYear}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: selectedYear ? 'white' : '#f3f4f6',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: selectedYear ? '#0f172a' : '#9ca3af',
                  outline: 'none',
                  cursor: selectedYear ? 'pointer' : 'not-allowed',
                }}
              >
                <option value="">Select a month</option>
                {getAllMonths().map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedYear && selectedMonth && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.6rem' }}>
              {loadingMonthlyProjects ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Loading projects...</p>
              ) : monthlyProjects.length > 0 ? (
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Projects included in this invoice ({monthlyProjects.length}):
                  </p>
                  <ul style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, paddingLeft: '1.25rem' }}>
                    {monthlyProjects.map((project) => (
                      <li key={project._id || project.id} style={{ marginBottom: '0.25rem' }}>
                        {project.name} - ${project.collaborator_payment_amount?.toLocaleString() || '0'}
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '600', marginTop: '0.75rem', marginBottom: 0 }}>
                    Total Amount: ${monthlyProjects.reduce((sum, p) => sum + (p.collaborator_payment_amount || 0), 0).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  No completed projects found for this month.
                </p>
              )}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: '500' }}>
              Invoice Document (PDF, DOC, DOCX) *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setMonthlyInvoiceFile(file)
                }
              }}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'white',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Upload your monthly combined invoice document. Maximum file size: 10MB
            </p>
            {monthlyInvoiceFile && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#22c55e' }}>
                Selected: {monthlyInvoiceFile.name}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setIsMonthlyInvoiceModalOpen(false)
                setMonthlyInvoiceFile(null)
                setSelectedYear('')
                setSelectedMonth('')
              }}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingMonthlyInvoice || !monthlyInvoiceFile || !selectedYear || !selectedMonth || monthlyProjects.length === 0}
              style={{
                padding: '0.6rem 1.2rem',
                background: uploadingMonthlyInvoice
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                cursor: uploadingMonthlyInvoice || !monthlyInvoiceFile || !selectedYear || !selectedMonth || monthlyProjects.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                boxShadow: uploadingMonthlyInvoice ? 'none' : '0 4px 14px rgba(234, 88, 12, 0.4)',
              }}
            >
              {uploadingMonthlyInvoice ? 'Uploading...' : 'Upload Monthly Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
