import { useState } from 'react'

interface UpdateStatusFormProps {
  currentStatus: string
  onSubmit: (status: string, notes?: string) => void
  onCancel: () => void
}

export function UpdateStatusForm({ currentStatus, onSubmit, onCancel }: UpdateStatusFormProps) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#64748b' },
    { value: 'in_progress', label: 'In Progress', color: '#1d4ed8' },
    { value: 'review', label: 'Review', color: '#facc15' },
    { value: 'revision', label: 'Revision', color: '#f97316' },
    { value: 'completed', label: 'Completed', color: '#22c55e' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(status, notes)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1',
          fontWeight: '500'
        }}>
          Project Status *
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1',
          fontWeight: '500'
        }}>
          Status Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this status update..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(30, 64, 175, 0.4)',
            borderRadius: '0.6rem',
            color: '#e5e7eb',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            resize: 'vertical'
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
          Update Status
        </button>
      </div>
    </form>
  )
}


