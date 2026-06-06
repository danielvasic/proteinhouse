/**
 * scripts/fetch-missing-images.mjs
 *
 * Automatically finds and uploads product images for products that
 * have no image_path and no image_url in the database.
 *
 * Strategy (in order):
 *   1. Brand-specific website scraper (ON, MyProtein, Olimp, BioTech, Scitec, BSN...)
 *   2. Bodybuilding.com product search (carries almost every major brand)
 *   3. DuckDuckGo HTML search → first result → og:image
 *
 * Usage:
 *   node scripts/fetch-missing-images.mjs
 *
 * Requires .env.local with:
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...            (for read + storage upload)
 *   SUPABASE_SERVICE_KEY=...              (optional but recommended — bypasses RLS)
 *
 * The service role key is in Supabase Dashboard → Project Settings → API → service_role key.
 */

import { createClient }  from '@supabase/supabase-js'
import axios             from 'axios'
import * as cheerio      from 'cheerio'
import { readFileSync }  from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Load .env.local ─────────────────────────────────────────────────────────
function loadEnv() {
  const envFile = resolve(__dirname, '../.env.local')
  try {
    readFileSync(envFile, 'utf-8').split('\n').forEach((line) => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
      }
    })
  } catch {
    console.error(`❌  Cannot read ${envFile}. Create it with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.`)
    process.exit(1)
  }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const sleep    = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function getHtml(url) {
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
    },
    timeout: 15_000,
    maxRedirects: 5,
  })
  return data
}

/** Extract og:image / twitter:image from HTML string */
function extractOgImage(html, baseUrl) {
  const $ = cheerio.load(html)
  let img =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('meta[name="twitter:image:src"]').attr('content')

  if (!img) {
    // Last resort: biggest product image on the page
    img =
      $('img.product__image, img.product-image, img[class*="product"][src*="product"]').first().attr('src') ||
      $('[class*="product-image"] img, [class*="productImage"] img').first().attr('src')
  }

  if (!img) return null
  if (img.startsWith('//')) img = 'https:' + img
  if (img.startsWith('/') && baseUrl) img = new URL(img, baseUrl).href
  return img
}

// ─── Brand-specific scrapers ──────────────────────────────────────────────────
const BRAND_SITES = {
  'on':         'https://www.optimumnutrition.com',
  'optimum':    'https://www.optimumnutrition.com',
  'myprotein':  'https://www.myprotein.com',
  'olimp':      'https://www.olimpsport.com',
  'biotech':    'https://www.biotechusa.com',
  'scitec':     'https://www.scitecnutrition.com',
  'bsn':        'https://www.bsnsupplements.com',
  'muscletech': 'https://www.muscletech.com',
  'dymatize':   'https://www.dymatize.com',
  'nutrabay':   'https://nutrabay.com',
}

const BRAND_SEARCH_URLS = {
  'optimumnutrition.com': (q) => `https://www.optimumnutrition.com/en-us/search?q=${q}`,
  'myprotein.com':        (q) => `https://www.myprotein.com/search.list?query=${q}`,
  'olimpsport.com':       (q) => `https://www.olimpsport.com/en/catalog/search/?q=${q}`,
  'biotechusa.com':       (q) => `https://www.biotechusa.com/search?type=product&q=${q}`,
  'scitecnutrition.com':  (q) => `https://www.scitecnutrition.com/en/search/?q=${q}`,
}

/** Try to find a product image on the brand's own website */
async function tryBrandSite(brand, title) {
  const key    = brand.toLowerCase().replace(/\s/g, '').replace(/\./g, '')
  const site   = BRAND_SITES[key] || BRAND_SITES[brand.toLowerCase().split(' ')[0]]
  if (!site) return null

  const domain = new URL(site).hostname
  const searchFn = BRAND_SEARCH_URLS[domain]
  if (!searchFn) return null

  try {
    const q    = encodeURIComponent(title.replace(/\d+(g|kg|ml|l)\b/gi, '').trim())
    const html = await getHtml(searchFn(q))
    const $    = cheerio.load(html)

    // Find first product link in search results
    const link =
      $('a[href*="/product"], a[href*="/sports-nutrition/"], a[href*="/products/"]').not('[href*="search"]').first().attr('href') ||
      $('[class*="product"] a, .product-item a, .product-card a').first().attr('href')

    if (!link) return null

    const productUrl = link.startsWith('http') ? link : site + link
    await sleep(1200)
    const productHtml = await getHtml(productUrl)
    return extractOgImage(productHtml, site)
  } catch (e) {
    return null
  }
}

/** Try bodybuilding.com — carries virtually all major supplement brands */
async function tryBodybuilding(brand, title) {
  try {
    const q    = encodeURIComponent(`${brand} ${title}`)
    const html = await getHtml(`https://www.bodybuilding.com/store/search?query=${q}&type=Products`)
    const $    = cheerio.load(html)

    // Search results have product image thumbnails
    const thumbSrc = $('[data-testid="product-image"] img, .product-card__image img, .sc-1wfxr4g-0 img').first().attr('src')
    if (thumbSrc) {
      // Get large version: replace thumbnail size suffix
      return thumbSrc.replace(/\/\d+x\d+\./, '/500x500.').replace(/_\d+x\d+\./, '_500x500.')
    }

    // Click into the first product page
    const firstLink = $('[data-testid="product-name"] a, .product-card__title a, h3 a[href*="/store/"]').first().attr('href')
    if (!firstLink) return null

    await sleep(1200)
    const productUrl = firstLink.startsWith('http') ? firstLink : `https://www.bodybuilding.com${firstLink}`
    const productHtml = await getHtml(productUrl)
    return extractOgImage(productHtml, 'https://www.bodybuilding.com')
  } catch (e) {
    return null
  }
}

