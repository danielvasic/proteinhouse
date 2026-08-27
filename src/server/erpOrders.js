/**
 * Guranje web narudžbi u ERP (POST /api/Narudzbe/Add).
 *
 * Supabase ostaje izvor istine za web — narudžba se prvo upiše u `orders`
 * kao i do sada, pa se ODAVDE proslijedi ERP-u i povratni ID spremi u
 * orders.erp_order_id. Dva ulaza:
 *
 *   pushOrderByNumber()  odmah nakon checkouta (netlify/functions/erp-order)
 *   pushPendingOrders()  satna metla uz erp-sync — pokupi sve što je prvi
 *                        pokušaj promašio, pa nijedna narudžba ne ovisi o
 *                        tome je li kupčev browser stigao pozvati funkciju
 *
 * Stavke: ERP ne poznaje naš uuid nego svoj int ID po varijanti — a jedan
 * web proizvod namjerno grupiše više ERP artikala (gramaže/okusi). Rezolucija
 * ide preko products.erp_skus → erp_articles(size, flavor, erp_id). Stavka
 * koja se ne da rezolvirati šalje se s ArtiklId=null i punim nazivom, da
 * narudžba stigne do ERP-a pa makar je čovjek dovrši; promašaj se zabilježi
 * u orders.erp_push_error kao upozorenje.
 *
 * bojaId/velicinaId query parametri se namjerno NE šalju: jedan globalni par
 * ne može opisati narudžbu s više stavki, a za suplemente su gramaža i okus
 * ionako zasebni ERP artikli — ispravan ArtiklId nosi svu informaciju.
 */
import { serviceClient } from './supabaseAdmin.js'
import { ERP_BASE } from './erpSync.js'

/**
 * Web status → ERP IDstatus (GET /GetStatusi: 1 Kreiranje, 2 Na čekanju,
 * 3 Odobrena, 4 Otkazana, 5 Odbijena).
 *
 * PAŽNJA — ERP ovo trenutno IGNORIŠE. Testirano 27.08.2026. na dev API-ju
 * (narudžbe 1233 i 1234): šta god pošaljemo u IDstatus, zapis završi na
 * 1 "Kreiranje". Isto vrijedi za DatumNarudzbe — ERP upiše vlastito vrijeme
 * unosa — i za NazivVelicine na stavci, koji se ne sačuva.
 *
 * Polja se svejedno šalju: bezopasna su i proradit će sama ako Haris doda
 * podršku. Ali ne oslanjaj se na to da status prelazi na ERP stranu, i ne
 * gradi logiku na pretpostavci da ćemo narudžbu moći kasnije pomjeriti —
 * rute za promjenu statusa (UpdateStatus/Update/Delete) ne postoje.
 */
const STATUS_MAP = {
  'nova':       { id: 2, naziv: 'Na čekanju' },
  'potvrđena':  { id: 3, naziv: 'Odobrena' },
  'isporučena': { id: 3, naziv: 'Odobrena' },
  'otkazana':   { id: 4, naziv: 'Otkazana' },
}

const norm = (s) => String(s ?? '').trim().toLowerCase()

/**
 * Nađi ERP artikal za stavku iz korpe.
 * @param {Array} articles erp_articles redovi proizvoda (size, flavor, erp_id…)
 * @param {{selectedSize?: string, selectedFlavor?: string}} item
 */
export function matchArticle(articles, item) {
  const size = norm(item.selectedSize)
  const flavor = norm(item.selectedFlavor)

  // Odabir kupca MORA odgovarati artiklu — i kad je vezan samo jedan.
  // Aktivni katalog redovno nudi više okusa nego što je SKU-ova vezano
  // (proizvod s jednim artiklom "Chocolate" nudi i "Vanilla"): slijepo
  // vraćanje jedinog artikla značilo bi krivi ArtiklId u ERP-u i krivu
  // robu iz skladišta. Bolje neriješena stavka s punim nazivom.
  const hits = articles.filter((a) =>
    (!size   || norm(a.size)   === size) &&
    (!flavor || norm(a.flavor) === flavor))

  if (hits.length === 1) return hits[0]
  if (!size && !flavor && articles.length === 1) return articles[0]
  // Više pogodaka uz potpun odabir: svejedno koji, ista varijanta.
  if (hits.length > 1 && size && flavor) return hits[0]
  return null
}

