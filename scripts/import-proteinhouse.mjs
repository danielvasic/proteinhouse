/**
 * scripts/import-proteinhouse.mjs
 *
 * Uvozi testni set proizvoda sa starog sajta (proteinhouse.ba / weberp API)
 * u Supabase: ~20 proizvoda kroz vise kategorija, varijante okusa spojene
 * u jedan proizvod, slike SKINUTE s weberp-api.com i UPLOADANE u Supabase
 * storage (bucket: product-images) — nista se ne hotlinka.
 *
 * Usage:
 *   node scripts/import-proteinhouse.mjs --dry-run     # samo ispis, bez pisanja
 *   node scripts/import-proteinhouse.mjs               # upsert + upload slika
 *
 * Requires .env.local:
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_KEY=...   (service_role — potreban za pisanje mimo RLS-a)
 */

import { createClient }     from '@supabase/supabase-js'
import { readFileSync }     from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath }    from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry-run')

// ── .env.local ───────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    readFileSync(resolve(__dirname, '../.env.local'), 'utf-8').split('\n').forEach((line) => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
    })
  } catch { /* dry-run moze i bez env-a */ }
}
loadEnv()

const API   = 'https://proteinhouse-api.work/api/Artikli/GetAllProducts'
const IMG   = 'https://weberp-api.com/images/'

// ── Kurirani izbor: ERP sifre sa starog sajta (25 artikala → ~20 proizvoda) ──
const SIFRE = [
  '4472', '4474',        // ON Gold Whey 30 g (2 okusa)
  '4806',                // OstroVit Whey 700 g
  '4185', '4000',        // Mutant Whey 908 g (2 okusa)
  '1325',                // BSN Syntha-6 2270 g
  '4662', '4710',        // ON Creatine 187 g / 247,5 g fruit punch
  '1713',                // OstroVit Creatine 300 g orange
  '4272', '4004',        // ON Serious Mass 2730 g (2 okusa)
  '2089',                // OstroVit Dextrose 500 g
  '4642',                // Mutant Madness 30 serv
  '1091', '1092',        // BSN NO Xplode 390 g / 650 g
  '4364', '4365',        // ON Amino Energy 270 g (2 okusa)
  '1709',                // OstroVit BCAA 8:1:1 200 g
  '4475', '4512',        // ON Optimen / Optiwomen
  '1704',                // OstroVit Tyrosine 210 g
  '4647', '4649',        // Body&Fit Clean Protein Bar (2 okusa)
  '1726', '1734',        // OstroVit CLA+Green Tea / Fat Burner for Women
]

// weberp grupa → nas category slug
const CAT_MAP = {
  'PROTEINI':               'proteini',
  'KREATINI':               'kreatini',
  'GAINERI':                'gaineri',
  'PREWORKOUT':             'pre-workout',
  'AMINOKISELINE':          'aminokiseline',
  'VITAMINI I MINERALI':    'vitamini',
  'SAGORJEVAČI MASTI':      'mrsavljenje',
  'POKRETAČI HORMONA':      'vitamini',
  'PROTEINSKE ČOKOLADICE':  'hrana',
  'ZDRAVA HRANA':           'hrana',
  'DIJETALNE NAMIRNICE':    'hrana',
  'SPORTSKA OPREMA':        'oprema',
}

// prefiks u nazivu artikla → brend (da se brend ne ponavlja u nazivu)
const BRAND_PREFIX = ['ON', 'OST', 'BSN', 'BF', 'SW', 'MUTANT', 'PG', 'AN', 'MT']

const UNIT_RE = /^(g|kg|ml|l|caps|tabs|serv|servings|softgels)$/i

/** "ON GOLD WHEY 30 g double rich chocolate" → { base: "Gold Whey 30g", flavor: "Double Rich Chocolate" } */
function parseName(naziv, brand) {
  let tokens = naziv.trim().split(/\s+/)
  if (BRAND_PREFIX.includes(tokens[0]) || tokens[0].toLowerCase() === brand.split(' ')[0].toLowerCase()) {
    tokens = tokens.slice(1)
  }
  // nadji zadnji unit token — sve poslije njega je okus
  let unitIdx = -1
  for (let i = tokens.length - 1; i > 0; i--) {
    if (UNIT_RE.test(tokens[i]) && /^[\d.,]+$/.test(tokens[i - 1] ?? '')) { unitIdx = i; break }
    if (UNIT_RE.test(tokens[i]) && !UNIT_RE.test(tokens[i - 1] ?? '')) { unitIdx = i }
  }
  let base = tokens, flavor = null
  if (unitIdx >= 0 && unitIdx < tokens.length - 1) {
    base   = tokens.slice(0, unitIdx + 1)
    flavor = tokens.slice(unitIdx + 1).join(' ')
  }
  // "30 g" → "30g", Title Case (akronimi ostaju velikim slovima)
  const ACRONYMS = new Set(['BCAA', 'EAA', 'CLA', 'ZMA', 'HMB', 'NO', 'L-CARNITINE'])
  const titleCase = (s) => s.replace(/\S+/g, (w) => {
    if (ACRONYMS.has(w.toUpperCase().replace(/[^A-Z-]/g, ''))) return w.toUpperCase()
    return /^[\d.,]/.test(w) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()
  })
  return {
    base:   titleCase(base.join(' ').replace(/([\d.,]+)\s+(g|kg|ml|l)\b/gi, '$1$2')),
    flavor: flavor ? titleCase(flavor) : null,
  }
}

