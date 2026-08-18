/**
 * Sinhronizacija s ERP-om — dvije faze, namjerno odvojene.
 *
 *   1. mirrorArticles()     API → erp_articles (sirovo, potpuno, bez odluka)
 *   2. reconcileProducts()  erp_articles → products (kurirani katalog)
 *
 * Zašto odvojeno: ogledalo mora uvijek biti tačna slika ERP-a da se u svakom
 * trenutku može provjeriti šta ERP zaista tvrdi. Katalog je naš rad i ima
 * pravila koja ogledalo ne smije diktirati.
 *
 * Šta sinhronizacija SMIJE prepisati na postojećem proizvodu:
 *   cijena i stara cijena (samo ako je erp_sync_price uključen), badge popusta
 * Šta NIKAD ne dira:
 *   opis, način upotrebe, sastav, galerija, tagovi, slug, is_active, sort_order
 * Novi artikli ulaze kao NEAKTIVNI nacrti — ERP šalje isWeb=false na svih 1344
 * artikala, pa nema načina da se iz podataka zaključi šta smije na web.
 */
import { serviceClient } from './supabaseAdmin.js'
import { toErpArticle, sellPrice, slugify, stripHtml, splitUsage, suggestExtraCategories } from './erpMapping.js'

export const ERP_API = 'https://proteinhouse-api.work/api/Artikli/GetAllProducts'

const BATCH = 500

