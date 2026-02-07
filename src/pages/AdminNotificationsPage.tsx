import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res: any = await api.getNotifications()
      if (res.success && res.data) {
        setNotifications(res.data.notifications || [])
        setUnreadCount(res.data.unreadCount ?? 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Poll for new notifications (WhatsApp-like: new items appear)
  useEffect(() => {
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
      window.dispatchEvent(new Event('admin-notifications-updated'))
    } catch (e) {
      console.error(e)
    }
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      window.dispatchEvent(new Event('admin-notifications-updated'))
    } catch (e) {
      console.error(e)
    }
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getMessage = (n: any) => {
    if (n.type === 'invoice_uploaded') {
      const who = n.data?.collaboratorName ? ` by ${n.data.collaboratorName}` : ''
      return { text: `Invoice uploaded for "${n.data?.projectName || 'Project'}"${who}`, projectId: n.data?.projectId }
    }
    if (n.type === 'monthly_invoice_uploaded') {
      const who = n.data?.collaboratorName ? ` by ${n.data.collaboratorName}` : ''
      return { text: `Monthly invoice uploaded for ${n.data?.month || 'N/A'} (${n.data?.projectsCount ?? 0} project(s))${who}`, projectId: null }
    }
    return { text: 'New notification', projectId: n.data?.projectId }
  }

  if (loading && notifications.length === 0) {
    return (
      <section className="page">
        <div className="page-header">
          <div className="page-kicker">Admin Dashboard</div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Invoice uploads and updates.</p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#64748b' }}>Loading…</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Admin Dashboard</div>
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">
          When a collaborator uploads an invoice, it appears here.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/projects"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              background: 'rgba(29, 78, 216, 0.1)',
              color: '#1d4ed8',
              border: '1px solid rgba(29, 78, 216, 0.3)',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.85rem'
            }}
          >
            ← All Projects
          </Link>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '0.5rem',
                fontWeight: '500',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Mark all as read
            </button>
          )}
        </div>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          {notifications.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
              No notifications yet. When a collaborator uploads an invoice, it will appear here.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {notifications.map((n) => {
                const { text, projectId } = getMessage(n)
                return (
                  <li
                    key={n._id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                      background: n.read ? 'transparent' : 'rgba(29, 78, 216, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ flex: 1, fontSize: '0.95rem', color: '#0f172a' }}>{text}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatDate(n.created_at)}</span>
                    {projectId && (
                      <Link
                        to={`/admin/projects/${projectId}`}
                        onClick={() => markRead(n._id)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          background: '#1d4ed8',
                          color: '#fff',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}
                      >
                        View project
                      </Link>
                    )}
                    {!projectId && n.type === 'monthly_invoice_uploaded' && (
                      <Link
                        to="/admin/projects"
                        onClick={() => markRead(n._id)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          background: '#1d4ed8',
                          color: '#fff',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}
                      >
                        View projects
                      </Link>
                    )}
                    {!n.read && !projectId && n.type !== 'monthly_invoice_uploaded' && (
                      <button
                        type="button"
                        onClick={() => markRead(n._id)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          background: 'transparent',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
