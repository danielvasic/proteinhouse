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
 *   opis, način upotrebe, sastav, galerija, tagovi, slug, is_active, sort_order,
 *   price_sale po varijanti (rucna akcija — vidi stockFor)
 * Novi artikli ulaze kao NEAKTIVNI nacrti — ERP šalje isWeb=false na svih 1344
 * artikala, pa nema načina da se iz podataka zaključi šta smije na web.
 */
import { createHash } from 'node:crypto'
import { serviceClient } from './supabaseAdmin.js'
import { toErpArticle, sellPrice, slugify, stripHtml, splitUsage, suggestExtraCategories } from './erpMapping.js'

// ERP API se dvaput mijenjao i vraćao (25.8. je GetAllProducts nestao, 27.8.
// se vratio), pa se izvor bira po onome što endpoint STVARNO vrati, ne po
// pretpostavci:
//
//   GetAllProducts — potpuni zapisi (brend, grupa, slika, opis). Kad radi,
//                    ovo je izvor; to je i endpoint namijenjen webshopu.
//   GetByKlijent   — više šifri (3958 vs 1349), ali "skeleton": bez brenda,
//                    grupe, slike i opisa. Rezerva, samo ako prvi padne.
//
// Zašto redoslijed, a ne "više redaka pobjeđuje": 27.8. je GetByKlijent vratio
// 3958 praznih zapisa i time obrisao brend/kategoriju/sliku cijelom ogledalu.
// Više redaka bez sadržaja je gori izvor od manje redaka sa sadržajem.
//
// Stanje skladišta trenutno NE POSTOJI ni na jednom endpointu — GetArtikliSaStanjem
// je ugašen s povratkom starog API-ja. Dok se ne vrati, qty ostaje na zadnjoj
// poznatoj vrijednosti (trigger erp_articles_keep_known u bazi).
export const ERP_BASE = process.env.ERP_API_BASE || 'https://proteinhouse-api.work/api'

// Stanje skladišta smije živjeti na drugom hostu od kataloga. Stari API je
// vraćen jer o njemu ovisi stara stranica dok nova ne krene, a novi (s
// endpointom za lager) je preseljen drugdje — pa se izvori mogu razdvojiti
// bez izmjene koda. Ako nije postavljeno, koristi se isti host kao katalog.
export const ERP_STOCK_BASE = process.env.ERP_STOCK_API_BASE || ERP_BASE

const BATCH = 500

/** Brend kad ga ERP ne pošalje — ujedno oznaka da nacrt treba popraviti. */
const FALLBACK_BRAND = 'ProteinHouse'

/** Ima li odgovor stvarni sadržaj ili su to prazne ljušture? */
function looksComplete(rows) {
  if (!rows.length) return false
  const sample = rows.slice(0, 200)
  const withBrand = sample.filter((r) => r.nazivProizvodjaca || r.nazivGrupe).length
  return withBrand / sample.length > 0.5
}

/**
 * Dohvati artikle iz ERP-a. Vraća { rows, source } da se u dnevniku vidi
 * odakle su podaci došli — bez toga se ovakav obrt primijeti tek po šteti.
 */
