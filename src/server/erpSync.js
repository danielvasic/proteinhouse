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

// WebShopRobMat API (kolovoz 2026) — stari GetAllProducts je ugašen 25.8. i
// vraća 404. Ogledalo se puni s GetByKlijent jer je jedini endpoint s potpunom
// slikom (1689 artikala, bez IsWeb filtera — IsWeb u ERP-u ionako nitko ne
// održava). Stanje skladišta postoji isključivo na GetArtikliSaStanjem, koji
// vraća podskup (1120), pa se koristi kao overlay preko ogledala: artikal bez
// retka u overlayu zadržava qty=null ("nepoznato"), nikad 0.
export const ERP_BASE = process.env.ERP_API_BASE || 'https://proteinhouse-api.work/api'

const BATCH = 500

/** Dohvati sve artikle iz ERP-a. */
export async function fetchArticles(signal) {
  const res = await fetch(`${ERP_BASE}/Artikli/GetByKlijent`, {
    headers: { Accept: 'application/json' }, signal,
  })
  if (!res.ok) throw new Error(`ERP API ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('ERP API nije vratio niz artikala.')
  return data
}

/**
 * Stanje skladišta po šifri artikla.
 *
 * Paginirano namjerno: dokumentacija upozorava da se stanje računa
 * sekvencijalno po grupama artikala, pa getAll=true traje znatno duže od
 * stranica od 200 (maksimum koji API prima).
 */
export async function fetchStockBySku(signal) {
  const stock = new Map()
  let page = 1
  let totalPages = 1
  do {
    const res = await fetch(
      `${ERP_BASE}/Artikli/GetArtikliSaStanjem?page=${page}&pageSize=200`,
      { headers: { Accept: 'application/json' }, signal },
    )
    if (!res.ok) throw new Error(`ERP stanje ${res.status} (page ${page})`)
    const data = await res.json()
    totalPages = data.totalPages || 1
    for (const a of data.artikli ?? []) {
      const sku = String(a.sifraArtikla ?? '').trim()
      if (sku) stock.set(sku, Number(a.ukupnaKolicinaNaSkladistu) || 0)
    }
    page++
  } while (page <= totalPages)
  return stock
}

/** Faza 1: upiši sve artikle u ogledalo i označi one koji su nestali. */
export async function mirrorArticles(supabase, articles, stockBySku = new Map()) {
  const rows = articles.map(toErpArticle).filter((r) => r.sku)
  for (const r of rows) {
    r.qty = stockBySku.has(r.sku) ? stockBySku.get(r.sku) : null
  }

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
 * Stanje za proizvod iz njegovih ERP artikala.
 *
 * Vraća { stock, stock_variants } u obliku koji getVariantStock očekuje:
 * ključ "{flavor}|{size}" / "{flavor}" / "{size}", vrijednost { qty, sku }.
 *
 * SPAJA se s postojećim stock_variants umjesto da ih zamijeni: hasAnyStock za
 * proizvod s varijantama gleda isključivo stock_variants, pa bi ključ koji
 * ERP ne pokriva (admin je preimenovao okus, parser je drukčije rastavio
 * naziv) nakon zamjene nestao i proizvod bi preko noći postao "nema na
 * stanju". Ovako ERP osvježava ono što prepoznaje, a ručni unosi za
 * nepokrivene ključeve prežive.
 */
function stockFor(articles, existingVariants) {
  const variants = { ...(existingVariants || {}) }
  let total = 0
  for (const a of articles) {
    if (a.qty == null) continue
    const qty = Math.max(0, Math.floor(Number(a.qty)))
    total += qty
    const key = a.flavor && a.size ? `${a.flavor}|${a.size}`
              : a.flavor           ? a.flavor
              : a.size             ? a.size
              : null
    if (key) variants[key] = { qty, sku: a.sku }
  }
  return { stock: total, stock_variants: variants }
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
    .from('products').select('id, slug, erp_skus, erp_sync_price, erp_sync_stock, price, old_price, badge, stock, stock_variants')
  if (pErr) throw pErr

  const bySku = new Map()
  for (const a of articles) bySku.set(a.sku, a)

  // ── Osvježi postojeće ──
  let updated = 0
  let stockUpdated = 0
  const claimed = new Set()
  for (const p of products) {
    const mine = (p.erp_skus ?? []).map((s) => bySku.get(s)).filter(Boolean)
    for (const s of p.erp_skus ?? []) claimed.add(s)
    if (!mine.length) continue

    const patch = {}

    if (p.erp_sync_price) {
      const next = priceFor(mine)
      if (next) {
        const same = Number(p.price) === next.price &&
          (p.old_price == null ? null : Number(p.old_price)) === next.old_price &&
          (p.badge || null) === next.badge
        if (!same) Object.assign(patch, next)
      }
    }

    // Stanje ide samo uz eksplicitni pristanak po proizvodu (erp_sync_stock,
    // default false): pogrešno stanje ne košta krivu cifru nego blokira
    // kupovinu, pa se uključuje tek kad se provjeri da se ključevi varijanti
    // proizvoda poklapaju s onim što ERP parser izvuče.
    if (p.erp_sync_stock && mine.some((a) => a.qty != null)) {
      const next = stockFor(mine, p.stock_variants)
      const same = Number(p.stock) === next.stock &&
        JSON.stringify(p.stock_variants || {}) === JSON.stringify(next.stock_variants)
      if (!same) {
        Object.assign(patch, next)
        stockUpdated++
      }
    }

    if (!Object.keys(patch).length) continue

    if (!dryRun) {
      const { error } = await supabase
        .from('products')
        .update({ ...patch, erp_synced_at: new Date().toISOString() })
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

  return { updated, stockUpdated, created: drafts.length, remaining: Math.max(0, groups.size - drafts.length) }
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
    // Pad dohvata stanja ne smije oboriti cijeli sync — cijene i katalog su
    // vredniji od svježeg lagera, pa se u tom slučaju qty samo ne mijenja.
    let stockBySku = new Map()
    let stockError = null
    try {
      stockBySku = await fetchStockBySku()
    } catch (err) {
      stockError = String(err.message || err)
      console.error('erp-sync: stanje skladišta nedostupno:', stockError)
    }
    const mirror = dryRun ? { upserted: 0, wentMissing: 0 } : await mirrorArticles(supabase, articles, stockBySku)
    const recon  = await reconcileProducts(supabase, { createLimit, dryRun })

    const result = {
      fetched: articles.length,
      stockFetched: stockBySku.size,
      stockError,
      upserted: mirror.upserted,
      wentMissing: mirror.wentMissing,
      productsUpdated: recon.updated,
      stockUpdated: recon.stockUpdated,
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

const IMG_BASE = 'https://weberp-api.com/images/'

/**
 * Postepeno prebacivanje ERP slika u naš storage.
 *
 * Nacrti pri stvaranju dobiju hotlink na weberp server (da se odmah vide);
 * ovo skida sliku i uploaduje je u bucket product-images, pa postavlja
 * image_path — koji pri prikazu ima prednost nad image_url. Ograničeno po
 * prolazu da stane u timeout funkcije; vrti se dok red ne presuši, poslije
 * čega je svaki prolaz no-op.
 */
export async function runImageSync({ limit = 40 } = {}) {
  const supabase = serviceClient()

  const { data: prods, error } = await supabase
    .from('products')
    .select('id, erp_skus')
    .is('image_path', null)
    .eq('images', '[]')
    .neq('erp_skus', '{}')
    .limit(limit)
  if (error) throw error
  const candidates = (prods ?? []).filter((p) => p.erp_skus?.length)
  if (!candidates.length) return { uploaded: 0, failed: 0, done: true }

  const { data: arts, error: aErr } = await supabase
    .from('erp_articles')
    .select('sku, image_path')
    .in('sku', candidates.map((p) => p.erp_skus[0]))
  if (aErr) throw aErr
  const imgBySku = new Map(arts.map((a) => [a.sku, a.image_path]))

  let uploaded = 0, failed = 0
  const one = async (p) => {
    const remote = imgBySku.get(p.erp_skus[0])
    if (!remote) { failed++; return }
    try {
      const res = await fetch(IMG_BASE + remote)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || 'image/png'
      const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'
      const path = `erp/${p.erp_skus[0]}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('product-images')
        .upload(path, buf, { contentType, upsert: true })
      if (upErr) throw upErr
      const { error: dbErr } = await supabase
        .from('products')
        .update({ image_path: path })
        .eq('id', p.id)
      if (dbErr) throw dbErr
      uploaded++
    } catch (err) {
      console.error('erp-images:', p.erp_skus[0], err.message)
      failed++
    }
  }

  // Po 5 paralelno — 40 slika stane u timeout, a ne guši ni weberp ni storage.
  for (let i = 0; i < candidates.length; i += 5) {
    await Promise.all(candidates.slice(i, i + 5).map(one))
  }
  return { uploaded, failed, done: candidates.length < limit }
}
