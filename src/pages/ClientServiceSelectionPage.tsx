import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

export function ClientServiceSelectionPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCustomRequest, setShowCustomRequest] = useState(false)
  const [customRequestData, setCustomRequestData] = useState({
    description: '',
    preferred_timeline: '30 days'
  })
  const [requestingCustom, setRequestingCustom] = useState(false)

  useEffect(() => {
    // Check authentication first
    if (!api.isAuthenticated()) {
      navigate(`/login?redirect=/client/${projectId}/service`)
      return
    }

    if (projectId) {
      loadData()
    }
  }, [projectId, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const projectRes = await api.getProject(projectId!)
      
      if (projectRes.success) {
        const projectData = projectRes.data
        setProject(projectData)
        
        // For simple projects, show the service with price from the project
        if (projectData.project_type === 'simple' && projectData.service_price) {
          // Create a service object from the project data
          setServices([{
            _id: projectId,
            id: projectId,
            name: projectData.service_name || projectData.name || 'Service',
            description: `Service for ${projectData.name}`,
            price: projectData.service_price,
            delivery_timeline: projectData.delivery_timeline || '30 days'
          }])
        } else {
          // For custom projects or if no service_price, load from services API
          try {
            const servicesRes = await api.getServices()
            if (servicesRes.success) {
              setServices(servicesRes.data || [])
            }
          } catch (err) {
            console.error('Failed to load services:', err)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSelect = async (serviceId: string | null, customAmount?: number) => {
    if (!projectId) return

    try {
      setSubmitting(true)
      
      // For simple projects with service_price, we don't need to update the backend
      // The service and price are already set when the project was created
      if (project?.project_type === 'simple' && project?.service_price) {
        // Just navigate to briefing page
        navigate(`/client/${projectId}/briefing`)
        return
      }
      
      // For custom projects or projects with service selection, update the backend
      const response: any = await api.updateServiceSelection(projectId, {
        serviceId: serviceId || undefined,
        customAmount: customAmount,
      })

      if (response.success) {
        navigate(`/client/${projectId}/briefing`)
      } else {
        alert('Failed to save selection. Please try again.')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCustomRequest = async () => {
    if (!projectId) return

    try {
      setRequestingCustom(true)
      const response: any = await api.requestCustomQuote(projectId, customRequestData)

      if (response.success) {
        alert('Custom quote request submitted! Admin will review and send you a quote.')
        // Reload project to see updated status
        loadData()
        setShowCustomRequest(false)
      } else {
        alert('Failed to submit request. Please try again.')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setRequestingCustom(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading services...</p>
        </div>
      </section>
    )
  }

  const customQuote = project?.custom_quote_amount
    ? {
        name: project.name || 'Custom Quote',
        description: project.custom_quote_description || 'Agreed upon custom quote for this project',
        price: `$${project.custom_quote_amount.toLocaleString()}`,
        amount: project.custom_quote_amount,
      }
    : null

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Step 1 of 4</div>
        <h1 className="page-title">Select Your Service</h1>
        <p className="page-subtitle">
          Choose from our predefined packages or confirm your custom quote below.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          {customQuote && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
                Your Custom Quote
              </h3>
              <div
                style={{
                  padding: '1.5rem',
                  background: 'rgba(29, 78, 216, 0.1)',
                  border: '2px solid #1d4ed8',
                  borderRadius: '0.8rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', color: '#0f172a' }}>
                      {customQuote.name}
                    </h4>
                    
                    {/* Show client's original request description */}
                    {project?.custom_quote_request && typeof project.custom_quote_request === 'object' && project.custom_quote_request.description && (
                      <div style={{ 
                        marginTop: '0.75rem',
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <h5 style={{ 
                          margin: '0 0 0.4rem', 
                          fontSize: '0.85rem', 
                          color: '#1e40af',
                          fontWeight: '600'
                        }}>
                          Your Request:
                        </h5>
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
                    {customQuote.description && (
                      <div style={{ 
                        marginTop: project?.custom_quote_request && typeof project.custom_quote_request === 'object' && project.custom_quote_request.description ? '0.5rem' : '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(29, 78, 216, 0.2)'
                      }}>
                        <h5 style={{ 
                          margin: '0 0 0.4rem', 
                          fontSize: '0.85rem', 
                          color: '#1d4ed8',
                          fontWeight: '600'
                        }}>
                          Quote Details:
                        </h5>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.85rem', 
                          color: '#4b5563', 
                          lineHeight: '1.6', 
                          whiteSpace: 'pre-wrap'
                        }}>
                          {customQuote.description}
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1d4ed8', marginLeft: '1rem', whiteSpace: 'nowrap' }}>
                    {customQuote.price}
                  </div>
                </div>
                <button
                  onClick={() => handleServiceSelect(null, customQuote.amount)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.6rem',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Confirming...' : 'Confirm Custom Quote →'}
                </button>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
            Predefined Services
          </h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {services.map((service) => (
              <div
                key={service._id || service.id}
                style={{
                  padding: '1.5rem',
                  background: selectedService === (service._id || service.id) ? 'rgba(29, 78, 216, 0.1)' : 'white',
                  border: `2px solid ${selectedService === (service._id || service.id) ? '#1d4ed8' : 'rgba(59, 130, 246, 0.3)'}`,
                  borderRadius: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedService(service._id || service.id)}
                onMouseEnter={(e) => {
                  if (selectedService !== (service._id || service.id)) {
                    e.currentTarget.style.borderColor = '#1d4ed8'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedService !== (service._id || service.id)) {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', color: '#0f172a' }}>
                      {service.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>
                      {service.description}
                    </p>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1d4ed8', marginLeft: '1rem', whiteSpace: 'nowrap' }}>
                    ${service.price?.toLocaleString() || '0'}
                  </div>
                </div>

                {service.features && service.features.length > 0 && (
                  <ul style={{ margin: '0.8rem 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#4b5563' }}>
                    {service.features.map((feature: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: '0.3rem' }}>{feature}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Custom Service Request Option */}
          {project?.project_type === 'custom' && !customQuote && (
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
                Custom Service Request
              </h3>
              {!showCustomRequest ? (
                <div style={{
                  padding: '1.5rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.8rem',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#4b5563' }}>
                    Need something custom? Request a custom quote and we'll get back to you with pricing and timeline.
                  </p>
                  <button
                    onClick={() => setShowCustomRequest(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.6rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Request Custom Quote
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '1.5rem',
                  background: 'white',
                  border: '2px solid #3b82f6',
                  borderRadius: '0.8rem'
                }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#0f172a' }}>
                    Tell us about your project
                  </h4>
                  <textarea
                    value={customRequestData.description}
                    onChange={(e) => setCustomRequestData({ ...customRequestData, description: e.target.value })}
                    placeholder="Describe your project requirements, timeline, and any specific needs..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid rgba(30, 64, 175, 0.3)',
                      borderRadius: '0.6rem',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#0f172a' }}>
                      Preferred Timeline (default: 30 days)
                    </label>
                    <input
                      type="text"
                      value={customRequestData.preferred_timeline}
                      onChange={(e) => setCustomRequestData({ ...customRequestData, preferred_timeline: e.target.value })}
                      placeholder="e.g., 30 days, 2 weeks, 1 month"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(30, 64, 175, 0.3)',
                        borderRadius: '0.6rem',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handleCustomRequest}
                      disabled={requestingCustom || !customRequestData.description.trim()}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: requestingCustom || !customRequestData.description.trim() ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.6rem',
                        fontWeight: '500',
                        cursor: requestingCustom || !customRequestData.description.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {requestingCustom ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomRequest(false)
                        setCustomRequestData({ description: '', preferred_timeline: '30 days' })
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'transparent',
                        color: '#4b5563',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        borderRadius: '0.6rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {services.length === 0 && !customQuote && project?.project_type !== 'custom' && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>No services available at the moment.</p>
            </div>
          )}

          {selectedService && services.length > 0 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                onClick={() => handleServiceSelect(selectedService)}
                disabled={submitting}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting ? 'Confirming...' : 'Continue with Selected Service →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
