import { BrowserRouter, Link, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import { ClientProjectPage } from './pages/ClientProjectPage'
import { ClientServiceSelectionPage } from './pages/ClientServiceSelectionPage'
import { ClientBriefingPage } from './pages/ClientBriefingPage'
import { ClientPaymentPage } from './pages/ClientPaymentPage'
import { ClientDashboardPage } from './pages/ClientDashboardPage'
import { ClientAccessPage } from './pages/ClientAccessPage'
import { PaymentSuccessPage } from './pages/PaymentSuccessPage'
import { ClientAllProjectsPage } from './pages/ClientAllProjectsPage'
import { SignupPage } from './pages/SignupPage'
import { LoginPage } from './pages/LoginPage'
import { AdminProjectsPage } from './pages/AdminProjectsPage'
import { AdminProjectDetailPage } from './pages/AdminProjectDetailPage'
import { AdminCollaboratorsPage } from './pages/AdminCollaboratorsPage'
import { AdminCustomQuotesPage } from './pages/AdminCustomQuotesPage'
import { AdminNotificationsPage } from './pages/AdminNotificationsPage'
import { CollaboratorProjectsPage } from './pages/CollaboratorProjectsPage'
import { CollaboratorProjectDetailPage } from './pages/CollaboratorProjectDetailPage'
import { StripeConnectReturnPage } from './pages/StripeConnectReturnPage'
import { StripeConnectRefreshPage } from './pages/StripeConnectRefreshPage'
import { getUserRole, clearUserData } from './utils/auth'
import { api } from './services/api'
import { ProtectedRoute } from './components/ProtectedRoute'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home">
      {/* Hero with only admin/collaborator login options */}
      <section className="home-hero">
        <div className="home-hero-left">
          <p className="home-availability">Welcome to your project portal.</p>
          <h1 className="home-title">
            Choose how you want to <span className="home-title-highlight">log in</span>.
          </h1>
          <p className="home-subtitle">Please select whether you are an admin or a collaborator.</p>

          <div className="home-cta-row">
            <button
              className="home-cta-primary"
              onClick={() => navigate('/login?redirect=/admin/projects')}
            >
              Login as Admin
            </button>
            <button
              className="home-cta-ghost"
              onClick={() => navigate('/login?redirect=/collaborator/projects')}
            >
              Login as Collaborator
            </button>
          </div>

          <div className="home-meta">
            <span className="home-meta-dot" />
            <span>Collaborators can log in using the credentials provided by the admin.</span>
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="home-strip">
        <div className="home-strip-inner">
          <div className="home-strip-card home-strip-card-before">
            <div className="home-strip-label">
              <span className="home-strip-icon">✕</span>
              <span>Before your portal</span>
            </div>
            <p className="home-strip-text">
              DMs, scattered emails, manual quotes, and clients asking “how much do you
              charge?” on repeat.
            </p>
          </div>

          <div className="home-strip-card home-strip-card-after">
            <div className="home-strip-label">
              <span className="home-strip-icon home-strip-icon-check">✓</span>
              <span>After your portal</span>
            </div>
            <p className="home-strip-text">
              One link shares pricing, collects the brief, takes payment, and keeps every
              project on rails automatically.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="home-section">
        <h2 className="home-section-title">How it works</h2>
        <ol className="home-steps">
          <li>
            <span className="home-step-number">1</span>
            <div>
              <h3 className="home-step-title">Share your link</h3>
              <p className="home-step-text">
                Add it to your bio, email signature, or send it in DMs. One link replaces
                every “hey, what&apos;s your rate?” reply.
              </p>
            </div>
          </li>
          <li>
            <span className="home-step-number">2</span>
            <div>
              <h3 className="home-step-title">Client picks their service</h3>
              <p className="home-step-text">
                They browse your services, select options, see pricing, and confirm
                timelines without a back‑and‑forth.
              </p>
            </div>
          </li>
          <li>
            <span className="home-step-number">3</span>
            <div>
              <h3 className="home-step-title">Guided briefing &amp; payment</h3>
              <p className="home-step-text">
                The portal collects files, requirements, and notes, then takes payment
                upfront or via milestones.
              </p>
            </div>
          </li>
          <li>
            <span className="home-step-number">4</span>
      <div>
              <h3 className="home-step-title">You just design</h3>
              <p className="home-step-text">
                Clients see their status, uploads, and next steps in one dashboard while
                you focus on the creative work.
              </p>
      </div>
          </li>
        </ol>
      </section>

      {/* Benefits row */}
      <section className="home-section home-benefits">
        <h2 className="home-section-title">You design, we handle the admin.</h2>
        <div className="home-benefits-grid">
          <article className="home-benefit-card">
            <h3>No‑hassle pricing</h3>
            <p>
              Set your prices and packages once. Clients pick what they need and pay
              before you start.
            </p>
          </article>
          <article className="home-benefit-card">
            <h3>Guided briefs</h3>
            <p>
              Turn vague requests into clear project briefs with structured questions and
              required uploads.
            </p>
          </article>
          <article className="home-benefit-card">
            <h3>Automatic updates</h3>
            <p>
              Keep everyone in the loop with simple status updates instead of long email
              threads.
            </p>
          </article>
        </div>
      </section>

      {/* Features table */}
      <section className="home-section home-features">
        <h2 className="home-section-title">The features that keep projects moving.</h2>
        <div className="home-features-grid">
          <div className="home-features-col">
            <h3 className="home-features-heading">Problems you know too well</h3>
            <ul className="home-features-list">
              <li>Clients ghost after you send a quote.</li>
              <li>Feedback arrives as &quot;can you make it pop?&quot;.</li>
              <li>You&apos;re never sure where projects are stuck.</li>
              <li>Everyone asks the same status questions.</li>
              <li>Pricing feels like a guessing game.</li>
            </ul>
          </div>
          <div className="home-features-col">
            <h3 className="home-features-heading">What your portal handles</h3>
            <ul className="home-features-list home-features-list-accent">
              <li>Simple price controls and minimums.</li>
              <li>Structured feedback and approvals.</li>
              <li>Timeline and status tracking for every client.</li>
              <li>Automated updates and reminders.</li>
              <li>Insights into which services convert best.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="home-final-cta">
        <h2 className="home-final-title">Log in to manage your work.</h2>
        <p className="home-final-text">
          Admins can manage projects and collaborators. Collaborators can see their assigned projects and payments.
        </p>
        <div className="home-cta-row" style={{ justifyContent: 'center' }}>
          <button
            className="home-final-button"
            onClick={() => navigate('/login?redirect=/admin/projects')}
          >
            Login as Admin
          </button>
          <button
            className="home-cta-ghost home-final-button"
            onClick={() => navigate('/login?redirect=/collaborator/projects')}
          >
            Login as Collaborator
          </button>
        </div>
      </section>
    </div>
  )
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userRole, setUserRole] = useState<'client' | 'admin' | 'collaborator' | null>(null)
  const [notificationUnread, setNotificationUnread] = useState(0)
  const prevUnreadRef = { current: -1 }

  useEffect(() => {
    const updateRole = () => {
      const role = getUserRole()
      setUserRole(role)
    }
    updateRole()
    window.addEventListener('storage', updateRole)
    const interval = setInterval(updateRole, 1000)
    return () => {
      window.removeEventListener('storage', updateRole)
      clearInterval(interval)
    }
  }, [])

  // Poll notification count for admin (WhatsApp-like badge)
  useEffect(() => {
    if (userRole !== 'admin' || !api.isAuthenticated()) {
      setNotificationUnread(0)
      return
    }
    const fetchCount = () => {
      api.getNotificationUnreadCount().then((res: any) => {
        if (res?.success && res?.data?.unreadCount != null) {
          const newCount = res.data.unreadCount
          if (prevUnreadRef.current >= 0 && newCount > prevUnreadRef.current && !location.pathname.startsWith('/admin/notifications')) {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
              const o = ctx.createOscillator()
              const g = ctx.createGain()
              o.connect(g)
              g.connect(ctx.destination)
              o.frequency.value = 800
              g.gain.setValueAtTime(0.15, ctx.currentTime)
              g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
              o.start(ctx.currentTime)
              o.stop(ctx.currentTime + 0.15)
            } catch (_) {}
          }
          prevUnreadRef.current = newCount
          setNotificationUnread(newCount)
        }
      }).catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 12000)
    const onUpdated = () => fetchCount()
    window.addEventListener('admin-notifications-updated', onUpdated)
    return () => {
      clearInterval(interval)
      window.removeEventListener('admin-notifications-updated', onUpdated)
    }
  }, [userRole])

  const handleLogout = () => {
    api.logout()
    clearUserData()
    setUserRole(null)
    // Redirect based on current location
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/collaborator')) {
      navigate('/')
    } else {
      navigate('/client/all')
    }
  }

  return (
    <header className="app-header">
      <div className="app-brand">
        <img
          src="/logo.jpeg"
          alt="Kanri logo"
          className="app-logo"
        />
      </div>
          <nav className="app-nav">
        {/* Show links based on role */}
        {!userRole && (
          <>
            {/* No links when not logged in – use home page buttons to log in */}
          </>
        )}
        {userRole === 'admin' && (
          <>
            <Link className="pill pill-admin" to="/admin/projects">
              Admin
            </Link>
            <Link
              to="/admin/notifications"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#1d4ed8',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '500',
                textDecoration: 'none',
                marginLeft: '0.5rem'
              }}
            >
              Notifications
              {notificationUnread > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 5px',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {notificationUnread > 99 ? '99+' : notificationUnread}
                </span>
              )}
            </Link>
          </>
        )}
        {userRole === 'collaborator' && (
          <Link className="pill pill-collab" to="/collaborator/projects">
            Collaborator
          </Link>
        )}
        {/* Logout button for authenticated users */}
        {userRole && (
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: '#64748b',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  )
}