const slugify = (s) => s.toLowerCase()
  .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const stripHtml = (html) => (html || '')
  .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\n{3,}/g, '\n\n').trim()

/** Izvuci "Upotreba: ..." dio iz opisa u zasebno polje */
function splitUsage(text) {
  const m = text.match(/upotreba\s*:?\s*([\s\S]+)$/i)
  if (!m) return { description: text, usage: null }
  return {
    description: text.slice(0, m.index).trim(),
    usage:       m[1].trim() || null,
  }
}

async function main() {
  console.log('⬇  Dohvatam artikle sa starog sajta…')
  const res = await fetch(API, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const all = await res.json()
  const raw = SIFRE.map((s) => all.find((x) => x.sifraArtikla === s)).filter(Boolean)
  console.log(`   ${raw.length}/${SIFRE.length} artikala pronadjeno`)

  // ── Spoji okuse istog proizvoda u jedan (flavors + stock_variants) ────────
  const groups = new Map()
  for (const a of raw) {
    const brand = a.nazivProizvodjaca || 'ProteinHouse'
    const { base, flavor } = parseName(a.nazivArtikla, brand)
    const key = `${brand}|${base}`
    if (!groups.has(key)) groups.set(key, { brand, base, variants: [] })
    groups.get(key).variants.push({ ...a, flavor })
  }

  const products = []
  let sort = 1
  for (const { brand, base, variants } of groups.values()) {
    const first    = variants[0]
    const price    = first.cijenaHH > 0 && first.cijenaHH < first.cijena ? first.cijenaHH : first.cijena
    const oldPrice = first.cijenaHH > 0 && first.cijenaHH < first.cijena ? first.cijena : null
    const badge    = oldPrice ? `-${Math.round((1 - price / oldPrice) * 100)}%` : null
    const flavors  = variants.map((v) => v.flavor).filter(Boolean)
    const { description, usage } = splitUsage(stripHtml(first.opisArtikla))
    const tags = []
    if (variants.some((v) => v.isTopProizvod)) tags.push('bestseller')
    if (variants.some((v) => v.isNoviProizvod)) tags.push('new')

    const stockVariants = {}
    if (flavors.length > 0) {
      variants.forEach((v) => { if (v.flavor) stockVariants[v.flavor] = { qty: 25, sku: v.sifraArtikla } })
    }

    products.push({
      brand,
      title:          base,
      slug:           slugify(`${brand} ${base}`),
      price,
      old_price:      oldPrice,
      badge,
      category:       CAT_MAP[first.nazivGrupe] || 'proteini',
      description,
      usage_instructions: usage,
      flavors,
      sizes:          [],
      stock:          flavors.length > 0 ? 0 : 25,
      stock_variants: stockVariants,
      internal_title: first.nazivArtikla,
      erp_sku:        first.sifraArtikla,
      tags,
      rating:         0,
      is_active:      true,
      sort_order:     sort++,
      _slikaPath:     first.slikaPath,
    })
  }

  console.log(`\n📦  ${products.length} proizvoda nakon spajanja okusa:\n`)
  products.forEach((p) => console.log(
    `   ${p.brand.padEnd(18)} ${p.title.padEnd(34)} ${String(p.price).padStart(7)} KM` +
    (p.old_price ? ` (bilo ${p.old_price})` : '') +
    (p.flavors.length ? `  okusi: ${p.flavors.join(', ')}` : '')
  ))

  if (DRY) { console.log('\n🏁  Dry-run — nista nije pisano.'); return }

  const URL = process.env.VITE_SUPABASE_URL
  const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!URL || !KEY) { console.error('❌  Treba .env.local s VITE_SUPABASE_URL + SUPABASE_SERVICE_KEY'); process.exit(1) }
  const supabase = createClient(URL, KEY)

  for (const p of products) {
    const { _slikaPath, ...row } = p

    // 1) slika: download s weberp-api → upload u nas storage
    let imagePath = null
    try {
      const imgRes = await fetch(IMG + _slikaPath)
      if (imgRes.ok) {
        const buf  = Buffer.from(await imgRes.arrayBuffer())
        const ext  = _slikaPath.split('.').pop().toLowerCase()
        imagePath  = `${row.slug}.${ext}`
        const { error } = await supabase.storage
          .from('product-images')
          .upload(imagePath, buf, { upsert: true, contentType: ext === 'png' ? 'image/png' : 'image/jpeg' })
        if (error) { console.warn(`   ⚠ upload slike ${row.slug}: ${error.message}`); imagePath = null }
      }
    } catch (e) { console.warn(`   ⚠ slika ${row.slug}: ${e.message}`) }

    // 2) upsert proizvoda (po slugu)
    const { error } = await supabase
      .from('products')
      .upsert({ ...row, image_path: imagePath, image_url: imagePath ? null : IMG + _slikaPath }, { onConflict: 'slug' })
    console.log(error ? `   ❌ ${row.slug}: ${error.message}` : `   ✓ ${row.slug}${imagePath ? ' (slika u storage)' : ''}`)
  }

  console.log('\n🏁  Gotovo.')
}

main().catch((e) => { console.error('❌ ', e.message); process.exit(1) })
