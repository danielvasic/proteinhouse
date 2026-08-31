/**
 * Feed proizvoda za Google Merchant Center i Meta katalog.
 *
 *   GET /api/feed.xml
 *
 * Oba prihvataju isti RSS 2.0 s g: namespace, pa je jedan izvor dovoljan.
 *
 * Feed je na razini PROIZVODA, ne varijante. Cijena kod nas stoji na
 * products, pa bi gramaže i okusi imali identične cijene — feed bi narastao
 * nekoliko puta bez ijedne nove informacije. Uz to `id` ovdje MORA biti isti
 * kao `item_id` u događajima (view_item, add_to_cart, purchase); inače
 * dinamičke reklame ne mogu spojiti proizvod s posjetom.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY (čita i proizvode bez javne vidljivosti).
 */
import { serviceClient } from '../../src/server/supabaseAdmin.js'

const SITE = process.env.URL || 'https://proteinhouse.ba'

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** Ogoli HTML iz opisa — Google traži čist tekst i reže na 5000 znakova. */
export function tekst(html, max = 4900) {
  const t = String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > max ? t.slice(0, max - 1) + '…' : t
}

export function slikaUrl(p) {
  const prva = Array.isArray(p.images) && p.images.length ? p.images[0] : null
  const put = prva?.path || p.image_path
  if (put) {
    return `${process.env.VITE_SUPABASE_URL || ''}/storage/v1/object/public/product-images/${put}`
  }
  return p.image_url || ''
}

export function stavka(p) {
  const naSkladistu = Number(p.stock ?? 0) > 0
    || Object.values(p.stock_variants ?? {}).some((v) => Number(v?.qty ?? 0) > 0)

  const cijena = Number(p.price)
  const stara  = p.old_price != null ? Number(p.old_price) : null
  // Google očekuje da je <price> puna cijena, a <sale_price> snižena. Kod nas
  // je obrnuto imenovano: price je ono što se plaća, old_price precrtano.
  const naAkciji = stara != null && stara > cijena

  const r = [
    `<g:id>${esc(p.id)}</g:id>`,
    `<g:title>${esc(`${p.brand ?? ''} ${p.title}`.trim())}</g:title>`,
    `<g:description>${esc(tekst(p.description) || `${p.brand ?? ''} ${p.title}`.trim())}</g:description>`,
    `<g:link>${esc(`${SITE}/proizvod/${p.slug}`)}</g:link>`,
    `<g:condition>new</g:condition>`,
    `<g:availability>${naSkladistu ? 'in stock' : 'out of stock'}</g:availability>`,
    `<g:price>${(naAkciji ? stara : cijena).toFixed(2)} BAM</g:price>`,
  ]
  if (naAkciji) r.push(`<g:sale_price>${cijena.toFixed(2)} BAM</g:sale_price>`)

  const img = slikaUrl(p)
  if (img) r.push(`<g:image_link>${esc(img)}</g:image_link>`)
  if (p.brand) r.push(`<g:brand>${esc(p.brand)}</g:brand>`)
  if (p.google_kategorija) r.push(`<g:google_product_category>${esc(p.google_kategorija)}</g:google_product_category>`)
  if (p.category) r.push(`<g:product_type>${esc(p.category)}</g:product_type>`)

  // Google traži barem jedan identifikator, ili izričitu izjavu da ga nema.
  // Bez te izjave proizvod ide u "Limited performance".
  if (p.gtin)      r.push(`<g:gtin>${esc(p.gtin)}</g:gtin>`)
  if (p.mpn)       r.push(`<g:mpn>${esc(p.mpn)}</g:mpn>`)
  if (!p.gtin && !p.mpn) r.push(`<g:identifier_exists>no</g:identifier_exists>`)

  return `    <item>\n      ${r.join('\n      ')}\n    </item>`
}

export default async () => {
  try {
    const supabase = serviceClient()

    // Supabase REST reže na 1000 redova — stranicamo dok ne pokupimo sve.
    const svi = []
    for (let od = 0; ; od += 1000) {
      const { data, error } = await supabase
        .from('products')
        .select('id, slug, brand, title, description, price, old_price, category, image_path, image_url, images, stock, stock_variants, gtin, mpn, google_kategorija')
        .eq('is_active', true)
        .order('id')
        .range(od, od + 999)
      if (error) throw error
      svi.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ProteinHouse</title>
    <link>${esc(SITE)}</link>
    <description>Suplementi i sportska prehrana</description>
${svi.filter((p) => p.slug && p.price != null).map(stavka).join('\n')}
  </channel>
</rss>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Merchant Center povlači feed jednom dnevno; sat vremena keša je
        // dovoljno svjeze, a stednja je znatna jer feed ima ~1000 proizvoda.
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('feed:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}