/** Dohvati sve artikle iz ERP-a. */
export async function fetchArticles(signal) {
  const res = await fetch(ERP_API, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`ERP API ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('ERP API nije vratio niz artikala.')
  return data
}

/** Faza 1: upiši sve artikle u ogledalo i označi one koji su nestali. */
export async function mirrorArticles(supabase, articles) {
  const rows = articles.map(toErpArticle).filter((r) => r.sku)

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('erp_articles')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'sku' })
    if (error) throw error
  }

  // Artikal koji više ne dolazi iz API-ja ne brišemo — narudžbe i proizvodi se
  // i dalje mogu referisati na tu šifru. Samo ga označimo.
  const seen = rows.map((r) => r.sku)
  const { data: gone, error: goneErr } = await supabase
    .from('erp_articles')
    .update({ missing_since: new Date().toISOString() })
    .is('missing_since', null)
    .not('sku', 'in', `(${seen.map((s) => `"${s}"`).join(',')})`)
    .select('sku')
  if (goneErr) throw goneErr

  return { upserted: rows.length, wentMissing: gone?.length ?? 0 }
}

/** Cijena, stara cijena i badge za skup ERP artikala jednog proizvoda. */
function priceFor(articles) {
  const priced = articles
    .map((a) => ({ a, ...sellPrice(a) }))
    .sort((x, y) => x.price - y.price)
  if (!priced.length) return null
  const { price, oldPrice } = priced[0]
  return {
    price,
    old_price: oldPrice,
    badge: oldPrice ? `-${Math.round((1 - price / oldPrice) * 100)}%` : null,
  }
}

/**
 * Faza 2: uskladi katalog s ogledalom.
 * @param {number} createLimit koliko novih proizvoda smije nastati u jednom
 *   prolazu; prvi backfill je ~800 grupa pa se raspoređuje kroz više prolaza
 *   da funkcija ne padne na timeoutu.
 */
export async function reconcileProducts(supabase, { createLimit = 200, dryRun = false } = {}) {
  const { data: articles, error: aErr } = await supabase
    .from('erp_articles').select('*').is('missing_since', null)
  if (aErr) throw aErr

  const { data: products, error: pErr } = await supabase
    .from('products').select('id, slug, erp_skus, erp_sync_price, price, old_price, badge')
  if (pErr) throw pErr

  const bySku = new Map()
  for (const a of articles) bySku.set(a.sku, a)

  // ── Osvježi postojeće ──
  let updated = 0
  const claimed = new Set()
  for (const p of products) {
    const mine = (p.erp_skus ?? []).map((s) => bySku.get(s)).filter(Boolean)
    for (const s of p.erp_skus ?? []) claimed.add(s)
    if (!mine.length || !p.erp_sync_price) continue

    const next = priceFor(mine)
    if (!next) continue
    const same = Number(p.price) === next.price &&
      (p.old_price == null ? null : Number(p.old_price)) === next.old_price &&
      (p.badge || null) === next.badge
    if (same) continue

    if (!dryRun) {
      const { error } = await supabase
        .from('products')
        .update({ ...next, erp_synced_at: new Date().toISOString() })
        .eq('id', p.id)
      if (error) throw error
    }
    updated++
  }

  // ── Nove grupe → nacrti ──
  // Grupišemo po brendu i nazivu bez gramaže/okusa, isto kao jednokratni uvoz.
  const groups = new Map()
  for (const a of articles) {
    if (claimed.has(a.sku)) continue
    const key = `${a.brand || '—'}|${a.base_name || a.name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(a)
  }

  const existingSlugs = new Set(products.map((p) => p.slug))
  let created = 0
  const drafts = []

  for (const [, mine] of groups) {
    if (created >= createLimit) break
    const first = mine[0]
    const brand = first.brand || 'ProteinHouse'
    const base  = first.base_name || first.name

    let slug = slugify(`${brand} ${base}`)
    if (!slug) continue
    if (existingSlugs.has(slug)) slug = `${slug}-${first.sku}`
    if (existingSlugs.has(slug)) continue
    existingSlugs.add(slug)

    const { description, usage } = splitUsage(stripHtml(first.description_html))
    const flavors = [...new Set(mine.map((a) => a.flavor).filter(Boolean))]
    const sizes   = [...new Set(mine.map((a) => a.size).filter(Boolean))]
    const tags    = []
    if (mine.some((a) => a.is_top)) tags.push('bestseller')
    if (mine.some((a) => a.is_new)) tags.push('new')

    drafts.push({
      brand,
      title:          base,
      internal_title: first.name,
      slug,
      ...priceFor(mine),
      description,
      usage_instructions: usage,
      category:       first.category_slug || 'proteini',
      extra_categories: suggestExtraCategories(first.name, first.group_name, first.category_slug || 'proteini'),
      flavors,
      sizes,
      tags,
      erp_sku:        first.sku,
      erp_skus:       mine.map((a) => a.sku),
      erp_synced_at:  new Date().toISOString(),
      // Neaktivan dok ga admin ne pregleda — ERP nema upotrebljivu oznaku
      // šta ide na web, a stanje na lageru ne šalje uopće.
      is_active:      false,
    })
    created++
  }

  if (!dryRun && drafts.length) {
    for (let i = 0; i < drafts.length; i += BATCH) {
      const { error } = await supabase.from('products').insert(drafts.slice(i, i + BATCH))
      if (error) throw error
    }
  }

  return { updated, created: drafts.length, remaining: Math.max(0, groups.size - drafts.length) }
}

/**
 * Cijeli prolaz + zapis u dnevnik.
 * @param {{triggerSource?: string, createLimit?: number, dryRun?: boolean}} opts
 */
export async function runErpSync({ triggerSource = 'schedule', createLimit = 200, dryRun = false } = {}) {
  const supabase = serviceClient()

  let runId = null
  if (!dryRun) {
    const { data } = await supabase
      .from('erp_sync_runs').insert({ trigger_source: triggerSource }).select('id').single()
    runId = data?.id ?? null
  }

  try {
    const articles = await fetchArticles()
    const mirror = dryRun ? { upserted: 0, wentMissing: 0 } : await mirrorArticles(supabase, articles)
    const recon  = await reconcileProducts(supabase, { createLimit, dryRun })

    const result = {
      fetched: articles.length,
      upserted: mirror.upserted,
      wentMissing: mirror.wentMissing,
      productsUpdated: recon.updated,
      productsCreated: recon.created,
      remainingToMap: recon.remaining,
      dryRun,
    }

    if (runId) {
      await supabase.from('erp_sync_runs').update({
        finished_at: new Date().toISOString(),
        fetched: result.fetched,
        upserted: result.upserted,
        went_missing: result.wentMissing,
        products_created: result.productsCreated,
        products_updated: result.productsUpdated,
        ok: true,
      }).eq('id', runId)
    }
    return result
  } catch (err) {
    if (runId) {
      await supabase.from('erp_sync_runs').update({
        finished_at: new Date().toISOString(), ok: false, error: String(err.message || err),
      }).eq('id', runId)
    }
    throw err
  }
}
