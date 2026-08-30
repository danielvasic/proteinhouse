import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider } from 'react-helmet-async'
import { CartProvider } from './store/CartContext'
import App from './App'
import './globals.css'
import './theme.css'
import { supabase, getProductImageUrl } from './lib/supabase'

const SITE_URL = 'https://proteinhouse.ba'   // canonical uvijek na glavnu domenu
// OG slika se gradi iz domene sa koje je stranica zatrazena (origin) —
// radi na deploy previewu, new.proteinhouse.ba i produkciji bez izmjena.
const ogDefaultImg = (origin) => `${origin || 'https://new.proteinhouse.ba'}/og-image.png`

// ─── Pre-fetch page-specific meta from Supabase ────────────────────────────
// renderToString is synchronous — useProduct/useCategories hooks can't fetch
// data during render. We resolve what we need BEFORE calling renderToString
// so that crawlers (Google, Twitter, Facebook, LinkedIn) get correct tags.

async function prefetchMeta(url, origin) {
  const path = url.split('?')[0].split('#')[0]

  // ── /proizvod/:slug ────────────────────────────────────────────────────
  const productMatch = path.match(/^\/proizvod\/([^/]+)$/)
  if (productMatch) {
    const { data } = await supabase
      .from('products')
      .select('brand, title, description, price, image_path, image_url, slug')
      .eq('slug', productMatch[1])
      .eq('is_active', true)
      .maybeSingle()

    if (data) {
      const name    = `${data.brand} ${data.title}`
      const title   = `${name} — ProteinHouse`
      const rawDesc = data.description
        || `Kupite ${name} na ProteinHouse. Originalni suplement, brza dostava po BiH.`
      const description = rawDesc.length > 155 ? rawDesc.slice(0, 152) + '…' : rawDesc
      const image   = getProductImageUrl(data) || ogDefaultImg(origin)
      const canonical = `${SITE_URL}${path}`

      return {
        title,
        description,
        image,
        canonical,
        schema: {
          '@context': 'https://schema.org/',
          '@type':    'Product',
          name:       data.title,
          brand:      { '@type': 'Brand', name: data.brand },
          description: data.description || '',
          image,
          offers: {
            '@type':        'Offer',
            price:          data.price,
            priceCurrency:  'BAM',
            availability:   'https://schema.org/InStock',
          },
        },
      }
    }
  }

  // ── /kategorija/:slug ──────────────────────────────────────────────────
  const catMatch = path.match(/^\/kategorija\/([^/]+)$/)
  if (catMatch) {
    const { data } = await supabase
      .from('categories')
      .select('label, description')
      .eq('slug', catMatch[1])
      .maybeSingle()

    if (data) {
      const title       = `${data.label} — ProteinHouse`
      const description = data.description
        || `Pregledajte sve ${data.label} proizvode na ProteinHouse. Originalni suplementi, brza dostava po BiH.`
      return { title, description, canonical: `${SITE_URL}${path}` }
    }
  }

  return null // fall through to Helmet (works for static pages)
}

// ─── Postavke mjerenja (GTM, Pixel…) ───────────────────────────────────────
// Ubacuju se u <head> kao globalna varijabla da ih analytics.js pročita u
// runtime. Ranije su bile VITE_ varijable koje Vite zapeče u bundle, pa ih
// klijent nije mogao promijeniti bez novog builda.
//
// SAMO javni ID-evi. Tajne (Meta CAPI token i sl.) žive u tablici ad_secrets
// koju anonimni ključ ne smije čitati — ovdje bi završile u izvoru stranice.
const JAVNI_KLJUCEVI = {
  mjerenje_gtm_id:           'gtm_id',
  mjerenje_ga4_id:           'ga4_id',
  mjerenje_meta_pixel_id:    'meta_pixel_id',
  mjerenje_google_ads_id:    'google_ads_id',
  mjerenje_google_ads_label: 'google_ads_label',
}

async function fetchMjerenje() {
  const { data } = await supabase
    .from('site_content')
    .select('key, value')
    .in('key', Object.keys(JAVNI_KLJUCEVI))
  const out = {}
  for (const red of data ?? []) {
    const polje = JAVNI_KLJUCEVI[red.key]
    const vrijednost = String(red.value?.text ?? red.value ?? '').trim()
    if (polje && vrijednost) out[polje] = vrijednost
  }
  return out
}

/**
 * Serijalizacija u <script>. JSON.stringify nije dovoljan: vrijednost koja
 * sadrži "</script>" bi zatvorila tag i pretvorila ostatak u HTML. Zato se
 * "<" pobjegne u \u003c — JSON to i dalje čita ispravno.
 */
function mjerenjeScript(cfg) {
  if (!Object.keys(cfg).length) return ''
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c')
  return `<script>window.__PH_MJERENJE__=${json}</script>`
}

// ─── Build raw <head> HTML from meta object ────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHead({ title, description, image, canonical, schema }, origin) {
  const img = image || ogDefaultImg(origin)
  const tags = [
    `<title data-rh="true">${esc(title)}</title>`,
    `<meta data-rh="true" name="description"         content="${esc(description)}" />`,
    `<meta data-rh="true" property="og:title"        content="${esc(title)}" />`,
    `<meta data-rh="true" property="og:description"  content="${esc(description)}" />`,
    `<meta data-rh="true" property="og:image"        content="${esc(img)}" />`,
    `<meta data-rh="true" property="og:type"         content="website" />`,
    `<meta data-rh="true" name="twitter:card"        content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title"       content="${esc(title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${esc(description)}" />`,
    `<meta data-rh="true" name="twitter:image"       content="${esc(img)}" />`,
  ]
  if (canonical) {
    tags.push(`<link data-rh="true" rel="canonical"          href="${esc(canonical)}" />`)
    tags.push(`<meta data-rh="true" property="og:url"        content="${esc(canonical)}" />`)
  }
  if (schema) {
    tags.push(`<script data-rh="true" type="application/ld+json">${JSON.stringify(schema)}</script>`)
  }
  return tags.join('\n    ')
}

// ─── Main SSR render ───────────────────────────────────────────────────────
export async function render(url, origin) {
  const helmetContext = {}

  // Pre-fetch before renderToString (data hooks can't run async during render)
  // Postavke mjerenja idu usporedo — neovisne su o stranici, pa ne produžuju
  // odgovor; ako upit padne, stranica se svejedno renderira bez mjerenja.
  const [pageMeta, mjerenjeCfg] = await Promise.all([
    prefetchMeta(url, origin).catch(() => null),
    fetchMjerenje().catch(() => ({})),
  ])

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <CartProvider>
          <App />
        </CartProvider>
      </StaticRouter>
    </HelmetProvider>
  )

  let head
  if (pageMeta) {
    // Dynamic page: use pre-fetched meta (Helmet had no data during renderToString)
    head = buildHead(pageMeta, origin)
  } else {
    // Static page (About, Contact, Blog…): Helmet collected tags synchronously
    const { helmet } = helmetContext
    head = helmet
      ? [
          helmet.title.toString(),
          helmet.meta.toString(),
          helmet.link.toString(),
          helmet.script.toString(),
        ].join('')
      : ''
  }

  return { html, head: head + mjerenjeScript(mjerenjeCfg) }
}
