import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface ImageWithNote {
  id: string
  url: string
  note: string
  file?: File
}

export function ClientBriefingPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [images, setImages] = useState<ImageWithNote[]>([])
  const [overallBrief, setOverallBrief] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Check authentication first
    if (!api.isAuthenticated()) {
      navigate(`/login?redirect=/client/${projectId}/briefing`)
      return
    }
  }, [projectId, navigate])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !projectId) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response: any = await api.uploadImage(projectId, file)
        if (response.success) {
          return {
            id: Date.now().toString() + Math.random(),
            url: response.data.url,
            note: '',
            file,
          }
        }
        throw new Error('Upload failed')
      })

      const uploadedImages = await Promise.all(uploadPromises)
      setImages([...images, ...uploadedImages])
    } catch (error: any) {
      alert(`Failed to upload images: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages(images.filter(img => img.id !== id))
  }

  const handleSubmit = async () => {
    if (!projectId) return

    if (images.length === 0 && !overallBrief.trim()) {
      alert('Please upload at least one image or provide an overall description.')
      return
    }

    setSubmitting(true)
    try {
      const response: any = await api.submitBriefing(projectId, {
        overall_description: overallBrief,
        images: images.map(img => ({
          url: img.url,
          notes: img.note,
        })),
      })

      if (response.success) {
        navigate(`/client/${projectId}/payment`)
      } else {
        alert('Failed to submit briefing. Please try again.')
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Step 2 of 4</div>
        <h1 className="page-title">Project Briefing</h1>
        <p className="page-subtitle">
          Upload reference images, add notes for each, and provide an overall project description.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: '#0f172a' }}>
            Reference Images
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#1d4ed8',
                color: '#ffffff',
                borderRadius: '0.6rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem',
                opacity: uploading ? 0.6 : 1
              }}
            >
              {uploading ? 'Uploading...' : '+ Upload Images'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {images.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    aspectRatio: '1',
                    background: 'white',
                    border: '1px solid rgba(30, 64, 175, 0.3)',
                    borderRadius: '0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.8rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      zIndex: 10
                    }}
                  >
                    ×
                  </button>
                  <div style={{
                    flex: 1,
                    background: '#f3f4f6',
                    borderRadius: '0.4rem',
                    marginBottom: '0.6rem',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={img.url}
                      alt="Reference"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <textarea
                    value={img.note}
                    onChange={(e) => {
                      const updated = images.map(i => i.id === img.id ? { ...i, note: e.target.value } : i)
                      setImages(updated)
                    }}
                    placeholder="Add notes about this image..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '0.5rem',
                      background: 'white',
                      border: '1px solid rgba(30, 64, 175, 0.3)',
                      borderRadius: '0.4rem',
                      color: '#0f172a',
                      fontSize: '0.8rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0f172a', marginTop: '2rem' }}>
            Overall Project Description
          </h3>
          <textarea
            value={overallBrief}
            onChange={(e) => setOverallBrief(e.target.value)}
            placeholder="Describe your vision, goals, target audience, style preferences, and any other important details for this project..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '1rem',
              background: 'white',
              border: '1px solid rgba(30, 64, 175, 0.3)',
              borderRadius: '0.6rem',
              color: '#0f172a',
              fontSize: '0.9rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link 
              to={`/client/${projectId}/service`}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#4b5563',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '999px',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              ← Back
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting || (images.length === 0 && !overallBrief.trim())}
              style={{
                padding: '0.75rem 1.8rem',
                background: (images.length > 0 || overallBrief.trim()) && !submitting ? '#1d4ed8' : 'rgba(29, 78, 216, 0.3)',
                color: (images.length > 0 || overallBrief.trim()) && !submitting ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '999px',
                fontWeight: '500',
                fontSize: '0.9rem',
                cursor: (images.length > 0 || overallBrief.trim()) && !submitting ? 'pointer' : 'not-allowed'
              }}
            >
              {submitting ? 'Submitting...' : 'Continue to Payment →'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
