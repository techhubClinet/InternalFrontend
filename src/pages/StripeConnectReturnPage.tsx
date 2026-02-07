import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export function StripeConnectReturnPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing your Stripe connection...')

  useEffect(() => {
    const handleStripeReturn = async () => {
      try {
        // Refresh Stripe status to get the latest connection state
        const response: any = await api.getCollaboratorStripeStatus()
        
        if (response.success) {
          const stripeData = response.data
          
          if (stripeData.connected && stripeData.payouts_enabled) {
            setStatus('success')
            setMessage('Stripe account connected successfully! Redirecting to dashboard...')
            
            // Redirect after 2 seconds
            setTimeout(() => {
              navigate('/collaborator/projects', { state: { fromStripe: true } })
            }, 2000)
          } else if (stripeData.connected) {
            setStatus('success')
            setMessage('Stripe account connected! Please complete the onboarding process. Redirecting...')
            
            // Redirect after 3 seconds
            setTimeout(() => {
              navigate('/collaborator/projects', { state: { fromStripe: true } })
            }, 3000)
          } else {
            setStatus('error')
            setMessage('Stripe connection incomplete. Please try again.')
            
            // Redirect after 3 seconds
            setTimeout(() => {
              navigate('/collaborator/projects', { state: { fromStripe: true } })
            }, 3000)
          }
        } else {
          setStatus('error')
          setMessage(response.message || 'Failed to verify Stripe connection')
          
          setTimeout(() => {
            navigate('/collaborator/projects', { state: { fromStripe: true } })
          }, 3000)
        }
      } catch (error: any) {
        console.error('Stripe return error:', error)
        setStatus('error')
        setMessage(error.message || 'An error occurred while processing your Stripe connection')
        
        setTimeout(() => {
          navigate('/collaborator/projects', { state: { fromStripe: true } })
        }, 3000)
      }
    }

    handleStripeReturn()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #f59e0b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem'
            }} />
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#0f172a' }}>
              Connecting to Stripe...
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <span style={{ fontSize: '2rem' }}>✓</span>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#22c55e' }}>
              Success!
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <span style={{ fontSize: '2rem', color: '#ef4444' }}>✗</span>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#ef4444' }}>
              Connection Issue
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              {message}
            </p>
          </>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

