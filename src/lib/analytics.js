/**
 * GTM / GA4 — učitava se ISKLJUČIVO nakon što korisnik prihvati kolačiće.
 * GTM container ID se postavlja u .env: VITE_GTM_ID=GTM-XXXXXXX
 */
const CONSENT_KEY = 'ph_cookie_consent'   // 'accepted' | 'declined'

export const GTM_ID = import.meta.env.VITE_GTM_ID || ''

export function getConsent() {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}

export function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value) } catch { /* private mode */ }
  if (value === 'accepted') loadGTM()
}

let gtmLoaded = false

export function loadGTM() {
  if (gtmLoaded || !GTM_ID || typeof window === 'undefined') return
  gtmLoaded = true
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)
}

/** Push GA4 e-commerce event u dataLayer (no-op bez consenta/GTM-a). */
export function trackEvent(event, params = {}) {
  if (typeof window === 'undefined' || !window.dataLayer) return
  window.dataLayer.push({ event, ...params })
}

/** Inicijalizacija pri učitavanju stranice — poštuje ranije dat consent. */
export function initAnalytics() {
  if (getConsent() === 'accepted') loadGTM()
}
