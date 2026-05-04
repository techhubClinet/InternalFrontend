import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { getCatalogDisplayCurrency, setCatalogDisplayCurrency } from '../utils/catalogCurrency'

type Currency = 'usd' | 'eur'

const CURRENCY_SYMBOL: Record<Currency, string> = { usd: '$', eur: '€' }

function parseAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const raw = value.trim()
  if (!raw) return 0
  const cleaned = raw.replace(/[^\d,.-]/g, '')
  const normalized =
    cleaned.includes(',') && !cleaned.includes('.')
      ? cleaned.replace(',', '.')
      : cleaned.replace(/,/g, '')
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ClientPaymentPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [currency, setCurrency] = useState<Currency>('usd')

  useEffect(() => {
    // Check authentication first - payment requires login
    if (!api.isAuthenticated()) {
      navigate(`/login?redirect=/client/${projectId}/payment`)
      return
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId, navigate])

  // When project has no EUR price, keep currency on USD
  useEffect(() => {
    if (!project) return
    const hasEur =
      parseAmount(project.service_price_eur) > 0 ||
      (project.selected_service &&
        typeof project.selected_service === 'object' &&
        parseAmount(project.selected_service.priceEUR) > 0)
    const hasUsd =
      parseAmount(project.service_price) > 0 ||
      (project.selected_service &&
        typeof project.selected_service === 'object' &&
        (parseAmount(project.selected_service.priceUSD) > 0 || parseAmount(project.selected_service.price) > 0))

    // If only one currency is valid, auto-select it.
    if (hasEur && !hasUsd && currency !== 'eur') {
      setCurrency('eur')
      return
    }
    if (currency === 'eur' && !hasEur) {
      setCurrency('usd')
    }
  }, [project, currency])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response: any = await api.getProjectDetails(projectId!)
      if (response.success) {
        const p = response.data.project
        setProject(p)
        const hasEur =
          parseAmount(p.service_price_eur) > 0 ||
          (p.selected_service &&
            typeof p.selected_service === 'object' &&
            parseAmount(p.selected_service.priceEUR) > 0)
        const hasUsd =
          parseAmount(p.service_price) > 0 ||
          (p.selected_service &&
            typeof p.selected_service === 'object' &&
            (parseAmount(p.selected_service.priceUSD) > 0 || parseAmount(p.selected_service.price) > 0))
        if (hasEur && hasUsd) {
          setCurrency(getCatalogDisplayCurrency() === 'eur' ? 'eur' : 'usd')
        } else if (hasEur && !hasUsd) {
          setCurrency('eur')
        } else {
          setCurrency('usd')
        }
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAmount = (cur: Currency) => {
    if (!project) return 0
    if (project.custom_quote_amount != null && project.custom_quote_amount > 0) {
      return project.custom_quote_amount
    }
    if (cur === 'eur') {
      // EUR: only show when explicitly set; never use USD amount as EUR
      const eurDirect = parseAmount(project.service_price_eur)
      if (eurDirect > 0) {
        return eurDirect
      }
      const svc = project.selected_service && typeof project.selected_service === 'object' ? project.selected_service : null
      const eurFromService = svc ? parseAmount(svc.priceEUR) : 0
      if (eurFromService > 0) return eurFromService
      return 0
    }
    // USD
    const usdDirect = parseAmount(project.service_price)
    if (usdDirect > 0) {
      return usdDirect
    }
    const svc = project.selected_service && typeof project.selected_service === 'object' ? project.selected_service : null
    if (svc) {
      const usdFromService = parseAmount(svc.priceUSD)
      if (usdFromService > 0) return usdFromService
      return parseAmount(svc.price)
    }
    return 0
  }

  const getServiceName = () => {
    if (!project) return 'Service'
    if (project.custom_quote_amount != null && project.custom_quote_amount > 0) {
      return 'Custom Quote'
    }
    if (project.service_name) {
      return project.service_name
    }
    if (project.selected_service && typeof project.selected_service === 'object') {
      return project.selected_service.name || 'Service'
    }
    return 'Service'
  }

  const handleCheckout = async () => {
    if (!projectId || !project) return

    const amount = getAmount(currency)
    if (amount <= 0) {
      alert('No payment amount set for this project. Please contact support.')
      return
    }

    setProcessing(true)
    try {
      const description = getServiceName()
      const returnOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
      const response: any = await api.createStripeCheckoutSession(projectId, amount, description, currency, returnOrigin)

      if (response?.success && response?.data?.url) {
        window.location.href = response.data.url
        return
      }
      alert(response?.message || 'Failed to create checkout session. Please try again.')
    } catch (error: any) {
      const msg = error?.message || 'Request failed'
      alert(
        msg.includes('fetch') || msg.includes('Failed to fetch')
          ? 'Cannot reach backend. Is it running?'
          : `Error: ${msg}`
      )
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading payment details...</p>
        </div>
      </section>
    )
  }

  const amount = getAmount(currency)
  const serviceName = getServiceName()
  const symbol = CURRENCY_SYMBOL[currency]
  const amountUsd = project ? getAmount('usd') : 0
  const amountEur = project ? getAmount('eur') : 0
  const hasUsd = amountUsd > 0
  const hasEur = amountEur > 0
  const canChooseCurrency = hasUsd && hasEur
  const showCurrencyChoice = hasUsd || hasEur

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Step 3 of 4</div>
        <h1 className="page-title">Secure Payment</h1>
        <p className="page-subtitle">
          Complete your payment securely via Stripe. Your project will begin once payment is confirmed.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: '#0f172a' }}>
            Payment Summary
          </h3>

          {/* Always ask "How would you like to pay?" when there is an amount – show USD and/or EUR */}
          {showCurrencyChoice && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '0.75rem'
            }}>
              <p style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: '600', color: '#1e40af' }}>
                How would you like to pay?
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#4b5563' }}>
                {canChooseCurrency
                  ? 'Choose your preferred payment currency. You will be charged in the selected currency.'
                  : 'Select the payment currency below.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {hasUsd && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: currency === 'usd' ? 'rgba(29, 78, 216, 0.15)' : 'rgba(248, 250, 252, 0.9)',
                      border: `2px solid ${currency === 'usd' ? '#1d4ed8' : 'rgba(226, 232, 240, 0.9)'}`,
                      borderRadius: '0.6rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setCurrency('usd')
                      setCatalogDisplayCurrency('usd')
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '1rem' }}>Pay in US Dollars (USD)</span>
                    <span style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '1.1rem' }}>${amountUsd.toLocaleString()}</span>
                  </label>
                )}
                {hasEur && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.25rem',
                      background: currency === 'eur' ? 'rgba(29, 78, 216, 0.15)' : 'rgba(248, 250, 252, 0.9)',
                      border: `2px solid ${currency === 'eur' ? '#1d4ed8' : 'rgba(226, 232, 240, 0.9)'}`,
                      borderRadius: '0.6rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setCurrency('eur')
                      setCatalogDisplayCurrency('eur')
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '1rem' }}>Pay in Euros (EUR)</span>
                    <span style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '1.1rem' }}>€{amountEur.toLocaleString()}</span>
                  </label>
                )}
                {!hasEur && hasUsd && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Euro (EUR) is not set for this service. To pay in EUR, ask the project owner to add a Price (EUR) in the catalog.
                  </p>
                )}
              </div>
            </div>
          )}

          <div style={{
            background: 'rgba(30, 64, 175, 0.1)',
            padding: '1.2rem',
            borderRadius: '0.6rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(30, 64, 175, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <span style={{ color: '#6b7280' }}>Service:</span>
              <span style={{ color: '#0f172a', fontWeight: '500' }}>{serviceName}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.8rem',
              borderTop: '1px solid rgba(30, 64, 175, 0.3)',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              <span style={{ color: '#0f172a' }}>Total:</span>
              <span style={{ color: '#1d4ed8' }}>{symbol}{amount.toLocaleString()}</span>
            </div>
            {(showCurrencyChoice) && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                Paying in: {currency === 'eur' ? 'EUR' : 'USD'}
              </div>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
              VAT/tax is calculated at Stripe Checkout from your billing country and added on top of the service price shown above.
            </div>
          </div>

          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            padding: '1rem',
            borderRadius: '0.6rem',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>
              <strong>🔒 Secure Payment:</strong> Your payment is processed securely through Stripe. 
              We never store your card details.
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processing || amount === 0}
            style={{
              width: '100%',
              padding: '1rem',
              background: processing || amount === 0 ? 'rgba(29, 78, 216, 0.3)' : '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.6rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: processing || amount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: processing || amount === 0 ? 'none' : '0 8px 20px rgba(29, 78, 216, 0.4)'
            }}
          >
            {processing ? 'Processing...' : `Pay ${symbol}${amount.toLocaleString()} with Stripe`}
          </button>
        </div>

        <aside className="page-sidebar">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
            What happens next?
          </h3>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#4b5563' }}>
            <div style={{ marginBottom: '0.8rem' }}>
              <strong style={{ color: '#0f172a' }}>1. Payment Processing</strong>
              <p style={{ margin: '0.3rem 0 0', color: '#6b7280' }}>
                You'll be redirected to Stripe's secure checkout page.
              </p>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <strong style={{ color: '#0f172a' }}>2. Confirmation</strong>
              <p style={{ margin: '0.3rem 0 0', color: '#6b7280' }}>
                Once payment is confirmed, you'll receive an email with your dashboard link.
              </p>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>3. Project Start</strong>
              <p style={{ margin: '0.3rem 0 0', color: '#6b7280' }}>
                Your project will be activated and you can track progress in your dashboard.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
