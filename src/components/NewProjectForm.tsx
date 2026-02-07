import { useState } from 'react'

interface NewProjectFormProps {
  onSubmit: (data: {
    name: string
    client_email: string
    project_type: 'simple' | 'custom'
    service: string
    service_price: string
    amount: string
    deadline: string
  }) => void
  onCancel: () => void
}

export function NewProjectForm({ onSubmit, onCancel }: NewProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    client_email: '',
    project_type: 'simple' as 'simple' | 'custom',
    service: '',
    service_price: '',
    amount: '',
    deadline: ''
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For simple projects: need name and service (no email needed)
    // For custom projects: need name and client_email
    if (formData.name) {
      if (formData.project_type === 'simple' && formData.service && formData.service_price) {
        onSubmit(formData)
        setFormData({ name: '', client_email: '', project_type: 'simple', service: '', service_price: '', amount: '', deadline: '' })
      } else if (formData.project_type === 'custom' && formData.client_email) {
        onSubmit(formData)
        setFormData({ name: '', client_email: '', project_type: 'simple', service: '', service_price: '', amount: '', deadline: '' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1',
          fontWeight: '500'
        }}>
          Project Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(30, 64, 175, 0.4)',
            borderRadius: '0.6rem',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'inherit'
          }}
          placeholder="e.g., Brand Identity Redesign"
        />
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1',
          fontWeight: '500'
        }}>
          Project Type *
        </label>
        <select
          value={formData.project_type}
          onChange={(e) => {
            const newType = e.target.value as 'simple' | 'custom'
            setFormData({ 
              ...formData, 
              project_type: newType, 
              service: '', 
              service_price: '',
              amount: '',
              client_email: newType === 'simple' ? '' : formData.client_email // Clear email when switching to simple
            })
          }}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(30, 64, 175, 0.4)',
            borderRadius: '0.6rem',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        >
          <option value="simple">Simple Project (Predefined Services)</option>
          <option value="custom">Custom Project (Custom Quote Needed)</option>
        </select>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
          {formData.project_type === 'simple' 
            ? 'Client can choose from predefined services - accessible to everyone via link' 
            : 'Client will request a custom quote - requires client email'}
        </p>
      </div>

      {formData.project_type === 'custom' && (
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '0.85rem', 
            color: '#cbd5e1',
            fontWeight: '500'
          }}>
            Client Email *
          </label>
          <input
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(30, 64, 175, 0.4)',
              borderRadius: '0.6rem',
              color: '#e5e7eb',
              fontSize: '0.9rem',
              fontFamily: 'inherit'
            }}
            placeholder="client@example.com"
          />
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            Required for custom projects to generate unique client access link
          </p>
        </div>
      )}

      {formData.project_type === 'simple' && (
        <>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#cbd5e1',
              fontWeight: '500'
            }}>
              Service Type *
            </label>
            <input
              type="text"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              required
              placeholder="Enter service name (e.g., Brand Identity Package)"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(30, 64, 175, 0.4)',
                borderRadius: '0.6rem',
                color: '#e5e7eb',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              Type the name of the service you want to offer
            </p>
          </div>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.85rem', 
              color: '#cbd5e1',
              fontWeight: '500'
            }}>
              Service Price *
            </label>
            <input
              type="text"
              value={formData.service_price}
              onChange={(e) => setFormData({ ...formData, service_price: e.target.value })}
              required
              placeholder="e.g., 4500 or $4,500"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(30, 64, 175, 0.4)',
                borderRadius: '0.6rem',
                color: '#e5e7eb',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              Enter the price for this service (accessible to anyone via link)
            </p>
          </div>
        </>
      )}

      {formData.project_type === 'custom' && (
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '0.85rem', 
            color: '#cbd5e1',
            fontWeight: '500'
          }}>
            Initial Quote Amount (Optional)
          </label>
          <input
            type="text"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(30, 64, 175, 0.4)',
            borderRadius: '0.6rem',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'inherit'
          }}
          placeholder="e.g., $4,500"
        />
        <p style={{ 
          margin: '0.5rem 0 0', 
          fontSize: '0.75rem', 
          color: '#9ca3af' 
        }}>
          Optional initial quote amount. Client can request a custom quote if needed.
        </p>
      </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1',
          fontWeight: '500'
        }}>
          Deadline (Optional)
        </label>
        <input
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(30, 64, 175, 0.4)',
            borderRadius: '0.6rem',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#9ca3af',
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
          style={{
            padding: '0.75rem 1.8rem',
            background: '#1d4ed8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: '500',
            boxShadow: '0 8px 20px rgba(29, 78, 216, 0.4)'
          }}
        >
          Create Project
        </button>
      </div>
    </form>
  )
}
