export type CatalogDisplayCurrency = 'usd' | 'eur'

const STORAGE_KEY = 'client_catalog_display_currency'

export function getCatalogDisplayCurrency(): CatalogDisplayCurrency {
  if (typeof window === 'undefined') return 'usd'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'eur' ? 'eur' : 'usd'
}

export function setCatalogDisplayCurrency(c: CatalogDisplayCurrency): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, c)
}
