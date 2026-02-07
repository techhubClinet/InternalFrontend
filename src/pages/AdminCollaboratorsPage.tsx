import { useState, useEffect } from 'react'
import { Modal } from '../components/Modal'
import { api } from '../services/api'

export function AdminCollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<any>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCollaborators()
  }, [])

  const loadCollaborators = async () => {
    try {
      setLoading(true)
      const response: any = await api.getCollaborators()
      if (response.success) {
        setCollaborators(response.data || [])
      }
    } catch (error) {
      console.error('Failed to load collaborators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (collaborator?: any) => {
    if (collaborator) {
      setEditingCollaborator(collaborator)
      setFormData({
        first_name: collaborator.first_name,
        last_name: collaborator.last_name,
        email: collaborator.email || '',
        password: '',
      })
    } else {
      setEditingCollaborator(null)
      setFormData({ first_name: '', last_name: '', email: '', password: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCollaborator(null)
    setFormData({ first_name: '', last_name: '', email: '', password: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || (!editingCollaborator && !formData.password.trim())) {
      alert('Please fill in first name, last name, email and password')
      return
    }

    try {
      setSubmitting(true)
      if (editingCollaborator) {
        // For now, only allow updating names on existing collaborator
        const response: any = await api.updateCollaborator(editingCollaborator._id || editingCollaborator.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
        })
        if (response.success) {
          alert('Collaborator updated successfully!')
          handleCloseModal()
          loadCollaborators()
        } else {
          alert('Failed to update collaborator')
        }
      } else {
        const response: any = await api.createCollaborator(formData)
        if (response.success) {
          alert('Collaborator created successfully!')
          handleCloseModal()
          loadCollaborators()
        } else {
          alert('Failed to create collaborator')
        }
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to save collaborator'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (collaboratorId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response: any = await api.deleteCollaborator(collaboratorId)
      if (response.success) {
        alert('Collaborator deleted successfully!')
        loadCollaborators()
      } else {
        alert(response.message || 'Failed to delete collaborator')
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to delete collaborator'}`)
    }
  }

  const loadCollaboratorProjects = async (collaboratorId: string) => {
    try {
      const response: any = await api.getCollaboratorProjects(collaboratorId)
      if (response.success) {
        const projects = response.data || []
        if (projects.length === 0) {
          alert('This collaborator is not assigned to any projects.')
        } else {
          alert(`${projects.length} project(s) assigned:\n${projects.map((p: any) => `- ${p.name}`).join('\n')}`)
        }
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to load projects'}`)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Admin Dashboard</div>
        <h1 className="page-title">Collaborator Management</h1>
        <p className="page-subtitle">
          Add, edit, and manage your team members. Assign them to projects and track their work.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#0f172a' }}>
              Team Members ({loading ? '...' : collaborators.length})
            </h3>
            <button 
              onClick={() => handleOpenModal()}
              style={{
                padding: '0.6rem 1.2rem',
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontWeight: '500',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              + Add Collaborator
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading collaborators...</p>
            </div>
          ) : collaborators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#6b7280' }}>No collaborators yet. Add your first team member!</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator._id || collaborator.id}
                  style={{
                    padding: '1.5rem',
                    background: 'white',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '0.8rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ 
                      margin: '0 0 0.25rem', 
                      fontSize: '1.1rem', 
                      fontWeight: '600',
                      color: '#0f172a'
                    }}>
                      {collaborator.first_name} {collaborator.last_name}
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem', 
                      color: '#64748b'
                    }}>
                      Team Member
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => loadCollaboratorProjects(collaborator._id || collaborator.id)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      View Projects
                    </button>
                    <button
                      onClick={() => handleOpenModal(collaborator)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(29, 78, 216, 0.1)',
                        color: '#1d4ed8',
                        border: '1px solid rgba(29, 78, 216, 0.3)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(collaborator._id || collaborator.id, `${collaborator.first_name} ${collaborator.last_name}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCollaborator ? 'Edit Collaborator' : 'Add New Collaborator'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#cbd5e1',
              fontWeight: '500'
            }}>
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              placeholder="Enter first name"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(30, 64, 175, 0.4)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#e5e7eb',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1d4ed8'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.4)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#cbd5e1',
              fontWeight: '500'
            }}>
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              placeholder="Enter last name"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(30, 64, 175, 0.4)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#e5e7eb',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1d4ed8'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.4)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#cbd5e1',
              fontWeight: '500'
            }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="Enter collaborator email"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(30, 64, 175, 0.4)',
                borderRadius: '0.6rem',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#e5e7eb',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1d4ed8'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.4)'
              }}
            />
          </div>

          {!editingCollaborator && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.85rem', 
                color: '#cbd5e1',
                fontWeight: '500'
              }}>
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Set collaborator password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(30, 64, 175, 0.4)',
                  borderRadius: '0.6rem',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  color: '#e5e7eb',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1d4ed8'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.4)'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCloseModal}
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
              disabled={
                submitting ||
                !formData.first_name.trim() ||
                !formData.last_name.trim() ||
                !formData.email.trim() ||
                (!editingCollaborator && !formData.password.trim())
              }
              style={{
                padding: '0.75rem 1.8rem',
                background:
                  submitting ||
                  !formData.first_name.trim() ||
                  !formData.last_name.trim() ||
                  !formData.email.trim() ||
                  (!editingCollaborator && !formData.password.trim())
                    ? '#9ca3af'
                    : '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.9rem',
                cursor:
                  submitting ||
                  !formData.first_name.trim() ||
                  !formData.last_name.trim() ||
                  !formData.email.trim() ||
                  (!editingCollaborator && !formData.password.trim())
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: '500',
                boxShadow:
                  submitting ||
                  !formData.first_name.trim() ||
                  !formData.last_name.trim() ||
                  !formData.email.trim() ||
                  (!editingCollaborator && !formData.password.trim())
                    ? 'none'
                    : '0 8px 20px rgba(29, 78, 216, 0.4)'
              }}
            >
              {submitting ? 'Saving...' : editingCollaborator ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