export async function fetchArticles(signal) {
  const tryOne = async (path) => {
    const res = await fetch(`${ERP_BASE}/Artikli/${path}`, {
      headers: { Accept: 'application/json' }, signal,
    })
    if (!res.ok) throw new Error(`ERP API ${path} ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error(`ERP API ${path} nije vratio niz.`)
    return data
  }

  let firstError = null
  try {
    const rows = await tryOne('GetAllProducts')
    if (looksComplete(rows)) return { rows, source: 'GetAllProducts' }
    firstError = `GetAllProducts vratio ${rows.length} praznih zapisa`
  } catch (err) {
    firstError = String(err.message || err)
  }

  console.warn('erp-sync: GetAllProducts neupotrebljiv —', firstError, '→ GetByKlijent')
  const rows = await tryOne('GetByKlijent')
  return { rows, source: 'GetByKlijent', degraded: !looksComplete(rows) }
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
  const getPage = async (page) => {
    const res = await fetch(
      `${ERP_STOCK_BASE}/Artikli/GetArtikliSaStanjem?page=${page}&pageSize=200`,
      { headers: { Accept: 'application/json' }, signal },
    )
    if (!res.ok) throw new Error(`ERP stanje ${res.status} (page ${page})`)
    return res.json()
  }

  const first = await getPage(1)
  const totalPages = first.totalPages || 1
  const consume = (data) => {
    for (const a of data.artikli ?? []) {
      const sku = String(a.sifraArtikla ?? '').trim()
      if (sku) stock.set(sku, Number(a.ukupnaKolicinaNaSkladistu) || 0)
    }
  }
  consume(first)

  // Po tri stranice odjednom: dovoljno brzo (~3 s umjesto ~8), a ne guši
  // ERP koji stanje racuna sekvencijalno po zahtjevu.
  const rest = []
  for (let p = 2; p <= totalPages; p++) rest.push(p)
  for (let i = 0; i < rest.length; i += 3) {
    const datas = await Promise.all(rest.slice(i, i + 3).map(getPage))
    datas.forEach(consume)
  }
  return stock
}

/**
 * Supabase REST vraca najvise 1000 redaka po upitu — ogledalo je vece od
 * toga, pa svako "procitaj sve" mora kroz range stranice.
 */
async function selectAll(query, pageSize = 1000) {
  const out = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query.range(from, from + pageSize - 1)
    if (error) throw error
    out.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return out
}

/** Faza 1: upiši sve artikle u ogledalo i označi one koji su nestali. */
export async function mirrorArticles(supabase, articles, stockBySku = new Map()) {
  const syncStartedAt = new Date().toISOString()
  const rows = articles.map(toErpArticle).filter((r) => r.sku)
  // Kad stanje uopće nije stiglo (endpoint ugašen), qty se NE dira — inače bi
  // jedan pad obrisao zadnje poznato stanje cijelom katalogu. Kad jest stiglo,
  // artikal bez retka u overlayu ostaje "nepoznato" umjesto da postane 0.
  for (const r of rows) {
    r.qty = stockBySku.size ? (stockBySku.get(r.sku) ?? null) : undefined
    if (r.qty === undefined) delete r.qty
  }

  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase
      .from('erp_articles')
      .upsert(rows.slice(i, i + BATCH), { onConflict: 'sku' })
    if (error) throw error
  }

  // Artikal koji više ne dolazi iz API-ja ne brišemo — narudžbe i proizvodi se
  // i dalje mogu referisati na tu šifru. Samo ga označimo. Umjesto NOT IN s
  // hiljadama šifri (URL od 30+ KB), prisutne prepoznajemo po last_seen_at
  // koji je upsert upravo postavio: sve starije od početka ovog prolaza nije
  // stiglo iz API-ja.
  const { data: gone, error: goneErr } = await supabase
    .from('erp_articles')
    .update({ missing_since: new Date().toISOString() })
    .is('missing_since', null)
    .lt('last_seen_at', syncStartedAt)
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
function variantKey(a) {
  return a.flavor && a.size ? `${a.flavor}|${a.size}`
       : a.flavor           ? a.flavor
       : a.size             ? a.size
       : null
}

function stockFor(articles, existingVariants) {
  const variants = { ...(existingVariants || {}) }
  let total = 0

  // Kad ERP preimenuje artikal — parser drukcije rastavi naziv ili se ispravi
  // tipfeler ("Chocolate Hezelnut" -> "Chocolate Hazelnut", "2015g" -> "2040g")
  // — novi ključ se doda, a stari ostane zauvijek jer se spajamo s postojecim.
  // Ista SKU tada stoji pod dva ključa, svaki sa svojom cijenom i svojim
  // stanjem, a zastarjeli nosi stariju (visu) cijenu. Zato zatecene ključeve
  // koji nose SKU iz ovog prolaza pod drugim imenom skidamo. Rucni unosi imaju
  // drugu ili nikakvu SKU pa prezive — a to je i svrha spajanja.
  const skuIzProlaza = new Set(
    articles.filter((a) => a.sku != null).map((a) => String(a.sku))
  )
  const kljuceviIzProlaza = new Set(articles.map(variantKey).filter(Boolean))
  for (const [key, v] of Object.entries(variants)) {
    if (v?.sku != null && skuIzProlaza.has(String(v.sku)) && !kljuceviIzProlaza.has(key)) {
      delete variants[key]
    }
  }

  for (const a of articles) {
    if (a.qty == null) continue
    const qty = Math.max(0, Math.floor(Number(a.qty)))
    total += qty
    const key = variantKey(a)
    if (!key) continue

    // Cijena ide UZ VARIJANTU, ne uz proizvod.
    //
    // Gold Whey ide od 7.50 (vrecica 30 g) do 489 (4450 g). Dok je cijena bila
    // samo na proizvodu, takav se raspon nije dao prikazati pa je katalog bio
    // razdvojen na vise proizvoda istog imena.
    //
    // Ispravka ranije tvrdnje: cijena NIJE uvijek ista unutar iste gramaze.
    // 780 g je 109 za jedne okuse a 110 za druge, 2040 g je 209 ili 220. Dio
    // te razlike bili su dupli ključevi iste SKU (skidaju se gore), ostatak
    // tako dolazi iz ERP-a. To samo jace opravdava cijenu na varijanti —
    // po proizvodu se ovakav raspon ne bi dao predstaviti.
    // NE koristi a.price_discount ovdje. To je cijenaHH — Happy Hour, ne
    // trajna akcija. Kroz katalog je oko 10% ispod redovne, pa bi upisivanje
    // znacilo stalni popust od 10% na sve. Isti razlog stoji iza
    // PRICE_SOURCE = 'cijena' u erpMapping.js; ako se ikad uvede prava
    // akcijska cijena, dolazi iz drugog polja.
    const cijena = a.price != null ? Number(a.price) : null

    // Rucna akcija zivi u price_sale i NE dolazi iz ERP-a — RPC kreiraj_narudzbu
    // je naplacuje ispred price. Prenosi se na novi zapis; inace bi je svaki
    // sat pregazio sync stanja i "akcija" bi trajala do prvog prolaza.
    const akcija = variants[key]?.price_sale
    variants[key] = {
      qty, sku: a.sku,
      ...(cijena != null && { price: cijena }),
      ...(akcija != null && { price_sale: Number(akcija) }),
    }
  }
  return { stock: total, stock_variants: variants }
}

/**
 * Faza 2: uskladi katalog s ogledalom.
 * @param {number} createLimit koliko novih proizvoda smije nastati u jednom
 *   prolazu; prvi backfill je ~800 grupa pa se raspoređuje kroz više prolaza
 *   da funkcija ne padne na timeoutu.
 */
export async function reconcileProducts(supabase, { createLimit = 200, dryRun = false, degraded = false } = {}) {
  // selectAll jer REST vraca najvise 1000 redaka, a ogledalo ih ima ~2600 —
  // bez ovoga reconcile vidi samo prvi dio abecede i "izgubi" ostatak.
  const articles = await selectAll(
    supabase.from('erp_articles')
      .select('sku, erp_id, name, brand, group_name, category_slug, base_name, size, flavor, price, price_discount, qty, image_path, description_html, is_top, is_new, is_web')
      .is('missing_since', null).order('sku'))

  const products = await selectAll(
    supabase.from('products')
      .select('id, slug, erp_skus, erp_sync_price, erp_sync_stock, price, old_price, badge, stock, stock_variants, brand, title, category, is_active')
      .order('id'))

  const bySku = new Map()
  for (const a of articles) bySku.set(a.sku, a)

  // ── Osvježi postojeće ──
  let updated = 0
  let stockUpdated = 0
  let healed = 0
  const pendingUpdates = []
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

    // Samoizlječenje: nacrt je nastao dok je ERP vraćao osakaćene zapise, pa
    // je ostao bez brenda (fallback "ProteinHouse") i s kategorijom iz
    // fallbacka. Kad se pravi podaci vrate, popravi ga — ali samo dok je
    // nacrt i dok ga niko nije preuzeo, da se ručne izmjene ne gaze.
    if (!p.is_active && p.brand === FALLBACK_BRAND) {
      const src = mine.find((a) => a.brand) || mine[0]
      if (src?.brand) {
        patch.brand = src.brand
        if (src.base_name) patch.title = src.base_name
        if (src.category_slug) patch.category = src.category_slug
        healed++
      }
    }

    if (!Object.keys(patch).length) continue
    pendingUpdates.push({ id: p.id, patch })
    updated++
  }

  // Svaki update je zaseban HTTP poziv prema Supabaseu; serijski bi za
  // stotine promjena (prvi prolaz s cijenama s novog API-ja) trajali
  // minutama. Po 8 paralelno je red velicine brze, a ne guši PostgREST.
  if (!dryRun) {
    for (let i = 0; i < pendingUpdates.length; i += 8) {
      await Promise.all(pendingUpdates.slice(i, i + 8).map(async ({ id, patch }) => {
        const { error } = await supabase
          .from('products')
          .update({ ...patch, erp_synced_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }))
    }
  }

  // ── Nove grupe → nacrti ──
  // Grupišemo po brendu i nazivu bez gramaže/okusa, isto kao jednokratni uvoz.
  //
  // Novi ERP API (kolovoz 2026) konačno održava isWeb: 1571 od 3958 artikala
  // je označeno za web, i baš za njih postoji stanje skladišta. Ranije je
  // isWeb bio false na svemu pa se nije mogao koristiti, i katalog je zato
  // pokupio 2609 artikala koji na web ne idu. Sada filtriramo po ERP-ovoj
  // vlastitoj oznaci umjesto da nagađamo.
  //
  // Ako oznaka ikad opet zamre (nula označenih), filter se sam isključuje —
  // bolje previše nacrta nego prazan katalog.
  const anyWebFlag = articles.some((a) => a.is_web)
  const groups = new Map()
  for (const a of articles) {
    if (claimed.has(a.sku)) continue
    if (anyWebFlag && !a.is_web) continue
    const key = `${a.brand || '—'}|${a.base_name || a.name}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(a)
  }

  const existingSlugs = new Set(products.map((p) => p.slug))
  // Postojeci proizvodi po slugu koji bi im sync dodijelio. Sluzi da se
  // sifre PRIPOJE postojecem umjesto da nastane dvojnik — vidi nize.
  const poSlugu = new Map(products.map((p) => [p.slug, p]))
  let created = 0
  const drafts = []
  // Zaseban popis: pendingUpdates se prazni PRIJE ove petlje, pa bi upisi
  // dodani ovdje tiho propali.
  const pripajanja = []

  // Iz osakaćenog odgovora se ne stvaraju NOVI proizvodi — tako je 27.8.
  // nastalo 2128 nacrta bez brenda, kategorije i slike. Cijene i stanje
  // postojećih se i dalje osvježe; katalog samo ne raste dok izvor ne
  // prizdravi.
  if (degraded) {
    return { updated, stockUpdated, healed, created: 0, remaining: groups.size, skippedDegraded: true }
  }

  for (const [, mine] of groups) {
    if (created >= createLimit) break
    const first = mine[0]
    const brand = first.brand || FALLBACK_BRAND
    const base  = first.base_name || first.name

    const slug = slugify(`${brand} ${base}`)
    if (!slug) continue

    // Kad proizvod s tim slugom vec postoji, sifre se PRIPAJAJU njemu.
    //
    // Ranije je ovdje stajalo `slug = `${slug}-${first.sku}`` pa je nastajao
    // novi proizvod istog imena. Tako je katalog zavrsio sa 163 razdvojene
    // grupe: Gold Whey je imao tri reda — objavljen s jednom sifrom, i dva
    // nacrta s preostalih 46. Kupac je vidio samo vrecicu od 30 g.
    //
    // Sada je jedan proizvod nosilac svih svojih varijanti; cijena i stanje
    // se ionako citaju po varijanti (stock_variants), pa raspon od 7.50 do
    // 389 vise nije problem.
    const postojeci = poSlugu.get(slug)
    if (postojeci) {
      const spojene = [...new Set([...(postojeci.erp_skus ?? []), ...mine.map((a) => a.sku)])]
      if (spojene.length !== (postojeci.erp_skus ?? []).length) {
        pripajanja.push({
          id: postojeci.id,
          patch: {
            erp_skus: spojene,
            flavors: [...new Set(mine.map((a) => a.flavor).filter(Boolean))],
            sizes:   [...new Set(mine.map((a) => a.size).filter(Boolean))],
            erp_synced_at: new Date().toISOString(),
          },
        })
      }
      continue
    }
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

  if (!dryRun && pripajanja.length) {
    for (let i = 0; i < pripajanja.length; i += 8) {
      await Promise.all(pripajanja.slice(i, i + 8).map(async ({ id, patch }) => {
        const { error } = await supabase.from('products').update(patch).eq('id', id)
        if (error) throw error
      }))
    }
  }

  if (!dryRun && drafts.length) {
    for (let i = 0; i < drafts.length; i += BATCH) {
      // ignoreDuplicates: sudar na slugu (npr. prolaz koji se preklopio s
      // prethodnim) preskoci taj nacrt umjesto da atomicni batch insert
      // obori cijeli sync — nacrt ionako nastane u sljedecem prolazu.
      const { error } = await supabase
        .from('products')
        .upsert(drafts.slice(i, i + BATCH), { onConflict: 'slug', ignoreDuplicates: true })
      if (error) throw error
    }
  }

  return {
    updated, stockUpdated, healed,
    pripojeno: pripajanja.length,
    created: drafts.length,
    remaining: Math.max(0, groups.size - drafts.length),
    webFiltered: anyWebFlag,
  }
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
    const { rows: articles, source, degraded } = await fetchArticles()
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
    const recon  = await reconcileProducts(supabase, { createLimit, dryRun, degraded })

    const result = {
      fetched: articles.length,
      source,
      degraded: !!degraded,
      stockFetched: stockBySku.size,
      stockError,
      upserted: mirror.upserted,
      wentMissing: mirror.wentMissing,
      productsUpdated: recon.updated,
      stockUpdated: recon.stockUpdated,
      healed: recon.healed,
      webFiltered: recon.webFiltered,
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
        source: result.source,
        stock_fetched: result.stockFetched,
        stock_error: stockError,
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
 * Ima li artikal upotrebljivu sliku u ERP-u.
 *
 * ERP koristi 'placeholder.jpg' kao oznaku "nema slike" — tako je oznaceno
 * 2254 od 3968 artikala — a taj fajl na weberp serveru vraca 404. Bez ove
 * provjere bi ga svaki prolaz iznova pokusavao skinuti: preuzimanje pukne,
 * erp_image_name se ne upise, pa isti artikal opet udje u sljedeci prolaz i
 * trosi mjesto u kvoti od 40, unedogled. Isto vrijedi za imena bez ekstenzije
 * ('638466343058164195.'), koja su ocito odsjecena pri upisu u ERP.
 */
function nemaSliku(ime) {
  return !ime || ime === 'placeholder.jpg' || !/\.[a-z0-9]+$/i.test(ime)
}

/**
 * Prebacivanje i OSVJEZAVANJE ERP slika u nas storage.
 *
 * Dvije vrste posla:
 *   (a) proizvod nema nikakvu sliku              -> prvi uvoz
 *   (b) nasa slika je iz 'erp/', a ERP ima drugu -> osvjezavanje
 *
 * Rucne slike se NE diraju. Admin upload ide pod '<slug>-<timestamp>.<ext>',
 * a ovaj sync pise iskljucivo pod 'erp/', pa je prefiks pouzdana granica.
 * Kurirana galerija (images != '[]') takodjer iskljucuje proizvod iz oba
 * slucaja — te su radjene rucno i ERP ih ne smije pregaziti.
 *
 * Ime fajla nosi hash sadrzaja, pa se javni URL mijenja tek kad se slika
 * stvarno promijeni: nema zastarjelog kesa, a ako je ERP samo preimenovao
 * isti fajl, put ostaje isti i baza se ne dira.
 *
 * Ograniceno po prolazu da stane u timeout funkcije; vrti se svakih 15 minuta
 * dok red ne presusi, poslije cega je svaki prolaz no-op.
 */
export async function runImageSync({ limit = 40 } = {}) {
  const supabase = serviceClient()

  const prods = await selectAll(
    supabase
      .from('products')
      .select('id, erp_skus, image_path, erp_image_name')
      .eq('images', '[]')
      .neq('erp_skus', '{}')
      // PostgREST u .or() koristi * kao wildcard, ne %.
      .or('image_path.is.null,image_path.like.erp/*')
  )
  const kandidati = prods.filter((p) => p.erp_skus?.length)
  if (!kandidati.length) return { uploaded: 0, refreshed: 0, failed: 0, done: true }

  const arts = await selectAll(
    supabase.from('erp_articles').select('sku, image_path')
      .in('sku', kandidati.map((p) => p.erp_skus[0]))
  )
  const imgBySku = new Map(arts.map((a) => [a.sku, a.image_path]))

  // Skidamo samo ono sto je novo ili promijenjeno u ERP-u.
  const posao = []
  for (const p of kandidati) {
    const remote = imgBySku.get(p.erp_skus[0])
    if (nemaSliku(remote)) continue
    const novi = p.image_path == null
    if (novi || p.erp_image_name !== remote) posao.push({ ...p, remote, novi })
    if (posao.length >= limit) break
  }
  if (!posao.length) return { uploaded: 0, refreshed: 0, failed: 0, done: true }

  let uploaded = 0, refreshed = 0, failed = 0
  const one = async (p) => {
    try {
      const res = await fetch(IMG_BASE + p.remote)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || 'image/png'
      const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : 'png'
      const hash = createHash('sha1').update(buf).digest('hex').slice(0, 8)
      const path = `erp/${p.erp_skus[0]}-${hash}.${ext}`

      if (path !== p.image_path) {
        const { error: upErr } = await supabase.storage
          .from('product-images')
          .upload(path, buf, { contentType, upsert: true })
        if (upErr) throw upErr
      }
      const { error: dbErr } = await supabase
        .from('products')
        .update({ image_path: path, erp_image_name: p.remote })
        .eq('id', p.id)
      if (dbErr) throw dbErr
      if (p.novi) uploaded++
      else refreshed++
    } catch (err) {
      console.error('erp-images:', p.erp_skus[0], err.message)
      failed++
    }
  }

  // Po 5 paralelno — 40 slika stane u timeout, a ne gusi ni weberp ni storage.
  for (let i = 0; i < posao.length; i += 5) {
    await Promise.all(posao.slice(i, i + 5).map(one))
  }
  return { uploaded, refreshed, failed, done: posao.length < limit }
}
