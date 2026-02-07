import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

export function PaymentSuccessPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (projectId && sessionId) {
      handlePaymentSuccess()
    } else if (projectId) {
      loadProject()
    }
  }, [projectId, sessionId])

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true)
      // Call the payment success endpoint which will:
      // 1. Verify payment with Stripe
      // 2. Update project payment status
      // 3. Get customer email from Stripe
      // 4. Send email to client
      const response: any = await api.handlePaymentSuccess(projectId!, sessionId!)
      
      if (response.success) {
        setProject(response.data.project)
        setEmailSent(response.data.email_sent)
        
        // If email was sent, show a success message
        if (response.data.email_sent) {
          console.log('✅ Email sent to:', response.data.email_address)
        }
      } else {
        setError(response.message || 'Failed to process payment success')
      }
    } catch (err: any) {
      console.error('Payment success error:', err)
      setError(err.message || 'Failed to process payment success')
      // Still try to load project details
      loadProject()
    } finally {
      setLoading(false)
    }
  }

  const loadProject = async () => {
    try {
      setLoading(true)
      const response: any = await api.getProjectDetails(projectId!)
      if (response.success) {
        setProject(response.data.project)
      } else {
        setError('Project not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = () => {
    if (!project) return '$0'
    if (project.custom_quote_amount) {
      return `$${project.custom_quote_amount.toLocaleString()}`
    }
    if (project.selected_service && typeof project.selected_service === 'object') {
      return `$${project.selected_service.price?.toLocaleString() || '0'}`
    }
    return '$0'
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading payment confirmation...</p>
        </div>
      </section>
    )
  }

  if (error || !project) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Payment Confirmation</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            {error || 'Unable to load project details.'}
          </p>
          <Link
            to="/client/access"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: '#1d4ed8',
              color: '#ffffff',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Back to Client Access
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Payment Successful</div>
        <h1 className="page-title">🎉 Payment Confirmed!</h1>
        <p className="page-subtitle">
          Thank you for your payment. Your project is now active and ready to begin.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1', maxWidth: '700px', margin: '0 auto' }}>
          {/* Success Icon */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '3rem' }}>✓</span>
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              color: '#0f172a', 
              marginBottom: '0.5rem' 
            }}>
              Payment Successful
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Your payment has been processed and confirmed
            </p>
          </div>

          {/* Payment Details Card */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '0.8rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              marginBottom: '1rem', 
              color: '#0f172a',
              fontWeight: '600'
            }}>
              Payment Details
            </h3>
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingBottom: '0.8rem',
                borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Amount Paid:</span>
                <span style={{ color: '#0f172a', fontWeight: '600', fontSize: '1.1rem' }}>
                  {formatAmount()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Payment Status:</span>
                <span style={{ 
                  color: '#22c55e', 
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  ✓ Paid
                </span>
              </div>
              {sessionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Transaction ID:</span>
                  <span style={{ 
                    color: '#4b5563', 
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}>
                    {sessionId.slice(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Project Details Card */}
          <div style={{
            background: 'white',
            border: '1px solid rgba(30, 64, 175, 0.2)',
            borderRadius: '0.8rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              marginBottom: '1rem', 
              color: '#0f172a',
              fontWeight: '600'
            }}>
              Project Information
            </h3>
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Project Name:</span>
                <span style={{ color: '#0f172a', fontWeight: '500' }}>{project.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Client Name:</span>
                <span style={{ color: '#0f172a', fontWeight: '500' }}>{project.client_name}</span>
              </div>
              {project.client_email && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Email:</span>
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>{project.client_email}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Service:</span>
                <span style={{ color: '#0f172a', fontWeight: '500' }}>
                  {project.selected_service && typeof project.selected_service === 'object'
                    ? project.selected_service.name
                    : project.custom_quote_amount
                    ? 'Custom Quote'
                    : 'Not selected'}
                </span>
              </div>
              {project.deadline && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Deadline:</span>
                  <span style={{ color: '#0f172a', fontWeight: '500' }}>
                    {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Project Status:</span>
                <span style={{ 
                  color: '#1d4ed8', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  {project.status === 'in_progress' ? 'In Progress' : 
                   project.status === 'review' ? 'In Review' :
                   project.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{
            background: 'rgba(30, 64, 175, 0.05)',
            border: '1px solid rgba(30, 64, 175, 0.2)',
            borderRadius: '0.8rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              marginBottom: '1rem', 
              color: '#0f172a',
              fontWeight: '600'
            }}>
              What Happens Next?
            </h3>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '1.2rem', 
              fontSize: '0.9rem', 
              color: '#4b5563',
              lineHeight: '1.8'
            }}>
              <li>You'll receive an email with a link to your project dashboard</li>
              <li>You can track your project progress and status updates</li>
              <li>Our team will begin working on your project</li>
              <li>You'll be notified when your project is ready for review</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to={`/client/${projectId}/dashboard`}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.75rem 1.5rem',
                background: '#1d4ed8',
                color: '#ffffff',
                borderRadius: '999px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.9rem',
                textAlign: 'center',
                boxShadow: '0 8px 20px rgba(29, 78, 216, 0.4)'
              }}
            >
              View Project Dashboard →
            </Link>
            <Link
              to="/client/all"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#4b5563',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '999px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}
            >
              Back to Project
            </Link>
          </div>

          {/* Receipt Note */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: emailSent ? 'rgba(34, 197, 94, 0.1)' : '#f9fafb',
            borderRadius: '0.6rem',
            border: `1px solid ${emailSent ? 'rgba(34, 197, 94, 0.3)' : 'rgba(30, 64, 175, 0.1)'}`
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              color: emailSent ? '#16a34a' : '#6b7280',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              {emailSent ? (
                <>
                  <strong>✅ Email Sent:</strong> A payment confirmation email with your dashboard link has been sent to your email address. Please check your inbox (and spam folder).
                </>
              ) : emailSent === false ? (
                <>
                  <strong>⚠️ Email Not Sent:</strong> We couldn't send the email automatically. Please contact support or use the dashboard link above to access your project.
                </>
              ) : (
                <>
                  <strong>📧 Receipt:</strong> A payment confirmation email has been sent to your email address.
                  {!project.client_email && ' Please contact support if you need a receipt.'}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}