function App() {

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Auth routes */}
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Client routes */}
            <Route path="/client/access" element={<ClientAccessPage />} />
            <Route path="/client/all" element={<ClientAllProjectsPage />} />
            <Route path="/client/:projectId" element={<ClientProjectPage />} />
            <Route path="/client/:projectId/service" element={<ClientServiceSelectionPage />} />
            <Route path="/client/:projectId/briefing" element={<ClientBriefingPage />} />
            <Route path="/client/:projectId/payment" element={<ClientPaymentPage />} />
            <Route path="/client/:projectId/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/client/:projectId/dashboard" element={<ClientDashboardPage />} />

            {/* Admin routes - require admin role */}
            <Route
              path="/admin/projects"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects/:projectId"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProjectDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/custom-quotes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCustomQuotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/collaborators"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCollaboratorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Collaborator routes - require collaborator role */}
            <Route
              path="/collaborator/projects"
              element={
                <ProtectedRoute allowedRoles={['collaborator']}>
                  <CollaboratorProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collaborator/projects/:projectId"
              element={
                <ProtectedRoute allowedRoles={['collaborator']}>
                  <CollaboratorProjectDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collaborator/stripe/return"
              element={
                <ProtectedRoute allowedRoles={['collaborator']}>
                  <StripeConnectReturnPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collaborator/stripe/refresh"
              element={
                <ProtectedRoute allowedRoles={['collaborator']}>
                  <StripeConnectRefreshPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
