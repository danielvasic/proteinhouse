/**
 * Mjerenje konverzija — GTM i Meta Pixel, oboje tek nakon privole.
 *
 * ID-evi se čitaju u RUNTIME, iz `window.__PH_MJERENJE__` koji SSR ubaci u
 * <head> (vidi entry-server.jsx). Ranije je stajao `VITE_GTM_ID`, ali Vite
 * takve varijable zapeče u bundle pri buildu — Slaven ih nije mogao mijenjati
 * bez novog deploya. Sada se postavljaju u adminu (Postavke → Mjerenje) i
 * vrijede od sljedećeg učitavanja stranice.
 *
 * `import.meta.env` ostaje kao rezerva da lokalni razvoj i stariji deploy ne
 * ostanu bez mjerenja dok se postavke ne popune.
 */
const CONSENT_KEY = 'ph_cookie_consent'   // 'accepted' | 'declined'

/** Postavke mjerenja za ovu stranicu. Čita se lijeno — SSR ih ubaci u <head>. */
export function mjerenje() {
  const iz = (typeof window !== 'undefined' && window.__PH_MJERENJE__) || {}
  return {
    gtm_id:        iz.gtm_id        || import.meta.env.VITE_GTM_ID   || '',
    ga4_id:        iz.ga4_id        || '',
    meta_pixel_id: iz.meta_pixel_id || '',
    google_ads_id: iz.google_ads_id || '',
    google_ads_label: iz.google_ads_label || '',
  }
}

/** Zadržano zbog postojećih uvoza; sada je runtime vrijednost, ne konstanta. */
export const GTM_ID = ''

export function getConsent() {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}

export function setConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value) } catch { /* private mode */ }
  if (value === 'accepted') loadTags()
}

let gtmLoaded = false
let pixelLoaded = false

export function loadGTM() {
  const { gtm_id } = mjerenje()
  if (gtmLoaded || !gtm_id || typeof window === 'undefined') return
  gtmLoaded = true
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtm_id}`
  document.head.appendChild(script)
}

/**
 * Meta Pixel. Namjerno zaseban od GTM-a: Pixel se može voditi i kroz GTM
 * kontejner, pa ako je ID upisan ovdje A tag postoji i u GTM-u, događaji bi
 * se slali dvaput. Upiši ID ovdje SAMO ako Pixel nije u GTM kontejneru.
 */
export function loadMetaPixel() {
  const { meta_pixel_id } = mjerenje()
  if (pixelLoaded || !meta_pixel_id || typeof window === 'undefined') return
  pixelLoaded = true
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */
  window.fbq('init', meta_pixel_id)
  window.fbq('track', 'PageView')
}

/** Učitaj sve mjerne tagove za koje postoji ID. */
export function loadTags() {
  loadGTM()
  loadMetaPixel()
}

/** Push GA4 e-commerce event u dataLayer (no-op bez consenta/GTM-a). */
export function trackEvent(event, params = {}) {
  if (typeof window === 'undefined' || !window.dataLayer) return
  window.dataLayer.push({ event, ...params })
}

/** Inicijalizacija pri učitavanju stranice — poštuje ranije dat consent. */
export function initAnalytics() {
  if (getConsent() === 'accepted') loadTags()
}
