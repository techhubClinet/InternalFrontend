import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface AssignCollaboratorFormProps {
  currentCollaboratorId?: string
  currentPaymentAmount?: number
  onSubmit: (collaboratorId: string, paymentAmount: number) => void
  onCancel: () => void
}

export function AssignCollaboratorForm({ 
  currentCollaboratorId, 
  currentPaymentAmount,
  onSubmit, 
  onCancel 
}: AssignCollaboratorFormProps) {
  const [collaboratorId, setCollaboratorId] = useState(currentCollaboratorId || '')
  const [paymentAmount, setPaymentAmount] = useState(currentPaymentAmount?.toString() || '')
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollaborators()
  }, [])

  // Keep internal state in sync if the current collaborator/payment props change
  useEffect(() => {
    setCollaboratorId(currentCollaboratorId || '')
  }, [currentCollaboratorId])

  useEffect(() => {
    setPaymentAmount(currentPaymentAmount != null ? currentPaymentAmount.toString() : '')
  }, [currentPaymentAmount])

  const parseAmountInput = (rawAmount: string): number => {
    const cleaned = rawAmount.replace(/\s/g, '').replace(/\$/g, '')
    if (!cleaned) return NaN

    const hasComma = cleaned.includes(',')
    const hasDot = cleaned.includes('.')

    let normalized = cleaned

    if (hasComma && hasDot) {
      // Use the last separator as decimal and treat the other as thousands.
      const lastComma = cleaned.lastIndexOf(',')
      const lastDot = cleaned.lastIndexOf('.')
      const decimalSeparator = lastComma > lastDot ? ',' : '.'
      const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
      normalized = cleaned.split(thousandsSeparator).join('')
      if (decimalSeparator === ',') {
        normalized = normalized.replace(',', '.')
      }
    } else if (hasComma) {
      // Treat comma as decimal separator when dot is not present.
      normalized = cleaned.replace(',', '.')
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : NaN
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseAmountInput(paymentAmount)

    if (!collaboratorId) {
      alert('Please select a collaborator')
      return
    }
    if (!paymentAmount || Number.isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    onSubmit(collaboratorId, amount)
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
          Select Collaborator *
        </label>
        {loading ? (
          <div style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.9rem' }}>
            Loading collaborators...
          </div>
        ) : (
          <select
            value={collaboratorId}
            onChange={(e) => setCollaboratorId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid rgba(30, 64, 175, 0.4)',
              borderRadius: '0.6rem',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              background: 'transparent',
              color: '#e5e7eb',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#1d4ed8'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(30, 64, 175, 0.4)'
            }}
          >
            <option value="" style={{ background: '#1a1d29', color: '#9ca3af' }}>-- Select Collaborator --</option>
            {collaborators.map((collab) => (
              <option key={collab._id || collab.id} value={collab._id || collab.id} style={{ background: '#1a1d29', color: '#e5e7eb' }}>
                {collab.first_name} {collab.last_name}
              </option>
            ))}
          </select>
        )}
        <p style={{ 
          margin: '0.5rem 0 0', 
          fontSize: '0.75rem', 
          color: '#9ca3af' 
        }}>
          The collaborator will receive access to this project's full briefing and details.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1',
          fontWeight: '500'
        }}>
          Payment Amount for Collaborator *
        </label>
        <input
          type="text"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          required
          placeholder="e.g., 500, 500.5, or 500,5"
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
            const parsed = parseAmountInput(e.currentTarget.value)
            if (!Number.isNaN(parsed) && parsed > 0) {
              setPaymentAmount(parsed.toString())
            }
          }}
        />
        <p style={{ 
          margin: '0.5rem 0 0', 
          fontSize: '0.75rem', 
          color: '#9ca3af' 
        }}>
          This amount is private and will only be visible to the collaborator. They will NOT see the client's payment amount.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
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
          disabled={!collaboratorId || !paymentAmount}
          style={{
            padding: '0.75rem 1.8rem',
            background: !collaboratorId || !paymentAmount ? '#9ca3af' : '#1d4ed8',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            fontSize: '0.9rem',
            cursor: !collaboratorId || !paymentAmount ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            boxShadow: !collaboratorId || !paymentAmount ? 'none' : '0 8px 20px rgba(29, 78, 216, 0.4)'
          }}
        >
          Assign Collaborator
        </button>
      </div>
    </form>
  )
}
