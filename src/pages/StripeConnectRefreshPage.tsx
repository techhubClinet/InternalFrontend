import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export function StripeConnectRefreshPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleRefresh = async () => {
      try {
        // Create a new Stripe Connect link to continue onboarding
        const response: any = await api.createCollaboratorStripeLink()
        
        if (response.success && response.data?.url) {
          // Redirect to Stripe onboarding
          window.location.href = response.data.url
        } else {
          // If link creation fails, redirect to dashboard
          navigate('/collaborator/projects')
        }
      } catch (error: any) {
        console.error('Stripe refresh error:', error)
        // Redirect to dashboard on error
        navigate('/collaborator/projects')
      }
    }

    handleRefresh()
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
          Refreshing Stripe Connection...
        </h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
          Redirecting you back to Stripe to complete the setup.
        </p>
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



