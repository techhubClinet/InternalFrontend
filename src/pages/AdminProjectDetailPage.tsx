import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Modal } from '../components/Modal'
import { UpdateStatusForm } from '../components/UpdateStatusForm'
import { AssignCollaboratorForm } from '../components/AssignCollaboratorForm'
import { api, getApiBaseUrl } from '../services/api'

export function AdminProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [briefing, setBriefing] = useState<any>(null)
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const response: any = await api.getProjectDetails(projectId!)
      if (response.success) {
        setProject(response.data.project)
        setBriefing(response.data.briefing)
        setImages(response.data.images || [])
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (status: string, notes?: string) => {
    if (!projectId) return

    try {
      const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      })
      const responseData: any = await response.json()

      if (responseData.success) {
        await loadProjectData()
        setIsStatusModalOpen(false)
        alert(`Status updated to "${status}"`)
      } else {
        throw new Error(responseData.message || 'Failed to update status')
      }
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`)
    }
  }

  const handleAssignCollaborator = async (collaboratorId: string, paymentAmount: number) => {
    if (!projectId) return

    try {
      const response: any = await api.assignCollaborator(projectId, {
        collaborator_id: collaboratorId,
        payment_amount: paymentAmount
      })

      if (response.success) {
        await loadProjectData()
        setIsCollaboratorModalOpen(false)
        alert('Collaborator assigned successfully!')
      } else {
        throw new Error(response.message || 'Failed to assign collaborator')
      }
    } catch (error: any) {
      alert(`Failed to assign collaborator: ${error.message}`)
    }
  }

  const handleUnassignCollaborator = async () => {
    if (!projectId) return
    if (!confirm('Are you sure you want to unassign this collaborator?')) return

    try {
      const response: any = await api.unassignCollaborator(projectId)
      if (response.success) {
        await loadProjectData()
        alert('Collaborator unassigned successfully!')
      } else {
        throw new Error(response.message || 'Failed to unassign collaborator')
      }
    } catch (error: any) {
      alert(`Failed to unassign collaborator: ${error.message}`)
    }
  }

  const handleApproveInvoice = async () => {
    if (!projectId) return
    if (!confirm('Approve this invoice? The collaborator will be able to start the project.')) return

    try {
      const response: any = await api.approveInvoice(projectId)
      if (response.success) {
        await loadProjectData()
        alert('Invoice approved successfully!')
      } else {
        throw new Error(response.message || 'Failed to approve invoice')
      }
    } catch (error: any) {
      alert(`Failed to approve invoice: ${error.message}`)
    }
  }

  const handleRejectInvoice = async () => {
    if (!projectId) return
    if (!confirm('Reject this invoice? The collaborator will need to upload a new invoice.')) return

    try {
      const response: any = await api.rejectInvoice(projectId)
      if (response.success) {
        await loadProjectData()
        alert('Invoice rejected.')
      } else {
        throw new Error(response.message || 'Failed to reject invoice')
      }
    } catch (error: any) {
      alert(`Failed to reject invoice: ${error.message}`)
    }
  }

  const handlePayCollaborator = async () => {
    if (!projectId) return
    if (!confirm(`Pay collaborator $${project.collaborator_payment_amount?.toLocaleString() || '0'} for this project?`)) return

    try {
      const isMonthly = project.invoice_type === 'monthly' && project.monthly_invoice_id
      const response: any = isMonthly
        ? await api.payCollaboratorForMonthlyInvoice(projectId)
        : await api.payCollaboratorForProject(projectId)
      
      if (response.success) {
        await loadProjectData()
        const message = isMonthly
          ? `Monthly invoice paid successfully! Amount: $${response.data.amount.toLocaleString()} (${response.data.project_count} projects)`
          : `Collaborator paid successfully! Amount: $${response.data.amount.toLocaleString()}`
        alert(message)
      } else {
        throw new Error(response.message || 'Failed to pay collaborator')
      }
    } catch (error: any) {
      alert(`Failed to pay collaborator: ${error.message}`)
    }
  }

  const handleVerifyPayment = async () => {
    if (!projectId) return

    try {
      const response = await fetch(`${getApiBaseUrl()}/payments/${projectId}/verify`, {
        method: 'GET',
      })
      const responseData: any = await response.json()

      if (responseData.success) {
        if (responseData.data.verified) {
          await loadProjectData()
          alert('Payment verified and updated to "Paid"!')
        } else {
          alert(`Payment status: ${responseData.data.payment_status}\n\nIf payment was made, you can manually mark it as paid.`)
        }
      } else {
        // If verification fails, try manual mark as paid
        const confirmMark = confirm('Could not verify payment automatically. Did the client complete payment? Click OK to mark as paid manually.')
        if (confirmMark) {
          const markResponse = await fetch(`${getApiBaseUrl()}/payments/${projectId}/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          const markData: any = await markResponse.json()
          
          if (markData.success) {
            await loadProjectData()
            alert('Payment marked as paid!')
          } else {
            alert(`Failed to mark as paid: ${markData.message}`)
          }
        }
      }
    } catch (error: any) {
      alert(`Failed to verify payment: ${error.message}`)
    }
  }

  const handleExportPDF = () => {
    if (!project) return

    // Create HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Project Briefing - ${project.name}</title>
  <style>
    @page {
      margin: 20mm;
      size: A4;
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #1d4ed8;
      border-bottom: 3px solid #1d4ed8;
      padding-bottom: 10px;
      margin-bottom: 30px;
      text-align: center;
    }
    h2 {
      color: #0f172a;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 18px;
      border-left: 4px solid #1d4ed8;
      padding-left: 10px;
    }
    .info-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      border: 1px solid #e5e7eb;
    }
    .info-item {
      margin: 10px 0;
      font-size: 14px;
    }
    .label {
      font-weight: bold;
      color: #4b5563;
      display: inline-block;
      min-width: 140px;
    }
    .description {
      background: #ffffff;
      padding: 20px;
      border-left: 4px solid #1d4ed8;
      margin: 20px 0;
      white-space: pre-wrap;
      line-height: 1.8;
      border-radius: 4px;
    }
    .image-item {
      margin: 20px 0;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .image-number {
      font-weight: bold;
      color: #1d4ed8;
      margin-bottom: 8px;
    }
    .image-url {
      color: #1d4ed8;
      word-break: break-all;
      font-size: 12px;
      margin: 5px 0;
    }
    .image-notes {
      margin-top: 8px;
      font-style: italic;
      color: #6b7280;
      font-size: 13px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <h1>Project Briefing</h1>
  
  <div class="info-section">
    <h2>Project Information</h2>
    <div class="info-item"><span class="label">Project:</span> ${(project?.name || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="info-item"><span class="label">Client:</span> ${(project?.client_name || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="info-item"><span class="label">Status:</span> ${(project?.status || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="info-item"><span class="label">Payment Status:</span> ${(project?.payment_status || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    ${project?.client_email ? `<div class="info-item"><span class="label">Client Email:</span> ${project.client_email.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
    ${project?.deadline ? `<div class="info-item"><span class="label">Deadline:</span> ${new Date(project.deadline).toLocaleDateString()}</div>` : ''}
  </div>

  ${briefing?.overall_description ? `
  <h2>Overall Description</h2>
  <div class="description">${briefing.overall_description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  ` : ''}

  ${images.length > 0 ? `
  <h2>Reference Images (${images.length})</h2>
  ${images.map((img: any, idx: number) => `
    <div class="image-item">
      <div class="image-number">Image ${idx + 1}</div>
      ${img.url ? `<div class="image-url">URL: ${img.url.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
      ${img.notes ? `<div class="image-notes">Notes: ${img.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : '<div class="image-notes">Notes: No notes provided</div>'}
    </div>
  `).join('')}
  ` : ''}
</body>
</html>
    `.trim()

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Create a hidden iframe to load the HTML
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.src = url
    
    document.body.appendChild(iframe)
    
    // Wait for iframe to load, then trigger print
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.print()
          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(url)
          }, 1000)
        } catch (error) {
          // If print fails, open in new window as fallback
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

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading project...</p>
        </div>
      </section>
    )
  }

  if (!project) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Project Not Found</h2>
          <button onClick={() => navigate('/admin/projects')} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Back to Projects
          </button>
        </div>
      </section>
    )
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
      review: 'Review',
      revision: 'Revision Requested',
      completed: 'Completed',
    }
    return labels[status] || status
  }

  const formatClientAmount = () => {
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

  const formatCollaboratorAmount = () => {
    if (project.collaborator_payment_amount) {
      return `$${project.collaborator_payment_amount.toLocaleString()}`
    }
    return 'Not set'
  }

  const getCollaboratorName = () => {
    if (project.assigned_collaborator) {
      if (typeof project.assigned_collaborator === 'object') {
        return `${project.assigned_collaborator.first_name} ${project.assigned_collaborator.last_name}`
      }
      return project.assigned_collaborator
    }
    return null
  }

  return (
    <section className="page">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div className="page-kicker">Project #{projectId?.slice(0, 8)}</div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-subtitle">
              Client: {project.client_name} · Started {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              onClick={handleExportPDF}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '999px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              📄 Export PDF
            </button>
            <button 
              onClick={() => setIsStatusModalOpen(true)}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Update Status
            </button>
          </div>
        </div>
      </header>

      <div className="page-body">
        <div className="page-panel">
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '0.4rem 0.8rem',
              background: `${getStatusColor(project.status)}20`,
              border: `1px solid ${getStatusColor(project.status)}50`,
              borderRadius: '999px',
              fontSize: '0.8rem',
              color: getStatusColor(project.status),
              fontWeight: '500'
            }}>
              Status: {getStatusLabel(project.status)}
            </span>
            <span style={{
              padding: '0.4rem 0.8rem',
              background: project.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(250, 204, 21, 0.2)',
              border: project.payment_status === 'paid' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(250, 204, 21, 0.4)',
              borderRadius: '999px',
              fontSize: '0.8rem',
              color: project.payment_status === 'paid' ? '#22c55e' : '#facc15',
              fontWeight: '500'
            }}>
              Client Payment: {project.payment_status === 'paid' ? `Paid (${formatClientAmount()})` : 'Pending'}
            </span>
            {project.payment_status === 'pending' && (
              <button
                onClick={handleVerifyPayment}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  color: '#22c55e',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                title="Verify payment status from Stripe"
              >
                ✓ Verify Payment
              </button>
            )}
            <span style={{
              padding: '0.4rem 0.8rem',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '999px',
              fontSize: '0.8rem',
              color: '#3b82f6',
              fontWeight: '500'
            }}>
              Collaborator: {getCollaboratorName() || 'Unassigned'}
              {project.assigned_collaborator && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  (Payment: {formatCollaboratorAmount()})
                </span>
              )}
            </span>
          </div>

          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
            Client Briefing
          </h3>

          {briefing && briefing.overall_description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: '#4b5563' }}>
                Overall Description
              </h4>
              <p style={{ 
                margin: 0, 
                padding: '1rem', 
                background: '#f9fafb',
                border: '1px solid rgba(30, 64, 175, 0.2)',
                borderRadius: '0.6rem',
                color: '#0f172a',
                lineHeight: '1.6',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap'
              }}>
                {briefing.overall_description}
              </p>
            </div>
          )}

          {images.length > 0 && (
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
                {images.map((img: any) => (
                  <div
                    key={img._id || img.id}
                    style={{
                      aspectRatio: '1',
                      background: '#f3f4f6',
                      border: '1px solid rgba(30, 64, 175, 0.3)',
                      borderRadius: '0.6rem',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={img.url}
                      alt="Reference"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {img.notes && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        lineHeight: '1.4'
                      }}>
                        {img.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {(!briefing || (!briefing.overall_description && images.length === 0)) && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f9fafb',
              border: '1px dashed rgba(30, 64, 175, 0.3)',
              borderRadius: '0.6rem',
              color: '#6b7280'
            }}>
              <p>No briefing submitted yet.</p>
            </div>
          )}
        </div>

        <aside className="page-sidebar">
          <div style={{ marginBottom: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.6rem' }}>Project Details</strong>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#4b5563' }}>
              <div><strong>Service:</strong> {
                project.selected_service && typeof project.selected_service === 'object'
                  ? project.selected_service.name
                  : project.custom_quote_amount
                  ? 'Custom Quote'
                  : 'Not selected'
              }</div>
              <div><strong>Client Amount:</strong> {formatClientAmount()}</div>
              {project.assigned_collaborator && (
                <div><strong>Collaborator Payment:</strong> {formatCollaboratorAmount()}</div>
              )}
              <div><strong>Client Email:</strong> {project.client_email || 'N/A'}</div>
              {project.deadline && (
                <div><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          <div>
            <strong style={{ display: 'block', marginBottom: '0.6rem' }}>Assign Collaborator</strong>
            <button
              onClick={() => setIsCollaboratorModalOpen(true)}
              style={{
                width: '100%',
                padding: '0.6rem',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '0.4rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {getCollaboratorName() || 'Assign Collaborator'} →
            </button>
          </div>

          {/* Invoice Approval Section */}
          {project.assigned_collaborator && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: project.invoice_status === 'approved'
                ? 'rgba(34, 197, 94, 0.1)'
                : project.invoice_status === 'pending'
                ? 'rgba(250, 204, 21, 0.1)'
                : project.invoice_status === 'rejected'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${
                project.invoice_status === 'approved'
                  ? 'rgba(34, 197, 94, 0.3)'
                  : project.invoice_status === 'pending'
                  ? 'rgba(250, 204, 21, 0.3)'
                  : project.invoice_status === 'rejected'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(148, 163, 184, 0.3)'
              }`,
              borderRadius: '0.6rem'
            }}>
              <strong style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem' }}>Collaborator Invoice</strong>
              {project.invoice_url ? (
                <>
                  <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Status:</strong>{' '}
                      <span style={{
                        color: project.invoice_status === 'approved' ? '#22c55e' : project.invoice_status === 'pending' ? '#facc15' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {project.invoice_status === 'approved' ? '✓ Approved' : project.invoice_status === 'pending' ? '⏳ Pending' : '✗ Rejected'}
                      </span>
                    </div>
                    {project.invoice_uploaded_at && (
                      <div style={{ marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                        Uploaded: {new Date(project.invoice_uploaded_at).toLocaleDateString()}
                      </div>
                    )}
                    {project.invoice_approved_at && (
                      <div style={{ fontSize: '0.8rem' }}>
                        Approved: {new Date(project.invoice_approved_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
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
                        console.log('Response headers:', Object.fromEntries(response.headers.entries()))

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
                      display: 'block',
                      width: '100%',
                      marginBottom: '0.75rem',
                      padding: '0.5rem',
                      background: 'rgba(234, 88, 12, 0.1)',
                      color: '#ea580c',
                      textDecoration: 'none',
                      borderRadius: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      textAlign: 'center',
                      border: '1px solid rgba(234, 88, 12, 0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    📄 View Invoice
                  </button>
                  {project.invoice_status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleApproveInvoice}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: '#22c55e',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '0.4rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={handleRejectInvoice}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '0.4rem',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                  {project.invoice_status === 'approved' && !project.collaborator_paid && (
                    <button
                      onClick={handlePayCollaborator}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '0.75rem',
                        padding: '0.6rem',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '0.4rem',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      💰 Pay Collaborator (${project.collaborator_payment_amount?.toLocaleString() || '0'})
                    </button>
                  )}
                  {project.collaborator_paid && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '0.4rem',
                      fontSize: '0.85rem',
                      color: '#22c55e',
                      textAlign: 'center',
                      fontWeight: '500'
                    }}>
                      ✓ Paid {project.collaborator_paid_at ? `on ${new Date(project.collaborator_paid_at).toLocaleDateString()}` : ''}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  No invoice uploaded yet. Waiting for collaborator to upload invoice.
                </p>
              )}
            </div>
          )}
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
        />
      </Modal>

      <Modal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        title="Assign Collaborator"
      >
        <AssignCollaboratorForm
          currentCollaboratorId={typeof project.assigned_collaborator === 'object' 
            ? project.assigned_collaborator._id 
            : project.assigned_collaborator}
          currentPaymentAmount={project.collaborator_payment_amount}
          onSubmit={handleAssignCollaborator}
          onCancel={() => setIsCollaboratorModalOpen(false)}
        />
        {project.assigned_collaborator && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <button
              onClick={handleUnassignCollaborator}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Unassign Collaborator
            </button>
          </div>
        )}
      </Modal>
    </section>
  )
}
