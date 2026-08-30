/**
 * Anketiranje ERP-a i okidanje server-side konverzija.
 *
 * ERP nema webhook ni rutu za promjenu statusa — provjereno 27.08.2026, sve
 * varijante (UpdateStatus, Update, Delete) vraćaju 404. Jedini put je
 * POST /Narudzbe/Get s rasponom datuma, koji vraća IDstatus po narudžbi.
 *
 * Zato se vrti uz satni erp-sync. Kašnjenje do sat vremena nije problem:
 * Meta CAPI prima događaje do 7 dana unatrag, GA4 do 3 dana.
 *
 * Narudžba uđe u ERP kao status 1 "Kreiranje" — to ERP forsira bez obzira
 * šta pošaljemo. Konverzija se šalje tek kad pređe u status koji je označen
 * kao potvrda (zadano 3 "Odobrena", podesivo u Postavke → Mjerenje).
 */
import { serviceClient } from './supabaseAdmin.js'
import { ERP_BASE } from './erpSync.js'
import { posaljiMeti, posaljiGoogleu } from './konverzije.js'

/** Statusi iz ERP-a po narudžbi: { erpId -> IDstatus }. */
export async function dohvatiErpStatuse(signal) {
  const res = await fetch(`${ERP_BASE}/Narudzbe/Get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    // Prazan objekt = bez filtera po datumu; ERP vraća sve narudžbe.
    body: '{}',
    signal,
  })
  if (!res.ok) throw new Error(`ERP /Narudzbe/Get ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('ERP nije vratio niz narudžbi.')
  const m = new Map()
  for (const n of data) {
    const id = Number(n.idNarudzbe)
    if (Number.isInteger(id)) m.set(id, Number(n.idStatus))
  }
  return m
}

async function ucitajPostavke(supabase) {
  const [{ data: javno }, { data: tajno }] = await Promise.all([
    supabase.from('site_content').select('key, value')
      .in('key', ['mjerenje_meta_pixel_id', 'mjerenje_ga4_id', 'mjerenje_erp_status_konverzije']),
    supabase.from('ad_secrets').select('key, value')
      .in('key', ['meta_capi_token', 'meta_test_event_code', 'ga4_api_secret']),
  ])
  const p = {}
  for (const r of javno ?? []) p[r.key] = String(r.value?.text ?? r.value ?? '').trim()
  for (const r of tajno ?? []) p[r.key] = String(r.value ?? '').trim()

  // Koji ERP statusi znače "narudžba je potvrđena". Zadano samo 3 (Odobrena).
  // Namjerno strogo: 2 "Na čekanju" je i dalje neodlučeno, a slanje prerano
  // vraća nas na problem zbog kojeg ovo uopće postoji.
  const lista = (p.mjerenje_erp_status_konverzije || '3')
    .split(',').map((x) => parseInt(x.trim(), 10)).filter(Number.isInteger)

  return { ...p, statusiPotvrde: new Set(lista.length ? lista : [3]) }
}

/**
 * Prođi kroz neposlane narudžbe, osvježi im ERP status i pošalji konverziju
 * onima koje su potvrđene.
 */
export async function posaljiKonverzije({ dryRun = false } = {}) {
  const supabase = serviceClient()
  const post = await ucitajPostavke(supabase)

  const { data: narudzbe, error } = await supabase
    .from('orders')
    .select('id, order_number, erp_order_id, erp_status, total, shipping_cost, items, atribucija, customer_email, customer_phone, shipping_city, created_at')
    .not('erp_order_id', 'is', null)
    .is('konverzija_poslana_at', null)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error

  if (!narudzbe?.length) return { cekalo: 0, poslano: 0, promijenjenStatus: 0 }

  const statusi = await dohvatiErpStatuse()

  let poslano = 0, promijenjenStatus = 0, greske = 0
  const rezultati = []

  for (const n of narudzbe) {
    const status = statusi.get(n.erp_order_id)
    if (status == null) continue                     // ERP je još ne vidi

    if (status !== n.erp_status) {
      if (!dryRun) await supabase.from('orders').update({ erp_status: status }).eq('id', n.id)
      promijenjenStatus++
    }
    if (!post.statusiPotvrde.has(status)) continue   // još nije potvrđena

    if (dryRun) { rezultati.push({ broj: n.order_number, status, bi_poslao: true }); continue }

    try {
      // Namjerno serijski po narudžbi, ali obje platforme usporedo: ako
      // jedna padne, druga je svejedno primila, a greška se zabilježi.
      const [meta, google] = await Promise.allSettled([
        posaljiMeti({
          pixelId:  post.mjerenje_meta_pixel_id,
          token:    post.meta_capi_token,
          testCode: post.meta_test_event_code || null,
          narudzba: n,
        }),
        posaljiGoogleu({
          measurementId: post.mjerenje_ga4_id,
          apiSecret:     post.ga4_api_secret,
          narudzba:      n,
        }),
      ])

      const problemi = [meta, google]
        .filter((r) => r.status === 'rejected')
        .map((r) => String(r.reason?.message || r.reason))

      // Označava se poslanom i kad jedna platforma padne — inače bi se ona
      // koja je uspjela slala ponovo pri svakom prolazu i duplirala konverzije.
      // Deduplikacija po event_id vrijedi 48 h, a metla se vrti satima.
      await supabase.from('orders').update({
        konverzija_poslana_at: new Date().toISOString(),
        konverzija_greska: problemi.length ? problemi.join(' | ') : null,
      }).eq('id', n.id)

      if (problemi.length) { greske++; console.warn('konverzije:', n.order_number, problemi.join(' | ')) }
      else poslano++
      rezultati.push({ broj: n.order_number, status, problemi })
    } catch (err) {
      greske++
      await supabase.from('orders')
        .update({ konverzija_greska: String(err.message || err) }).eq('id', n.id)
    }
  }

  return { cekalo: narudzbe.length, poslano, greske, promijenjenStatus, dryRun, rezultati }
}