/** DuckDuckGo HTML search → first result og:image */
async function tryDuckDuckGo(brand, title) {
  try {
    const q    = encodeURIComponent(`"${brand}" "${title}" supplement product`)
    const html = await getHtml(`https://html.duckduckgo.com/html/?q=${q}`)
    const $    = cheerio.load(html)

    const firstUrl = $('a.result__url, .result__extras__url').first().text().trim()
    if (!firstUrl) return null

    const url = firstUrl.startsWith('http') ? firstUrl : `https://${firstUrl}`

    // Skip retailer/aggregator pages that are unlikely to have the right image
    const skip = ['amazon.', 'ebay.', 'walmart.', 'iherb.', 'youtube.', 'reddit.', 'wikipedia.']
    if (skip.some((s) => url.includes(s))) return null

    await sleep(1500)
    const pageHtml = await getHtml(url)
    return extractOgImage(pageHtml, url)
  } catch (e) {
    return null
  }
}

// ─── Image download + Supabase upload ─────────────────────────────────────────
async function downloadAndUpload(imageUrl, slug) {
  const resp = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': UA },
    timeout: 25_000,
    maxRedirects: 5,
  })

  const ct  = (resp.headers['content-type'] || 'image/jpeg').split(';')[0].trim()
  const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg'
  const path = `${slug}-auto.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, resp.data, { contentType: ct, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return path
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const DRY_RUN = process.argv.includes('--dry-run')
  if (DRY_RUN) console.log('🔎  DRY RUN — will find URLs but NOT upload or update DB\n')

  console.log('🔍  Fetching products without images from Supabase…\n')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, brand, title, slug, image_path, image_url')
    .eq('is_active', true)
    .or('image_path.is.null,image_path.eq.')
    .or('image_url.is.null,image_url.eq.')

  if (error) { console.error('Supabase error:', error.message); process.exit(1) }

  // Keep only those where BOTH image_path and image_url are empty/null
  const missing = (products || []).filter((p) => !p.image_path && !p.image_url)

  if (!missing.length) {
    console.log('✅  All active products have images — nothing to do.')
    return
  }

  console.log(`Found ${missing.length} product(s) without images:\n`)
  missing.forEach((p) => console.log(`  • [${p.brand}] ${p.title}  (${p.slug})`))
  console.log()

  const results = { ok: [], failed: [] }

  for (const product of missing) {
    const { brand, title, slug } = product
    console.log(`\n⚙  [${brand}] ${title}`)

    let imageUrl = null

    // 1. Brand site
    process.stdout.write('   1) Brand site…   ')
    imageUrl = await tryBrandSite(brand, title)
    console.log(imageUrl ? `✓ ${imageUrl.slice(0, 70)}` : '✗ not found')
    if (imageUrl) await sleep(800)

    // 2. Bodybuilding.com
    if (!imageUrl) {
      process.stdout.write('   2) Bodybuilding… ')
      imageUrl = await tryBodybuilding(brand, title)
      console.log(imageUrl ? `✓ ${imageUrl.slice(0, 70)}` : '✗ not found')
      if (imageUrl) await sleep(800)
    }

    // 3. DuckDuckGo
    if (!imageUrl) {
      process.stdout.write('   3) DuckDuckGo…   ')
      imageUrl = await tryDuckDuckGo(brand, title)
      console.log(imageUrl ? `✓ ${imageUrl.slice(0, 70)}` : '✗ not found')
    }

    if (!imageUrl) {
      console.log('   ❌  No image found — needs manual upload')
      results.failed.push(`[${brand}] ${title}`)
      await sleep(1000)
      continue
    }

    if (DRY_RUN) {
      console.log(`   🔎  Would upload: ${imageUrl}`)
      results.ok.push(`[${brand}] ${title}`)
      await sleep(1000)
      continue
    }

    // Download + upload to Supabase Storage
    try {
      process.stdout.write('   📥  Downloading… ')
      const path = await downloadAndUpload(imageUrl, slug)
      console.log(`✓ ${path}`)

      await supabase.from('products').update({ image_path: path }).eq('id', product.id)
      console.log(`   ✅  Saved & DB updated`)
      results.ok.push(`[${brand}] ${title}`)
    } catch (e) {
      console.log(`✗ ${e.message}`)
      results.failed.push(`[${brand}] ${title}`)
    }

    await sleep(2000) // polite delay between products
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅  Success (${results.ok.length}): ${results.ok.join(', ') || '—'}`)
  console.log(`❌  Failed  (${results.failed.length}): ${results.failed.join(', ') || '—'}`)
  if (results.failed.length) {
    console.log('\nProducts that failed need manual image upload in the admin panel.')
  }
}

main().catch((e) => {
  console.error('\n💥 Fatal error:', e.message)
  process.exit(1)
})