/** Rezolviraj sve stavke narudžbe u NarudzbaStavkaVM + upozorenja. */
export async function resolveItems(supabase, items) {
  const ids = [...new Set(items.map((i) => i.id).filter(Boolean))]
  const { data: products, error: pErr } = await supabase
    .from('products').select('id, erp_skus').in('id', ids)
  if (pErr) throw pErr
  const skusByProduct = new Map(products.map((p) => [p.id, p.erp_skus ?? []]))

  const allSkus = [...new Set(products.flatMap((p) => p.erp_skus ?? []))]
  let articlesBySku = new Map()
  if (allSkus.length) {
    const { data: articles, error: aErr } = await supabase
      .from('erp_articles')
      .select('sku, erp_id, name, size, flavor')
      .in('sku', allSkus)
    if (aErr) throw aErr
    articlesBySku = new Map(articles.map((a) => [a.sku, a]))
  }

  const warnings = []
  const stavke = items.map((item) => {
    const mine = (skusByProduct.get(item.id) ?? [])
      .map((sku) => articlesBySku.get(sku)).filter(Boolean)
    const art = matchArticle(mine, item)
    if (!art) {
      warnings.push(`stavka bez ERP artikla: ${item.brand ?? ''} ${item.title}`
        + (item.selectedSize ? ` / ${item.selectedSize}` : '')
        + (item.selectedFlavor ? ` / ${item.selectedFlavor}` : ''))
    }
    return {
      ArtiklId:      art?.erp_id ?? null,
      Kolicina:      item.qty,
      Cijena:        item.price,
      NazivArtikla:  art?.name ?? [item.brand, item.title, item.selectedSize, item.selectedFlavor]
                       .filter(Boolean).join(' '),
      BojaId:        null,
      VelicinaId:    null,
      NazivBoje:     null,
      NazivVelicine: item.selectedSize ?? null,
    }
  })
  return { stavke, warnings }
}

/** orders red → NarudzbaVM. */
export function buildNarudzba(order, stavke) {
  const status = STATUS_MAP[order.status] ?? STATUS_MAP['nova']
  return {
    KupacId:       null, // ERP kreira kupca iz podataka ispod
    ImePrezime:    order.customer_name,
    NazivKupca:    order.customer_name,
    Adresa:        order.shipping_address ?? '',
    Grad:          order.shipping_city ?? '',
    Zip:           order.shipping_zip ?? '',
    Telefon:       order.customer_phone ?? '',
    Email:         order.customer_email ?? '',
    DatumNarudzbe: order.created_at ?? new Date().toISOString(),
    // Ukupno što kupac plaća (s poštarinom i popustom) — VM nema zasebna
    // polja za njih, pa suma stavki može odstupati od iznosa; to je očekivano.
    IznosNarudzbe: Number(order.total),
    Naziv:         status.naziv,
    IDstatus:      status.id,
    Stavke:        stavke,
  }
}

/** Pošalji jednu narudžbu ERP-u i upiši ishod. Idempotentno. */
export async function pushOrder(supabase, order) {
  if (order.erp_order_id) return { skipped: true, erpOrderId: order.erp_order_id }

  const { stavke, warnings } = await resolveItems(supabase, order.items ?? [])
  const body = buildNarudzba(order, stavke)

  const res = await fetch(`${ERP_BASE}/Narudzbe/Add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = (await res.text()).trim()
  if (!res.ok) {
    const error = `ERP /Add ${res.status}: ${text.slice(0, 300)}`
    await supabase.from('orders')
      .update({ erp_push_error: error })
      .eq('id', order.id)
    return { ok: false, error, warnings }
  }

  const erpOrderId = Number.parseInt(text.replace(/^"|"$/g, ''), 10)
  if (!Number.isInteger(erpOrderId)) {
    const error = `ERP /Add vratio nerazumljiv ID: ${text.slice(0, 120)}`
    await supabase.from('orders').update({ erp_push_error: error }).eq('id', order.id)
    return { ok: false, error, warnings }
  }

  await supabase.from('orders').update({
    erp_order_id:   erpOrderId,
    erp_pushed_at:  new Date().toISOString(),
    erp_push_error: warnings.length ? `upozorenja: ${warnings.join('; ')}` : null,
  }).eq('id', order.id)

  return { ok: true, erpOrderId, warnings }
}

/** Push po broju narudžbe — poziv iz checkouta. */
export async function pushOrderByNumber(orderNumber) {
  const supabase = serviceClient()
  const { data: order, error } = await supabase
    .from('orders').select('*').eq('order_number', orderNumber).single()
  if (error || !order) throw new Error(`narudžba ${orderNumber} nije nađena`)
  return pushOrder(supabase, order)
}

/**
 * Metla: pošalji sve neposlane narudžbe zadnjih 7 dana. Ponavlja i one s
 * greškom — ERP nedostupan sat vremena ne smije značiti izgubljenu narudžbu.
 */
export async function pushPendingOrders({ limit = 20 } = {}) {
  const supabase = serviceClient()
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: orders, error } = await supabase
    .from('orders').select('*')
    .is('erp_order_id', null)
    .neq('status', 'otkazana')
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error

  let pushed = 0, failed = 0
  for (const order of orders ?? []) {
    try {
      const r = await pushOrder(supabase, order)
      r.ok ? pushed++ : failed++
    } catch (err) {
      console.error('erp-orders:', order.order_number, err.message)
      failed++
    }
  }
  return { pending: orders?.length ?? 0, pushed, failed }
}
