import { useState, useEffect } from 'react'
import { Modal } from '../components/Modal'
import { api } from '../services/api'

export function AdminCustomQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuote, setSelectedQuote] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectData, setProjectData] = useState({
    name: '',
    amount: '',
    delivery_timeline: '30 days',
    deadline: '',
    custom_quote_description: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadQuotes()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const response: any = await api.request('/custom-quotes/admin/pending')
      if (response.success) {
        setQuotes(response.data || [])
      }
    } catch (error) {
      console.error('Failed to load quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!selectedQuote || !projectData.name || !projectData.amount) {
      alert('Please fill in project name and amount')
      return
    }

    try {
      setCreating(true)
      const response: any = await api.request(`/custom-quotes/${selectedQuote._id || selectedQuote.id}/create-project`, {
        method: 'POST',
        body: JSON.stringify({
          name: projectData.name,
          amount: projectData.amount,
          delivery_timeline: projectData.delivery_timeline,
          deadline: projectData.deadline || undefined,
          custom_quote_description: projectData.custom_quote_description || undefined
        })
      })

      if (response.success) {
        alert('Custom project created successfully!')
        setShowCreateModal(false)
        setSelectedQuote(null)
        setProjectData({ name: '', amount: '', delivery_timeline: '30 days', deadline: '', custom_quote_description: '' })
        loadQuotes()
      } else {
        alert('Failed to create project. Please try again.')
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to create project'}`)
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getClientEmail = (quote: any) => {
    if (quote.client_email) return quote.client_email
    if (quote.requested_by && typeof quote.requested_by === 'object') {
      return quote.requested_by.email
    }
    return 'N/A'
  }

  const getClientName = (quote: any) => {
    if (quote.requested_by && typeof quote.requested_by === 'object') {
      return quote.requested_by.name || 'Client'
    }
    return 'Client'
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Admin Dashboard</div>
        <h1 className="page-title">Custom Quote Requests</h1>
        <p className="page-subtitle">
          Review custom quote requests and create projects for clients.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading requests...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>No pending custom quote requests.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {quotes.map((quote) => (
                <div
                  key={quote._id || quote.id}
                  style={{
                    padding: '1.5rem',
                    background: 'white',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '0.8rem',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#0f172a' }}>
                        Request from {getClientName(quote)}
                      </h4>
                      <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: '#6b7280' }}>
                        <strong>Email:</strong> {getClientEmail(quote)}
                      </p>
                      <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: '#6b7280' }}>
                        <strong>Requested:</strong> {formatDate(quote.created_at)}
                      </p>
                      {quote.estimated_budget && (
                        <p style={{ margin: '0 0 0.3rem', fontSize: '0.85rem', color: '#6b7280' }}>
                          <strong>Estimated Budget:</strong> ${quote.estimated_budget.toLocaleString()}
                        </p>
                      )}
                      {quote.delivery_timeline && (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                          <strong>Preferred Timeline:</strong> {quote.delivery_timeline}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedQuote(quote)
                        setProjectData({
                          name: quote.description ? quote.description.substring(0, 50) + '...' : 'Custom Project',
                          amount: quote.estimated_budget ? quote.estimated_budget.toString() : '',
                          delivery_timeline: quote.delivery_timeline || '30 days',
                          deadline: '',
                          custom_quote_description: ''
                        })
                        setShowCreateModal(true)
                      }}
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: '#1d4ed8',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Create Project
                    </button>
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '0.6rem',
                    marginTop: '1rem'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                      <strong>Description:</strong><br />
                      {quote.description || quote.admin_notes || 'No description provided'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedQuote(null)
        }}
        title="Create Custom Project"
      >
        <style>{`
          input::placeholder,
          textarea::placeholder {
            color: #9ca3af !important;
            opacity: 0.7;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            opacity: 0.7;
            cursor: pointer;
          }
        `}</style>
        {selectedQuote && (
          <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
            <div style={{ marginBottom: '1.2rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#93c5fd', fontWeight: '500' }}>
                <strong style={{ color: '#e5e7eb' }}>Client:</strong> {getClientEmail(selectedQuote)}
              </p>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#e5e7eb',
                fontWeight: '500'
              }}>
                Project Name *
              </label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(30, 64, 175, 0.4)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#e5e7eb'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(30, 64, 175, 0.4)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#e5e7eb',
                fontWeight: '500'
              }}>
                Price *
              </label>
              <input
                type="text"
                value={projectData.amount}
                onChange={(e) => setProjectData({ ...projectData, amount: e.target.value })}
                required
                placeholder="e.g., 5000 or $5,000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(30, 64, 175, 0.4)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#e5e7eb'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(30, 64, 175, 0.4)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#e5e7eb',
                fontWeight: '500'
              }}>
                Detailed Description (Optional)
              </label>
              <textarea
                value={projectData.custom_quote_description}
                onChange={(e) => setProjectData({ ...projectData, custom_quote_description: e.target.value })}
                placeholder="Explain the pricing, what's included, why the price is set this way, etc. This will be shown to the client."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(30, 64, 175, 0.4)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#e5e7eb',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(30, 64, 175, 0.4)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                This description will help the client understand the pricing and what's included in the quote.
              </p>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#e5e7eb',
                fontWeight: '500'
              }}>
                Delivery Timeline
              </label>
              <input
                type="text"
                value={projectData.delivery_timeline}
                onChange={(e) => setProjectData({ ...projectData, delivery_timeline: e.target.value })}
                placeholder="e.g., 30 days, 2 weeks"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(30, 64, 175, 0.4)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#e5e7eb'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(30, 64, 175, 0.4)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#e5e7eb',
                fontWeight: '500'
              }}>
                Deadline (Optional)
              </label>
              <input
                type="date"
                value={projectData.deadline}
                onChange={(e) => setProjectData({ ...projectData, deadline: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(30, 64, 175, 0.4)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#e5e7eb',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(30, 64, 175, 0.4)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedQuote(null)
                }}
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
                disabled={creating || !projectData.name || !projectData.amount}
                style={{
                  padding: '0.75rem 1.8rem',
                  background: creating || !projectData.name || !projectData.amount ? '#9ca3af' : '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  cursor: creating || !projectData.name || !projectData.amount ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  boxShadow: creating || !projectData.name || !projectData.amount ? 'none' : '0 8px 20px rgba(29, 78, 216, 0.4)'
                }}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  )
}


