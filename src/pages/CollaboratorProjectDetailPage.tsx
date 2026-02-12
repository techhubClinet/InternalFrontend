import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api, getApiBaseUrl } from '../services/api'
import { Modal } from '../components/Modal'
import { UpdateStatusForm } from '../components/UpdateStatusForm'

export function CollaboratorProjectDetailPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState<any>(null)
  const [briefing, setBriefing] = useState<any>(null)
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)
  const [deliveryLink, setDeliveryLink] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [submittingDelivery, setSubmittingDelivery] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadProjectData(false)
    }
  }, [projectId])

  // Auto-refresh when admin approves/rejects invoice, pays collaborator, or updates status (no manual refresh)
  // Poll more often when waiting for invoice decision or for payment
  useEffect(() => {
    if (!projectId) return
    const waitingForInvoice = project?.invoice_status === 'pending'
    const waitingForPayment = project?.invoice_status === 'approved' && !project?.collaborator_paid
    const ms = waitingForInvoice || waitingForPayment ? 6000 : 15000
    const interval = setInterval(() => loadProjectData(true), ms)
    return () => clearInterval(interval)
  }, [projectId, project?.invoice_status, project?.collaborator_paid])

  const loadProjectData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response: any = await api.getProjectDetails(projectId!)
      if (response.success) {
        setProject(response.data.project)
        setBriefing(response.data.briefing)
        setImages(response.data.images || [])
      }
    } catch (error) {
      if (!silent) console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: '#64748b',
      in_progress: '#ea580c',
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

  const calculateDaysRemaining = (deadline: string) => {
    if (!deadline) return null
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleExportPDF = () => {
    if (!project) return

    const overallDescription = briefing?.overall_description || 'No description provided.'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Briefing - ${project.name}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1d4ed8; border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 30px; text-align: center; }
    h2 { color: #0f172a; margin-top: 24px; margin-bottom: 8px; }
    h3 { color: #1f2933; margin-top: 20px; margin-bottom: 6px; font-size: 16px; }
    .meta { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; margin-right: 6px; }
    .badge-status { background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}55; }
    .section { margin-bottom: 18px; }
    .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; background: #f9fafb; font-size: 13px; white-space: pre-wrap; }
    ul { padding-left: 18px; margin: 6px 0 10px; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
  </style>
</head>
<body>
  <h1>${project.name || 'Project Briefing'}</h1>

  <div class="section">
    <div class="meta"><strong>Client:</strong> ${project.client_name || 'N/A'}</div>
    ${project.client_email ? `<div class="meta"><strong>Client Email:</strong> ${project.client_email}</div>` : ''}
    <div class="meta"><strong>Started:</strong> ${project.created_at ? formatDate(project.created_at) : 'N/A'}</div>
    ${project.deadline ? `<div class="meta"><strong>Deadline:</strong> ${formatDate(project.deadline)}</div>` : ''}
    <div style="margin-top:8px;">
      <span class="badge badge-status">Status: ${statusLabel}</span>
      ${project.delivery_timeline ? `<span class="badge">Timeline: ${project.delivery_timeline}</span>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Client Briefing</h2>
    <h3>Overall Description</h3>
    <div class="box">${overallDescription.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>

  ${
    images && images.length
      ? `
  <div class="section">
    <h2>Reference Images</h2>
    <p style="font-size:12px;color:#6b7280;margin-bottom:8px;">
      Images are not embedded in this PDF, but their notes are listed below.
    </p>
    <table>
      <thead>
        <tr>
          <th style="width:40px;">#</th>
          <th>Notes / Description</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        ${images
          .map(
            (img, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${(img.notes || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;') || '—'}</td>
          <td>${img.url ? img.url : '—'}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>`
      : ''
  }

  ${
    project.internal_notes
      ? `
  <div class="section">
    <h2>Internal Project Notes</h2>
    <div class="box">${project.internal_notes
      .toString()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</div>
  </div>`
      : ''
  }
</body>
</html>
`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.src = url

    document.body.appendChild(iframe)

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.print()
          setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(url)
          }, 1000)
        } catch (error) {
          const printWindow = window.open(url, '_blank')
          if (printWindow) {
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print()
              }, 250)
            }
          }
          document.body.removeChild(iframe)
        }
      }, 500)
    }
  }
  const handleStatusUpdate = async (status: string, notes?: string) => {
    if (!projectId) return

    try {
      const responseData: any = await api.updateProjectStatus(projectId, { status, notes })
      if (responseData.success) {
        await loadProjectData()
        setIsStatusModalOpen(false)
        alert(`Project status updated to "${status}"`)
      } else {
        throw new Error(responseData.message || 'Failed to update status')
      }
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`)
    }
  }

  const handleSubmitDeliveryForReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    if (!deliveryLink.trim()) {
      alert('Please paste a delivery link (e.g. Google Drive, Dropbox).')
      return
    }

    const parts: string[] = [`Delivery link: ${deliveryLink.trim()}`]
    if (deliveryNotes.trim()) {
      parts.push('', 'Notes:', deliveryNotes.trim())
    }
    const combinedNotes = parts.join('\n')

    try {
      setSubmittingDelivery(true)
      const responseData: any = await api.updateProjectStatus(projectId, {
        status: 'review',
        notes: combinedNotes,
      })
      if (responseData.success) {
        await loadProjectData()
        setIsDeliveryModalOpen(false)
        setDeliveryLink('')
        setDeliveryNotes('')
        alert('Delivery submitted for client review.')
      } else {
        throw new Error(responseData.message || 'Failed to submit delivery for review')
      }
    } catch (error: any) {
      alert(`Failed to submit delivery: ${error.message}`)
    } finally {
      setSubmittingDelivery(false)
    }
  }

  const handleInvoiceUpload = async () => {
    if (!projectId || !invoiceFile) {
      alert('Please select an invoice file')
      return
    }

    try {
      setUploadingInvoice(true)
      const response: any = await api.uploadInvoice(projectId, invoiceFile)
      if (response.success) {
        alert('Invoice uploaded successfully! Waiting for admin approval.')
        await loadProjectData()
        setIsInvoiceModalOpen(false)
        setInvoiceFile(null)
      } else {
        throw new Error(response.message || 'Failed to upload invoice')
      }
    } catch (error: any) {
      alert(`Failed to upload invoice: ${error.message}`)
    } finally {
      setUploadingInvoice(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading project details...</p>
        </div>
      </section>
    )
  }

  if (!project) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#ef4444' }}>Project not found</p>
        </div>
      </section>
    )
  }

  const daysRemaining = project.deadline ? calculateDaysRemaining(project.deadline) : null
  const statusColor = getStatusColor(project.status)
  const statusLabel = getStatusLabel(project.status)

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Project #{projectId}</div>
        <h1 className="page-title">{project.name || 'Untitled Project'}</h1>
        <p className="page-subtitle">
          {project.client_name && `Client: ${project.client_name}`}
          {project.deadline && ` · Deadline: ${formatDate(project.deadline)}`}
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel">
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '0.4rem 0.8rem',
              background: `${statusColor}15`,
              border: `1px solid ${statusColor}40`,
              borderRadius: '999px',
              fontSize: '0.8rem',
              color: statusColor,
              fontWeight: '500'
            }}>
              Status: {statusLabel}
            </span>
            {project.deadline && (
              <span style={{
                padding: '0.4rem 0.8rem',
                background: 'rgba(250, 204, 21, 0.2)',
                border: '1px solid rgba(250, 204, 21, 0.4)',
                borderRadius: '999px',
                fontSize: '0.8rem',
                color: '#facc15',
                fontWeight: '500'
              }}>
                ⏰ Deadline: {formatDate(project.deadline)}
              </span>
            )}
          </div>

          {/* Revision Request Section */}
          {project.status === 'revision' && project.status_notes && (project.status_notes as any).revision && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.1))',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '0.8rem'
            }}>
              <h4 style={{ 
                fontSize: '0.95rem', 
                marginBottom: '0.75rem', 
                color: '#0f172a',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>🔴</span> Client Revision Request
              </h4>
              <div style={{ 
                padding: '0.875rem', 
                background: '#ffffff',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '0.6rem',
                color: '#0f172a',
                lineHeight: '1.6',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap'
              }}>
                {(project.status_notes as any).revision}
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
            Full Client Briefing
          </h3>

          {briefing && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: '#4b5563' }}>
                Overall Description
              </h4>
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
                {briefing.overall_description || 'No description provided.'}
              </div>
            </div>
          )}

          {images && images.length > 0 && (
            <>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: '#4b5563' }}>
                Reference Images ({images.length})
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '0.8rem',
                marginBottom: '1.5rem'
              }}>
                {images.map((img) => (
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.5rem',
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
                        fontSize: '0.75rem',
                        color: '#64748b',
                        lineHeight: '1.4',
                        textAlign: 'center'
                      }}>
                        {img.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {project.internal_notes && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.6rem',
              padding: '1rem',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: '#4b5563' }}>
                Internal Project Notes
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#0f172a',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {project.internal_notes}
              </p>
            </div>
          )}
        </div>

        <aside className="page-sidebar">
          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.6rem' }}>Project Info</strong>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#4b5563' }}>
              {project.selected_service && typeof project.selected_service === 'object' && (
                <div><strong>Service:</strong> {project.selected_service.name || 'N/A'}</div>
              )}
              {project.collaborator_payment_amount && (
                <div><strong>Your Payment:</strong> ${project.collaborator_payment_amount.toLocaleString()}</div>
              )}
              {project.created_at && (
                <div><strong>Started:</strong> {formatDate(project.created_at)}</div>
              )}
              {daysRemaining !== null && (
                <div>
                  <strong>Days Remaining:</strong> {daysRemaining > 0 ? `${daysRemaining} days` : daysRemaining === 0 ? 'Due today' : `${Math.abs(daysRemaining)} days overdue`}
                </div>
              )}
              {project.delivery_timeline && (
                <div><strong>Delivery Timeline:</strong> {project.delivery_timeline}</div>
              )}
            </div>
          </div>

          {/* Invoice Upload Section */}
          {project.assigned_collaborator && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: project.invoice_status === 'approved' 
                ? 'rgba(34, 197, 94, 0.1)' 
                : project.invoice_status === 'pending'
                ? 'rgba(250, 204, 21, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${
                project.invoice_status === 'approved'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : project.invoice_status === 'pending'
                  ? 'rgba(250, 204, 21, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
              borderRadius: '0.6rem'
            }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#0f172a', fontWeight: '600' }}>
                Invoice Status
              </h4>
              {project.invoice_url ? (
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Status:</strong>{' '}
                    <span style={{
                      color: project.invoice_status === 'approved' ? '#22c55e' : project.invoice_status === 'pending' ? '#facc15' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      {project.invoice_status === 'approved' ? '✓ Approved' : project.invoice_status === 'pending' ? '⏳ Pending Approval' : '✗ Rejected'}
                    </span>
                  </div>
                  {project.invoice_uploaded_at && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Uploaded:</strong> {formatDate(project.invoice_uploaded_at)}
                    </div>
                  )}
                  {project.invoice_approved_at && (
                    <div>
                      <strong>Approved:</strong> {formatDate(project.invoice_approved_at)}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('auth_token')
                        if (!token) {
                          alert('You must be logged in to view the invoice.')
                          return
                        }

                        const apiUrl = `${getApiBaseUrl()}/upload/${projectId}/invoice`
                        console.log('Fetching invoice from:', apiUrl)
                        
                        const response = await fetch(apiUrl, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          }
                        })

                        console.log('Response status:', response.status, response.statusText)

                        if (!response.ok) {
                          // Try to get error message from response
                          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
                          try {
                            const errorData = await response.json()
                            errorMessage = errorData.message || errorMessage
                          } catch {
                            // If response is not JSON, use status text
                          }
                          throw new Error(errorMessage)
                        }

                        // Check if response is actually a PDF/blob
                        const contentType = response.headers.get('content-type')
                        console.log('Content-Type:', contentType)
                        
                        if (contentType && contentType.includes('application/json')) {
                          // If it's JSON, it's probably an error
                          const errorData = await response.json()
                          throw new Error(errorData.message || 'Unexpected JSON response')
                        }

                        const blob = await response.blob()
                        console.log('Blob size:', blob.size, 'bytes')
                        
                        if (blob.size === 0) {
                          throw new Error('Invoice file is empty')
                        }

                        const url = window.URL.createObjectURL(blob)
                        const newWindow = window.open(url, '_blank')
                        if (!newWindow) {
                          alert('Please allow pop-ups to view the invoice.')
                        }
                      } catch (error: any) {
                        console.error('Failed to view invoice:', error)
                        alert(`Failed to load invoice: ${error.message || 'Please try again.'}`)
                      }
                    }}
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      color: '#ea580c',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    View Invoice →
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  No invoice uploaded yet. Upload an invoice to start the project.
                </p>
              )}
              {(!project.invoice_url || project.invoice_status === 'rejected') && (
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'rgba(234, 88, 12, 0.1)',
                    color: '#ea580c',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    borderRadius: '0.4rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {project.invoice_status === 'rejected' ? 'Re-upload Invoice' : 'Upload Invoice'}
                </button>
              )}
              {project.invoice_status === 'pending' && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                  Waiting for admin approval...
                </p>
              )}
              {project.invoice_status === 'approved' && (
                <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.5rem', marginBottom: 0, fontWeight: '500' }}>
                  ✓ Invoice approved
                </p>
              )}
            </div>
          )}

          <div>
            <strong style={{ display: 'block', marginBottom: '0.6rem' }}>Quick Actions</strong>
            <button
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
              onClick={handleExportPDF}
            >
              Export PDF
            </button>
            <button
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(234, 88, 12, 0.1)',
                color: '#ea580c',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
              onClick={() => setIsStatusModalOpen(true)}
            >
              Update Progress
            </button>
            <button
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(15, 23, 42, 0.03)',
                color: '#1f2937',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setIsDeliveryModalOpen(true)}
            >
              Request Review
            </button>
          </div>
        </aside>
      </div>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Project Status"
      >
        <UpdateStatusForm
          currentStatus={project.status}
          onSubmit={handleStatusUpdate}
          onCancel={() => setIsStatusModalOpen(false)}
          allowRevision={false}
          allowCompleted={false}
        />
      </Modal>

      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          if (submittingDelivery) return
          setIsDeliveryModalOpen(false)
        }}
        title="Submit Delivery for Review"
      >
        <form onSubmit={handleSubmitDeliveryForReview}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.85rem',
                color: '#e5e7eb',
                fontWeight: '500',
              }}
            >
              Delivery link (Google Drive, Dropbox, etc.) *
            </label>
            <input
              type="url"
              value={deliveryLink}
              onChange={(e) => setDeliveryLink(e.target.value)}
              required
              placeholder="https://drive.google.com/..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(30, 64, 175, 0.6)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#e5e7eb',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1d4ed8'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.6)'
              }}
            />
            <p
              style={{
                margin: '0.5rem 0 0',
                fontSize: '0.75rem',
                color: '#9ca3af',
              }}
            >
              Paste a shareable link to your final files (make sure the client has access).
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.85rem',
                color: '#e5e7eb',
                fontWeight: '500',
              }}
            >
              Additional notes (optional)
            </label>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Add any notes or instructions for the client..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(30, 64, 175, 0.6)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#e5e7eb',
                resize: 'vertical',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1d4ed8'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.6)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={submittingDelivery}
              onClick={() => {
                if (submittingDelivery) return
                setIsDeliveryModalOpen(false)
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#9ca3af',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '999px',
                fontSize: '0.9rem',
                cursor: submittingDelivery ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingDelivery || !deliveryLink.trim()}
              style={{
                padding: '0.75rem 1.8rem',
                background:
                  submittingDelivery || !deliveryLink.trim()
                    ? '#9ca3af'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.9rem',
                cursor:
                  submittingDelivery || !deliveryLink.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                boxShadow:
                  submittingDelivery || !deliveryLink.trim()
                    ? 'none'
                    : '0 8px 20px rgba(234, 88, 12, 0.4)',
              }}
            >
              {submittingDelivery ? 'Submitting...' : 'Send for review'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false)
          setInvoiceFile(null)
        }}
        title="Upload Invoice"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleInvoiceUpload(); }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#e5e7eb', fontWeight: '500' }}>
              Invoice Document (PDF, DOC, DOCX) *
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setInvoiceFile(file)
                }
              }}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#e5e7eb',
                outline: 'none'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)' }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              Upload your invoice document. Maximum file size: 10MB
            </p>
            {invoiceFile && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#22c55e' }}>
                Selected: {invoiceFile.name}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setIsInvoiceModalOpen(false)
                setInvoiceFile(null)
              }}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'transparent',
                color: '#9ca3af',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingInvoice || !invoiceFile}
              style={{
                padding: '0.6rem 1.2rem',
                background: uploadingInvoice
                  ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                  : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                cursor: uploadingInvoice ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                boxShadow: uploadingInvoice ? 'none' : '0 4px 14px rgba(234, 88, 12, 0.4)'
              }}
            >
              {uploadingInvoice ? 'Uploading...' : 'Upload Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
